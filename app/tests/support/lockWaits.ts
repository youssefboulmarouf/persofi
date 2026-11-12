import { PrismaClient } from "@prisma/client";

// The disposable test stack supplies a root observer for performance_schema only.
const observer = new PrismaClient({
    datasources: {
        db: { url: process.env.TEST_OBSERVER_DATABASE_URL ?? process.env.DATABASE_URL },
    },
});

/** Resolves once MySQL reports a session blocked on a row lock of `Transaction`. */
export async function waitForLockWait(): Promise<void> {
    const deadline = Date.now() + 4000;
    do {
        const [row] = await observer.$queryRaw<{ n: bigint }[]>`
            SELECT COUNT(*) AS n
            FROM performance_schema.data_lock_waits AS waits
            JOIN performance_schema.data_locks AS locks
              ON locks.ENGINE = waits.ENGINE
             AND locks.ENGINE_LOCK_ID = waits.REQUESTING_ENGINE_LOCK_ID
            WHERE locks.OBJECT_SCHEMA = DATABASE()
              AND locks.OBJECT_NAME = 'Transaction'
        `;
        if (Number(row.n) > 0) return;
        await new Promise((resolve) => setTimeout(resolve, 25));
    } while (Date.now() < deadline);
    throw new Error("MySQL did not report the expected row-lock wait");
}

export async function disconnectLockObserver(): Promise<void> {
    await observer.$disconnect();
}
