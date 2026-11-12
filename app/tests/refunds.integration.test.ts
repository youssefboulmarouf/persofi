// Integration tests for refund eligibility and remaining-amount limits (R1-08).

import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../src/index";
import * as refundRules from "../src/transaction/RefundRules";
import { disconnectLockObserver, waitForLockWait } from "./support/lockWaits";

const prisma = new PrismaClient();
const accountIds: number[] = [];

async function makeAccount(name: string, accountType: "Debit" | "Credit"): Promise<number> {
    const account = await prisma.account.create({
        data: { name, accountType, currency: "CAD", active: true },
    });
    accountIds.push(account.id);
    const init = await prisma.transaction.create({
        data: {
            date: new Date(),
            type: "Init_Balance",
            processed: true,
            counterpartyAccountId: account.id,
            amount: 1000,
        },
    });
    await prisma.balance.create({
        data: { accountId: account.id, transactionId: init.id, amount: 1000, date: new Date() },
    });
    return account.id;
}

function expenseBody(payAccountId: number, grandTotal: number) {
    return {
        date: new Date().toISOString(),
        type: "Expense",
        notes: "refundable",
        processed: false,
        payAccountId,
        counterpartyAccountId: null,
        storeId: null,
        personId: null,
        refundOfId: null,
        subtotal: grandTotal,
        taxTotal: 0,
        grandTotal,
        amount: 0,
        items: [],
    };
}

function refundBody(refundOfId: number, counterpartyAccountId: number, grandTotal: number) {
    return {
        date: new Date().toISOString(),
        type: "Refund",
        notes: "refund",
        processed: false,
        payAccountId: null,
        counterpartyAccountId,
        storeId: null,
        personId: null,
        refundOfId,
        subtotal: grandTotal,
        taxTotal: 0,
        grandTotal,
        amount: 0,
        items: [],
    };
}

async function processedExpense(payAccountId: number, grandTotal: number): Promise<number> {
    const created = await request(app)
        .post("/api/transactions")
        .send(expenseBody(payAccountId, grandTotal));
    expect(created.status).toBe(201);
    const processed = await request(app).post(`/api/transactions/${created.body.id}/process`);
    expect(processed.status).toBe(201);
    return created.body.id;
}

async function draftRefund(originalId: number, accountId: number, grandTotal: number) {
    const created = await request(app)
        .post("/api/transactions")
        .send(refundBody(originalId, accountId, grandTotal));
    expect(created.status).toBe(201);
    return created.body.id as number;
}

async function latest(accountId: number): Promise<string> {
    const row = await prisma.balance.findFirstOrThrow({
        where: { accountId },
        orderBy: { id: "desc" },
    });
    return row.amount!.toFixed(2);
}

async function processedRefundSum(originalId: number): Promise<string> {
    const { _sum } = await prisma.transaction.aggregate({
        where: { refundOfId: originalId, processed: true },
        _sum: { grandTotal: true },
    });
    return (_sum.grandTotal ?? 0).toFixed(2);
}

let debit: number;
let otherDebit: number;
let credit: number;

beforeAll(async () => {
    debit = await makeAccount("Refund Rules Debit", "Debit");
    otherDebit = await makeAccount("Refund Rules Other Debit", "Debit");
    credit = await makeAccount("Refund Rules Credit", "Credit");
});

afterAll(async () => {
    await prisma.balance.deleteMany({ where: { accountId: { in: accountIds } } });
    const owned = {
        OR: [{ payAccountId: { in: accountIds } }, { counterpartyAccountId: { in: accountIds } }],
    };
    // Refunds reference their originals, so delete them first.
    await prisma.transaction.deleteMany({ where: { ...owned, type: "Refund" } });
    await prisma.transaction.deleteMany({ where: owned });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    await disconnectLockObserver();
    await prisma.$disconnect();
});

afterEach(() => jest.restoreAllMocks());

describe("refund eligibility", () => {
    it("rejects a refund of a non-expense transaction", async () => {
        const income = await prisma.transaction.create({
            data: {
                date: new Date(),
                type: "Income",
                processed: true,
                counterpartyAccountId: debit,
                amount: 50,
            },
        });
        const res = await request(app)
            .post("/api/transactions")
            .send(refundBody(income.id, debit, 10));
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Only an expense can be refunded/);
        expect(res.body.code).toBe("REFUND_ORIGINAL_NOT_EXPENSE");
    });

    it("rejects a refund of an unprocessed expense", async () => {
        const draft = await request(app).post("/api/transactions").send(expenseBody(debit, 40));
        const res = await request(app)
            .post("/api/transactions")
            .send(refundBody(draft.body.id, debit, 10));
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/must be processed before it can be refunded/);
        expect(res.body.code).toBe("REFUND_ORIGINAL_NOT_PROCESSED");
    });

    it("rejects a refund to an account other than the original pay account", async () => {
        const original = await processedExpense(debit, 30);
        const res = await request(app)
            .post("/api/transactions")
            .send(refundBody(original, otherDebit, 10));
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/original pay account/);
        expect(res.body.code).toBe("REFUND_ACCOUNT_MISMATCH");
    });

    it("rejects an update that points a refund draft at another account", async () => {
        const original = await processedExpense(debit, 30);
        const refundId = await draftRefund(original, debit, 10);
        const res = await request(app)
            .put(`/api/transactions/${refundId}`)
            .send({ ...refundBody(original, otherDebit, 10), id: refundId });
        expect(res.status).toBe(400);
        const stored = await prisma.transaction.findUniqueOrThrow({ where: { id: refundId } });
        expect(stored.counterpartyAccountId).toBe(debit);
    });
});

describe("refund limits", () => {
    it("accepts a full refund and leaves nothing refundable", async () => {
        const original = await processedExpense(credit, 45.5);
        const before = Number(await latest(credit));
        const refundId = await draftRefund(original, credit, 45.5);

        const res = await request(app).post(`/api/transactions/${refundId}/process`);
        expect(res.status).toBe(201);
        expect(await latest(credit)).toBe((before - 45.5).toFixed(2));

        const refundable = await request(app).get(`/api/transactions/${original}/refundable`);
        expect(refundable.status).toBe(200);
        expect(refundable.body).toEqual({
            transactionId: original,
            grandTotal: 45.5,
            refunded: 45.5,
            remaining: 0,
        });
    });

    it("rejects a refund one cent over the remaining amount", async () => {
        const original = await processedExpense(debit, 20);
        const first = await draftRefund(original, debit, 12.5);
        expect((await request(app).post(`/api/transactions/${first}/process`)).status).toBe(201);

        const res = await request(app)
            .post("/api/transactions")
            .send(refundBody(original, debit, 7.51));
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/exceeds the remaining refundable amount 7.5/);
        expect(res.body.code).toBe("REFUND_EXCEEDS_REMAINING");

        const exact = await request(app)
            .post("/api/transactions")
            .send(refundBody(original, debit, 7.5));
        expect(exact.status).toBe(201);
    });

    it("does not count draft refunds toward the refunded total", async () => {
        const original = await processedExpense(debit, 10);
        await draftRefund(original, debit, 10);
        await draftRefund(original, debit, 10);
        const refundable = await request(app).get(`/api/transactions/${original}/refundable`);
        expect(refundable.body.remaining).toBe(10);
    });

    it("rejects the second of two partial refunds that together exceed the original", async () => {
        const original = await processedExpense(debit, 30);
        const first = await draftRefund(original, debit, 20);
        const second = await draftRefund(original, debit, 15);
        expect((await request(app).post(`/api/transactions/${first}/process`)).status).toBe(201);
        const before = await latest(debit);

        const res = await request(app).post(`/api/transactions/${second}/process`);
        expect(res.status).toBe(409);
        expect(res.body.code).toBe("REFUND_EXCEEDS_REMAINING");
        expect(await prisma.balance.count({ where: { transactionId: second } })).toBe(0);
        expect(
            (await prisma.transaction.findUniqueOrThrow({ where: { id: second } })).processed,
        ).toBe(false);
        expect(await latest(debit)).toBe(before);
        expect(await processedRefundSum(original)).toBe("20.00");
    });

    it("processes only one of two parallel refunds that together exceed the original", async () => {
        const original = await processedExpense(debit, 50);
        const before = Number(await latest(debit));
        const [first, second] = [
            await draftRefund(original, debit, 30),
            await draftRefund(original, debit, 30),
        ];

        // Hold the first refund inside its posting transaction, after lockForPosting has locked
        // its own row, the original and the account, but before it reads the refunded sum.
        let releaseFirst!: () => void;
        let firstHoldsLocks!: () => void;
        const release = new Promise<void>((resolve) => (releaseFirst = resolve));
        const holding = new Promise<void>((resolve) => (firstHoldsLocks = resolve));
        const realCheck = refundRules.assertRefundAllowed;
        let calls = 0;
        jest.spyOn(refundRules, "assertRefundAllowed").mockImplementation(async (...args) => {
            if (++calls === 1) {
                firstHoldsLocks();
                await release;
            }
            return realCheck(...args);
        });

        const firstResult = request(app)
            .post(`/api/transactions/${first}/process`)
            .then((res) => res);
        await holding;
        // The second refund locks its own row, then blocks on the original's lock. A locking
        // read of the refunded sum in the first refund would now need the second's row: deadlock.
        const secondResult = request(app)
            .post(`/api/transactions/${second}/process`)
            .then((res) => res);
        try {
            await waitForLockWait();
        } finally {
            releaseFirst();
        }

        const [winner, loser] = await Promise.all([firstResult, secondResult]);
        expect(winner.status).toBe(201);
        expect(loser.status).toBe(409);
        expect(loser.body.code).toBe("REFUND_EXCEEDS_REMAINING");
        expect(calls).toBe(2);
        expect(await processedRefundSum(original)).toBe("30.00");
        expect(await latest(debit)).toBe((before + 30).toFixed(2));
    });

    it("reports 400 for the refundable amount of a non-expense and 404 for a missing one", async () => {
        const income = await prisma.transaction.create({
            data: {
                date: new Date(),
                type: "Income",
                processed: true,
                counterpartyAccountId: debit,
                amount: 5,
            },
        });
        expect((await request(app).get(`/api/transactions/${income.id}/refundable`)).status).toBe(
            400,
        );
        expect((await request(app).get(`/api/transactions/999999/refundable`)).status).toBe(404);
    });
});

describe("processing stored refund drafts", () => {
    // Drafts written directly to the database (e.g. by a restore) skip the API's create checks.
    async function storedRefund(data: {
        refundOfId: number | null;
        counterpartyAccountId: number;
    }) {
        return prisma.transaction.create({
            data: {
                date: new Date(),
                type: "Refund",
                processed: false,
                subtotal: 5,
                taxTotal: 0,
                grandTotal: 5,
                amount: 0,
                ...data,
            },
        });
    }

    async function expectRejectedWithoutEffects(
        transactionId: number,
        message: RegExp,
        code: string,
    ) {
        const before = await latest(debit);
        const res = await request(app).post(`/api/transactions/${transactionId}/process`);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(message);
        expect(res.body.code).toBe(code);
        expect(await prisma.balance.count({ where: { transactionId } })).toBe(0);
        expect(
            (await prisma.transaction.findUniqueOrThrow({ where: { id: transactionId } }))
                .processed,
        ).toBe(false);
        expect(await latest(debit)).toBe(before);
    }

    it("rejects a stored refund without refundOfId", async () => {
        const refund = await storedRefund({ refundOfId: null, counterpartyAccountId: debit });
        await expectRejectedWithoutEffects(
            refund.id,
            /Refund ID cannot be null/,
            "REFUND_ORIGINAL_REQUIRED",
        );
    });

    it("rejects a stored refund aimed at another account", async () => {
        const original = await processedExpense(otherDebit, 30);
        const refund = await storedRefund({ refundOfId: original, counterpartyAccountId: debit });
        await expectRejectedWithoutEffects(
            refund.id,
            /original pay account/,
            "REFUND_ACCOUNT_MISMATCH",
        );
    });
});
