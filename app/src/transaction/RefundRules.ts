import { Prisma } from "@prisma/client";
import { DbClient } from "../utilities/BaseService";
import { Money } from "../utilities/Money";
import NotFoundError from "../utilities/errors/NotFoundError";
import PostingRuleError, { PostingErrorCode } from "../utilities/errors/PostingRuleError";
import { TransactionJson } from "./TransactionJson";
import { TransactionTypeEnum } from "./TransactionType";

// Refund rules from docs/POSTING_MATRIX.md §4. The check at create/update is advisory;
// the authoritative one runs while processing, after lockForPosting has locked the original.
//
// The refunded sum is a plain read on purpose. The original's row lock already serializes
// every refund of it, and under READ COMMITTED a plain read sees each committed refund. A
// locking read (FOR UPDATE) would also lock sibling refund drafts, which a competing refund
// holds while it waits for the original's lock, and the two would deadlock.

export interface RefundableAmount {
    transactionId: number;
    grandTotal: Prisma.Decimal;
    refunded: Prisma.Decimal;
    remaining: Prisma.Decimal;
}

type Original = {
    id: number;
    type: string;
    processed: boolean;
    payAccountId: number | null;
    grandTotal: Prisma.Decimal | null;
};

/** Remaining refundable amount of a processed expense. Draft refunds don't count. */
export async function getRefundableAmount(
    db: DbClient,
    originalId: number,
): Promise<RefundableAmount> {
    const original = await loadRefundableOriginal(db, originalId);
    return computeRefundable(db, original);
}

/** Rejects a refund whose original isn't a processed expense, or that goes over the remaining amount. */
export async function assertRefundAllowed(db: DbClient, refund: TransactionJson): Promise<void> {
    if (refund.getTransactionType() !== TransactionTypeEnum.REFUND) {
        return;
    }
    const originalId = refund.getRefundOfId();
    if (originalId == null) {
        throw new PostingRuleError(
            PostingErrorCode.REFUND_ORIGINAL_REQUIRED,
            `A refund must reference the expense it refunds`,
            400,
            "refundOfId",
        );
    }

    const original = await loadRefundableOriginal(db, originalId);
    if (refund.getCounterpartyAccountId() !== original.payAccountId) {
        throw new PostingRuleError(
            PostingErrorCode.REFUND_ACCOUNT_MISMATCH,
            `A refund must go back to the original pay account [id=${original.payAccountId}] of transaction [id=${originalId}]`,
            400,
            "counterpartyAccountId",
        );
    }

    const { remaining } = await computeRefundable(db, original);
    if (Money.compare(refund.getGrandTotal(), remaining) > 0) {
        throw new PostingRuleError(
            PostingErrorCode.REFUND_EXCEEDS_REMAINING,
            `Refund of ${Money.serialize(refund.getGrandTotal())} exceeds the remaining refundable amount ${Money.serialize(remaining)} of transaction [id=${originalId}]`,
            409,
            "grandTotal",
        );
    }
}

async function loadRefundableOriginal(db: DbClient, originalId: number): Promise<Original> {
    const original = await db.transaction.findUnique({
        where: { id: originalId },
        select: { id: true, type: true, processed: true, payAccountId: true, grandTotal: true },
    });
    NotFoundError.throwIf(!original, `Transaction with [id:${originalId}] not found`);
    if (original!.type !== TransactionTypeEnum.EXPENSE) {
        throw new PostingRuleError(
            PostingErrorCode.REFUND_ORIGINAL_NOT_EXPENSE,
            `Only an expense can be refunded, but transaction [id=${originalId}] is a ${original!.type}`,
            400,
            "refundOfId",
        );
    }
    if (!original!.processed) {
        throw new PostingRuleError(
            PostingErrorCode.REFUND_ORIGINAL_NOT_PROCESSED,
            `Transaction [id=${originalId}] must be processed before it can be refunded`,
            409,
            "refundOfId",
        );
    }
    return original!;
}

async function computeRefundable(db: DbClient, original: Original): Promise<RefundableAmount> {
    const [row] = await db.$queryRaw<{ total: Prisma.Decimal | string | null }[]>`
        SELECT COALESCE(SUM(grandTotal), 0) AS total
        FROM \`Transaction\`
        WHERE refundOfId = ${original.id} AND processed = true
    `;
    const grandTotal = Money.parse(original.grandTotal ?? 0);
    const refunded = Money.parse(String(row?.total ?? 0));
    return {
        transactionId: original.id,
        grandTotal,
        refunded,
        remaining: Money.subtract(grandTotal, refunded),
    };
}
