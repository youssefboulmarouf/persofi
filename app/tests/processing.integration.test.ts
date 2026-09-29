// Integration tests for REFUND processing, INIT_BALANCE processing,
// Transaction Items persistence, and BalanceService append-only behavior.

import request from "supertest";
import { app } from "../src/index";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────────────────────────

async function createAccount(name: string, type: "Debit" | "Credit" | "Cash" | "Saving") {
    return prisma.account.create({
        data: { name, accountType: type, currency: "CAD", active: true },
    });
}

async function initBalance(accountId: number, amount: number) {
    const tx = await prisma.transaction.create({
        data: {
            date: new Date(),
            type: "Init_Balance",
            processed: true,
            counterpartyAccountId: accountId,
            subtotal: 0,
            taxTotal: 0,
            grandTotal: 0,
            amount,
            notes: "init",
        },
    });
    await prisma.balance.create({
        data: { amount, date: new Date(), accountId, transactionId: tx.id },
    });
    return tx;
}

async function purgeAccount(id: number) {
    await prisma.balance.deleteMany({ where: { accountId: id } });
    await prisma.transactionItem.deleteMany({
        where: { transaction: { OR: [{ payAccountId: id }, { counterpartyAccountId: id }] } },
    });
    await prisma.transaction.deleteMany({
        where: { OR: [{ payAccountId: id }, { counterpartyAccountId: id }] },
    });
    await prisma.account.delete({ where: { id } }).catch(() => {});
}

function expenseBody(payAccountId: number, overrides: object = {}) {
    return {
        date: new Date().toISOString(),
        type: "Expense",
        notes: "test",
        processed: false,
        payAccountId,
        counterpartyAccountId: null,
        storeId: null,
        personId: null,
        refundOfId: null,
        subtotal: 20,
        taxTotal: 0,
        grandTotal: 20,
        amount: 0,
        items: [],
        ...overrides,
    };
}

// ─── REFUND Processing ──────────────────────────────────────────────────────

describe("Transactions – REFUND processing", () => {
    let debitId: number;
    let creditId: number;
    let originalExpenseTxId: number;

    beforeAll(async () => {
        const debit = await createAccount("Refund Debit", "Debit");
        const credit = await createAccount("Refund Credit", "Credit");
        debitId = debit.id;
        creditId = credit.id;
        await initBalance(debitId, 500);
        await initBalance(creditId, 200);

        // Create the original expense that will be refunded
        const expenseRes = await request(app).post("/api/transactions").send(expenseBody(debitId));
        originalExpenseTxId = expenseRes.body.id;
        await request(app).post(`/api/transactions/${originalExpenseTxId}/process`);
    });

    afterAll(async () => {
        await purgeAccount(debitId);
        await purgeAccount(creditId);
    });

    it("processes REFUND on Debit account → balance increases", async () => {
        const balanceBefore = await prisma.balance.findFirst({
            where: { accountId: debitId },
            orderBy: { date: "desc" },
        });
        const amountBefore = Number(balanceBefore!.amount);

        const createRes = await request(app).post("/api/transactions").send({
            date: new Date().toISOString(),
            type: "Refund",
            notes: "refund",
            processed: false,
            payAccountId: null,
            counterpartyAccountId: debitId,
            storeId: null,
            personId: null,
            refundOfId: originalExpenseTxId,
            subtotal: 10,
            taxTotal: 0,
            grandTotal: 10,
            amount: 0,
            items: [],
        });
        expect(createRes.status).toBe(201);
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(201);

        const balanceAfter = await prisma.balance.findFirst({
            where: { accountId: debitId },
            orderBy: { date: "desc" },
        });
        expect(Number(balanceAfter!.amount)).toBe(amountBefore + 10);

        await prisma.balance.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("processes REFUND on Credit account → balance decreases (debt reduces)", async () => {
        // Create expense on credit first
        const expRes = await request(app)
            .post("/api/transactions")
            .send(expenseBody(creditId, { subtotal: 30, grandTotal: 30 }));
        await request(app).post(`/api/transactions/${expRes.body.id}/process`);

        const balanceBefore = await prisma.balance.findFirst({
            where: { accountId: creditId },
            orderBy: { date: "desc" },
        });
        const amountBefore = Number(balanceBefore!.amount);

        const createRes = await request(app).post("/api/transactions").send({
            date: new Date().toISOString(),
            type: "Refund",
            notes: "credit refund",
            processed: false,
            payAccountId: null,
            counterpartyAccountId: creditId,
            storeId: null,
            personId: null,
            refundOfId: expRes.body.id,
            subtotal: 15,
            taxTotal: 0,
            grandTotal: 15,
            amount: 0,
            items: [],
        });
        expect(createRes.status).toBe(201);
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(201);

        const balanceAfter = await prisma.balance.findFirst({
            where: { accountId: creditId },
            orderBy: { date: "desc" },
        });
        expect(Number(balanceAfter!.amount)).toBe(amountBefore - 15);

        // cleanup expense + refund
        await prisma.balance.deleteMany({
            where: { transactionId: { in: [expRes.body.id, txId] } },
        });
        await prisma.transaction.delete({ where: { id: txId } });
        await prisma.transaction.delete({ where: { id: expRes.body.id } });
    });
});

// ─── INIT_BALANCE Processing ────────────────────────────────────────────────

describe("Transactions – INIT_BALANCE processing", () => {
    let freshAccountId: number;
    let preInitAccountId: number;

    beforeAll(async () => {
        const fresh = await createAccount("Fresh No Balance", "Cash");
        freshAccountId = fresh.id;

        const preInit = await createAccount("Already Inited", "Debit");
        preInitAccountId = preInit.id;
        await initBalance(preInitAccountId, 100);
    });

    afterAll(async () => {
        await purgeAccount(freshAccountId);
        await purgeAccount(preInitAccountId);
    });

    it("processes INIT_BALANCE on account with no prior balance → creates first balance row", async () => {
        const countBefore = await prisma.balance.count({ where: { accountId: freshAccountId } });
        expect(countBefore).toBe(0);

        const createRes = await request(app).post("/api/transactions").send({
            date: new Date().toISOString(),
            type: "Init_Balance",
            notes: "opening",
            processed: false,
            payAccountId: null,
            counterpartyAccountId: freshAccountId,
            storeId: null,
            personId: null,
            refundOfId: null,
            subtotal: 0,
            taxTotal: 0,
            grandTotal: 0,
            amount: 250,
            items: [],
        });
        expect(createRes.status).toBe(201);
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(201);

        const balance = await prisma.balance.findFirst({ where: { accountId: freshAccountId } });
        expect(balance).not.toBeNull();
        expect(Number(balance!.amount)).toBe(250);
    });

    it("rejects INIT_BALANCE on account that already has a balance", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                type: "Init_Balance",
                notes: "second init",
                processed: false,
                date: new Date("2020-01-01T00:00:00.000Z").toISOString(),
                payAccountId: null,
                counterpartyAccountId: preInitAccountId,
                storeId: null,
                personId: null,
                refundOfId: null,
                subtotal: 0,
                taxTotal: 0,
                grandTotal: 0,
                amount: 999,
                items: [],
            });
        expect(createRes.status).toBe(201);
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(400);

        await prisma.transaction.delete({ where: { id: txId } });
    });
});

// ─── Balance Append-Only Pattern ────────────────────────────────────────────

describe("Balance – append-only pattern", () => {
    let accountId: number;

    beforeAll(async () => {
        const acc = await createAccount("Append Only Test", "Debit");
        accountId = acc.id;
        await initBalance(accountId, 1000);
    });

    afterAll(async () => {
        await purgeAccount(accountId);
    });

    it("each processed transaction creates a new Balance row (never updates)", async () => {
        const countBefore = await prisma.balance.count({ where: { accountId } });

        // Process an expense
        const createRes = await request(app)
            .post("/api/transactions")
            .send(expenseBody(accountId, { subtotal: 50, grandTotal: 50 }));
        const txId = createRes.body.id;
        await request(app).post(`/api/transactions/${txId}/process`);

        const countAfter = await prisma.balance.count({ where: { accountId } });
        expect(countAfter).toBe(countBefore + 1);

        // Cleanup
        await prisma.balance.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("rejects back-dated processing without writing a balance or marking the transaction", async () => {
        const olderDate = new Date("2020-01-01T00:00:00.000Z");
        const createRes = await request(app)
            .post("/api/transactions")
            .send(
                expenseBody(accountId, {
                    date: olderDate.toISOString(),
                    subtotal: 10,
                    grandTotal: 10,
                }),
            );
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(409);
        expect(processRes.body.message).toMatch(/before the latest balance date/i);
        expect(await prisma.balance.count({ where: { transactionId: txId } })).toBe(0);
        expect(
            (await prisma.transaction.findUniqueOrThrow({ where: { id: txId } })).processed,
        ).toBe(false);

        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("processes date-only transactions on the same day in deterministic balance-id order", async () => {
        const currentLatest = await prisma.balance.findFirst({
            where: { accountId },
            orderBy: [{ id: "desc" }],
        });
        const latestDate = currentLatest!.date;
        const sameDate = new Date(
            Date.UTC(
                latestDate.getUTCFullYear(),
                latestDate.getUTCMonth(),
                latestDate.getUTCDate(),
            ),
        );
        const initialAmount = Number(currentLatest!.amount);
        const first = await request(app)
            .post("/api/transactions")
            .send(
                expenseBody(accountId, {
                    date: sameDate.toISOString(),
                    subtotal: 10,
                    grandTotal: 10,
                }),
            );
        const second = await request(app)
            .post("/api/transactions")
            .send(
                expenseBody(accountId, {
                    date: sameDate.toISOString(),
                    subtotal: 20,
                    grandTotal: 20,
                }),
            );

        expect((await request(app).post(`/api/transactions/${first.body.id}/process`)).status).toBe(
            201,
        );
        expect(
            (await request(app).post(`/api/transactions/${second.body.id}/process`)).status,
        ).toBe(201);
        const latest = await prisma.balance.findFirst({
            where: { accountId },
            orderBy: [{ id: "desc" }],
        });
        expect(Number(latest!.amount)).toBe(initialAmount - 30);

        const txIds = [first.body.id, second.body.id];
        await prisma.balance.deleteMany({ where: { transactionId: { in: txIds } } });
        await prisma.transaction.deleteMany({ where: { id: { in: txIds } } });
    });
});

// ─── Transaction Items ───────────────────────────────────────────────────────

describe("Transaction Items – persistence and lifecycle", () => {
    let accountId: number;

    beforeAll(async () => {
        const acc = await createAccount("Items Test Account", "Debit");
        accountId = acc.id;
        await initBalance(accountId, 500);
    });

    afterAll(async () => {
        await purgeAccount(accountId);
    });

    it("creates an EXPENSE with items and items are persisted with correct transactionId", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                ...expenseBody(accountId),
                subtotal: 15,
                taxTotal: 0,
                grandTotal: 15,
                items: [
                    {
                        description: "Milk",
                        quantity: 2,
                        unitPrice: 5,
                        lineTotal: 10,
                        variantId: null,
                        brandId: null,
                        categoryId: null,
                    },
                    {
                        description: "Bread",
                        quantity: 1,
                        unitPrice: 5,
                        lineTotal: 5,
                        variantId: null,
                        brandId: null,
                        categoryId: null,
                    },
                ],
            });

        expect(createRes.status).toBe(201);
        expect(createRes.body.items).toHaveLength(2);

        const txId = createRes.body.id;
        const itemsInDb = await prisma.transactionItem.findMany({ where: { transactionId: txId } });
        expect(itemsInDb).toHaveLength(2);
        expect(itemsInDb.every((i) => i.transactionId === txId)).toBe(true);

        // Cleanup
        await prisma.transactionItem.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("updating a transaction deletes old items and inserts new ones (no orphans)", async () => {
        // Create with 2 items
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                ...expenseBody(accountId),
                subtotal: 20,
                taxTotal: 0,
                grandTotal: 20,
                items: [
                    {
                        description: "Old Item 1",
                        quantity: 1,
                        unitPrice: 10,
                        lineTotal: 10,
                        variantId: null,
                        brandId: null,
                        categoryId: null,
                    },
                    {
                        description: "Old Item 2",
                        quantity: 1,
                        unitPrice: 10,
                        lineTotal: 10,
                        variantId: null,
                        brandId: null,
                        categoryId: null,
                    },
                ],
            });
        const txId = createRes.body.id;

        // Update with 1 new item
        const updateRes = await request(app)
            .put(`/api/transactions/${txId}`)
            .send({
                id: txId,
                ...expenseBody(accountId),
                subtotal: 30,
                taxTotal: 0,
                grandTotal: 30,
                items: [
                    {
                        description: "New Item",
                        quantity: 1,
                        unitPrice: 30,
                        lineTotal: 30,
                        variantId: null,
                        brandId: null,
                        categoryId: null,
                    },
                ],
            });
        expect(updateRes.status).toBe(200);

        const itemsInDb = await prisma.transactionItem.findMany({ where: { transactionId: txId } });
        // Only 1 item should remain — the old 2 were deleted
        expect(itemsInDb).toHaveLength(1);
        expect(itemsInDb[0].description).toBe("New Item");

        // Cleanup
        await prisma.transactionItem.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("deleting a transaction cascade-deletes its items", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                ...expenseBody(accountId),
                subtotal: 10,
                taxTotal: 0,
                grandTotal: 10,
                items: [
                    {
                        description: "Will be deleted",
                        quantity: 1,
                        unitPrice: 10,
                        lineTotal: 10,
                        variantId: null,
                        brandId: null,
                        categoryId: null,
                    },
                ],
            });
        const txId = createRes.body.id;

        // Confirm item exists
        const beforeDelete = await prisma.transactionItem.count({ where: { transactionId: txId } });
        expect(beforeDelete).toBe(1);

        // Delete the transaction
        const deleteRes = await request(app).delete(`/api/transactions/${txId}`);
        expect(deleteRes.status).toBe(204);

        // Item must be gone
        const afterDelete = await prisma.transactionItem.count({ where: { transactionId: txId } });
        expect(afterDelete).toBe(0);
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});
