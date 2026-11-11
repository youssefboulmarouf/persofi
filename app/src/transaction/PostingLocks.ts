import { Prisma } from "@prisma/client";
import { DbClient } from "../utilities/BaseService";
import NotFoundError from "../utilities/errors/NotFoundError";

type LockedTransaction = {
    id: number;
    payAccountId: number | null;
    counterpartyAccountId: number | null;
    refundOfId: number | null;
};

/** All posting paths acquire their row locks in this order before ordinary reads. */
export async function lockForPosting(
    tx: DbClient,
    options: { transactionId?: number; accountIds?: number[]; refundOfId?: number | null },
): Promise<void> {
    let stored: LockedTransaction | undefined;
    if (options.transactionId !== undefined) {
        const rows = await tx.$queryRaw<LockedTransaction[]>`
            SELECT id, payAccountId, counterpartyAccountId, refundOfId
            FROM Transaction WHERE id = ${options.transactionId} FOR UPDATE
        `;
        stored = rows[0];
        NotFoundError.throwIf(!stored, `Transaction with [id:${options.transactionId}] not found`);
    }

    const refundOfId = options.refundOfId ?? stored?.refundOfId;
    if (refundOfId != null) {
        const originals = await tx.$queryRaw<{ id: number }[]>`
            SELECT id FROM Transaction WHERE id = ${refundOfId} FOR UPDATE
        `;
        NotFoundError.throwIf(!originals.length, `Transaction with [id:${refundOfId}] not found`);
    }

    const accountIds = [
        ...(options.accountIds ?? []),
        stored?.payAccountId,
        stored?.counterpartyAccountId,
    ]
        .filter((id): id is number => id != null)
        .filter((id, index, ids) => ids.indexOf(id) === index)
        .sort((a, b) => a - b);
    if (accountIds.length) {
        await tx.$queryRaw<{ id: number }[]>`
            SELECT id FROM Account WHERE id IN (${Prisma.join(accountIds)}) ORDER BY id FOR UPDATE
        `;
    }
}
