import { Prisma } from "@prisma/client";
import { DbClient } from "../utilities/BaseService";
import { prisma } from "../utilities/prisma";
import AppError from "../utilities/errors/AppError";
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
            FROM \`Transaction\` WHERE id = ${options.transactionId} FOR UPDATE
        `;
        stored = rows[0];
        NotFoundError.throwIf(!stored, `Transaction with [id:${options.transactionId}] not found`);
    }

    const refundOfId = options.refundOfId ?? stored?.refundOfId;
    if (refundOfId != null) {
        const originals = await tx.$queryRaw<{ id: number }[]>`
            SELECT id FROM \`Transaction\` WHERE id = ${refundOfId} FOR UPDATE
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

/**
 * Shared transaction settings and retryable lock-error contract for every posting path.
 * An existingTx must come from an outer runPosting call; this shortcut inherits its
 * isolation level, lock timeout, and error mapping rather than setting them itself.
 */
export async function runPosting<T>(
    work: (tx: DbClient) => Promise<T>,
    existingTx?: DbClient,
): Promise<T> {
    if (existingTx) return work(existingTx);
    try {
        return await prisma.$transaction(
            async (tx) => {
                // This is the first statement; it limits row-lock waits below Prisma's timeout.
                await tx.$executeRaw`SET SESSION innodb_lock_wait_timeout = 5`;
                try {
                    return await work(tx);
                } finally {
                    // Session settings survive transaction boundaries on pooled connections.
                    // A closed transaction may reject the reset; preserve the work outcome.
                    await tx.$executeRaw`SET SESSION innodb_lock_wait_timeout = DEFAULT`.catch(
                        () => undefined,
                    );
                }
            },
            {
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
                maxWait: 10000,
                timeout: 30000,
            },
        );
    } catch (error) {
        const code = (error as { code?: string }).code;
        const mysqlCode = String((error as { meta?: { code?: string | number } }).meta?.code ?? "");
        if (code === "P2034" || (code === "P2010" && ["1205", "1213"].includes(mysqlCode))) {
            throw new AppError(
                "PostingConflict",
                409,
                "Posting was interrupted by another transaction. Please retry.",
                undefined,
                "POSTING_CONFLICT",
            );
        }
        throw error;
    }
}
