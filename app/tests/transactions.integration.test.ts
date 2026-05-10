import request from "supertest";
import { app } from "../src/index";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Helpers ───────────────────────────────────────────────────────────────

async function createDebitAccount(name = "Test Debit") {
    return prisma.account.create({
        data: { name, accountType: "Debit", currency: "CAD", active: true }
    });
}

async function createCreditAccount(name = "Test Credit") {
    return prisma.account.create({
        data: { name, accountType: "Credit", currency: "CAD", active: true }
    });
}

async function initBalance(accountId: number, amount: number) {
    const tx = await prisma.transaction.create({
        data: {
            date: new Date(), type: "Init_Balance", processed: true,
            counterpartyAccountId: accountId,
            subtotal: 0, taxTotal: 0, grandTotal: 0, amount, notes: "init"
        }
    });
    await prisma.balance.create({
        data: { amount, date: new Date(), accountId, transactionId: tx.id }
    });
    return tx;
}

async function cleanupAccount(id: number) {
    // Delete balances → transactions → account
    await prisma.balance.deleteMany({ where: { accountId: id } });
    await prisma.transactionItem.deleteMany({
        where: { transaction: { OR: [{ payAccountId: id }, { counterpartyAccountId: id }] } }
    });
    await prisma.transaction.deleteMany({
        where: { OR: [{ payAccountId: id }, { counterpartyAccountId: id }] }
    });
    await prisma.account.delete({ where: { id } });
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe("Accounts API", () => {
    it("GET /api/accounts → returns 200 with array", async () => {
        const res = await request(app).get("/api/accounts");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });

    it("POST /api/accounts → creates account and returns 201", async () => {
        const res = await request(app)
            .post("/api/accounts")
            .send({ name: "API Test Account", accountType: "Debit", currency: "CAD", active: true });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe("API Test Account");

        await cleanupAccount(res.body.id);
    });

    it("GET /api/accounts/:id → returns 404 for unknown id", async () => {
        const res = await request(app).get("/api/accounts/999999");
        expect(res.status).toBe(404);
    });

    it("PUT /api/accounts/:id → returns 400 for mismatched IDs", async () => {
        const acc = await createDebitAccount("Mismatch Test");
        const res = await request(app)
            .put(`/api/accounts/${acc.id}`)
            .send({ id: acc.id + 1, name: "New Name", accountType: "Debit", currency: "CAD", active: true });

        expect(res.status).toBe(400);
        await cleanupAccount(acc.id);
    });
});

describe("Transactions API – Create", () => {
    let debitAccountId: number;

    beforeAll(async () => {
        const acc = await createDebitAccount("Tx Create Test Account");
        debitAccountId = acc.id;
        await initBalance(debitAccountId, 1000);
    });

    afterAll(async () => {
        await cleanupAccount(debitAccountId);
    });

    it("POST /api/transactions → creates valid EXPENSE and returns 201", async () => {
        const res = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense",
                notes: "Test expense",
                processed: false,
                payAccountId: debitAccountId,
                counterpartyAccountId: null,
                storeId: null,
                personId: null,
                refundOfId: null,
                subtotal: 10,
                taxTotal: 1,
                grandTotal: 11,
                amount: 0,
                items: [],
            });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();

        // Cleanup
        await prisma.transaction.delete({ where: { id: res.body.id } });
    });

    it("POST /api/transactions → returns 400 for invalid EXPENSE (missing payAccountId)", async () => {
        const res = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense",
                notes: "Bad expense",
                processed: false,
                payAccountId: null,      // ← invalid
                counterpartyAccountId: null,
                storeId: null,
                personId: null,
                refundOfId: null,
                subtotal: 10,
                taxTotal: 1,
                grandTotal: 11,
                amount: 0,
                items: [],
            });

        expect(res.status).toBe(400);
    });

    it("POST /api/transactions → returns 400 for unknown transaction type", async () => {
        const res = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "InvalidType",
                notes: "",
                processed: false,
                payAccountId: debitAccountId,
                counterpartyAccountId: null,
                storeId: null,
                personId: null,
                refundOfId: null,
                subtotal: 10,
                taxTotal: 0,
                grandTotal: 10,
                amount: 0,
                items: [],
            });

        expect(res.status).toBeGreaterThanOrEqual(400);
    });
});

describe("Transactions API – Process", () => {
    let debitAccountId: number;
    let creditAccountId: number;

    beforeAll(async () => {
        const debit = await createDebitAccount("Process Test Debit");
        const credit = await createCreditAccount("Process Test Credit");
        debitAccountId = debit.id;
        creditAccountId = credit.id;
        await initBalance(debitAccountId, 500);
        await initBalance(creditAccountId, 100);
    });

    afterAll(async () => {
        await cleanupAccount(debitAccountId);
        await cleanupAccount(creditAccountId);
    });

    it("processes EXPENSE on Debit → balance decreases", async () => {
        // Create transaction
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense", notes: "Test", processed: false,
                payAccountId: debitAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 50, taxTotal: 5, grandTotal: 55, amount: 0,
                items: [],
            });
        expect(createRes.status).toBe(201);
        const txId = createRes.body.id;

        // Process it
        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(201);

        // Check balance decreased from 500 to 445
        const balances = await prisma.balance.findMany({
            where: { accountId: debitAccountId },
            orderBy: { date: "desc" }
        });
        expect(Number(balances[0].amount)).toBe(445);

        // Cleanup
        await prisma.balance.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("processes EXPENSE on Credit → balance increases (debt grows)", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense", notes: "Credit expense", processed: false,
                payAccountId: creditAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 20, taxTotal: 0, grandTotal: 20, amount: 0,
                items: [],
            });
        expect(createRes.status).toBe(201);
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(201);

        const balances = await prisma.balance.findMany({
            where: { accountId: creditAccountId },
            orderBy: { date: "desc" }
        });
        expect(Number(balances[0].amount)).toBe(120); // 100 + 20

        // Cleanup
        await prisma.balance.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("returns 400 when processing an already-processed transaction", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense", notes: "Already processed", processed: false,
                payAccountId: debitAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 10, taxTotal: 0, grandTotal: 10, amount: 0,
                items: [],
            });
        const txId = createRes.body.id;

        // Process once
        await request(app).post(`/api/transactions/${txId}/process`);
        // Process again → should fail
        const secondProcess = await request(app).post(`/api/transactions/${txId}/process`);
        expect(secondProcess.status).toBe(400);

        // Cleanup
        await prisma.balance.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("returns 404 when processing a non-existent transaction", async () => {
        const res = await request(app).post("/api/transactions/999999/process");
        expect(res.status).toBe(404);
    });
});

describe("Transactions API – Update & Delete", () => {
    let debitAccountId: number;

    beforeAll(async () => {
        const acc = await createDebitAccount("Update Test Account");
        debitAccountId = acc.id;
        await initBalance(debitAccountId, 1000);
    });

    afterAll(async () => {
        await cleanupAccount(debitAccountId);
    });

    it("PUT /api/transactions/:id → updates successfully", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense", notes: "Original", processed: false,
                payAccountId: debitAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 10, taxTotal: 0, grandTotal: 10, amount: 0,
                items: [],
            });
        const txId = createRes.body.id;

        const updateRes = await request(app)
            .put(`/api/transactions/${txId}`)
            .send({
                id: txId,
                date: new Date().toISOString(),
                type: "Expense", notes: "Updated", processed: false,
                payAccountId: debitAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 20, taxTotal: 0, grandTotal: 20, amount: 0,
                items: [],
            });

        expect(updateRes.status).toBe(200);

        // Cleanup
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("PUT /api/transactions/:id → returns 400 for mismatched IDs", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense", notes: "Mismatch", processed: false,
                payAccountId: debitAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 10, taxTotal: 0, grandTotal: 10, amount: 0,
                items: [],
            });
        const txId = createRes.body.id;

        const updateRes = await request(app)
            .put(`/api/transactions/${txId}`)
            .send({
                id: txId + 999,   // ← mismatch
                date: new Date().toISOString(),
                type: "Expense", notes: "Mismatch", processed: false,
                payAccountId: debitAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 10, taxTotal: 0, grandTotal: 10, amount: 0,
                items: [],
            });

        expect(updateRes.status).toBe(400);
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("PUT /api/transactions/:id → returns 400 when updating processed transaction", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense", notes: "Will be processed", processed: false,
                payAccountId: debitAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 10, taxTotal: 0, grandTotal: 10, amount: 0,
                items: [],
            });
        const txId = createRes.body.id;
        await request(app).post(`/api/transactions/${txId}/process`);

        const updateRes = await request(app)
            .put(`/api/transactions/${txId}`)
            .send({
                id: txId,
                date: new Date().toISOString(),
                type: "Expense", notes: "Try to update processed", processed: true,
                payAccountId: debitAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 10, taxTotal: 0, grandTotal: 10, amount: 0,
                items: [],
            });

        expect(updateRes.status).toBe(400);

        await prisma.balance.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("DELETE /api/transactions/:id → returns 204", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense", notes: "To delete", processed: false,
                payAccountId: debitAccountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 10, taxTotal: 0, grandTotal: 10, amount: 0,
                items: [],
            });

        const deleteRes = await request(app).delete(`/api/transactions/${createRes.body.id}`);
        expect(deleteRes.status).toBe(204);
    });
});

describe("Transactions – INCOME processing", () => {
    let savingAccountId: number;

    beforeAll(async () => {
        const acc = await prisma.account.create({
            data: { name: "Income Test Saving", accountType: "Saving", currency: "CAD", active: true }
        });
        savingAccountId = acc.id;
        await initBalance(savingAccountId, 200);
    });

    afterAll(async () => {
        await prisma.balance.deleteMany({ where: { accountId: savingAccountId } });
        await prisma.transaction.deleteMany({ where: { counterpartyAccountId: savingAccountId } });
        await prisma.account.delete({ where: { id: savingAccountId } });
    });

    it("processes INCOME on Saving → balance increases", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Income", notes: "Salary", processed: false,
                payAccountId: null, counterpartyAccountId: savingAccountId,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 300,
                items: [],
            });
        expect(createRes.status).toBe(201);
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(201);

        const balances = await prisma.balance.findMany({
            where: { accountId: savingAccountId },
            orderBy: { date: "desc" }
        });
        expect(Number(balances[0].amount)).toBe(500); // 200 + 300

        await prisma.balance.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("returns 400 when INCOME targets a Credit account", async () => {
        const creditAcc = await createCreditAccount("Income on Credit Test");
        await initBalance(creditAcc.id, 100);

        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Income", notes: "Bad income", processed: false,
                payAccountId: null, counterpartyAccountId: creditAcc.id,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 100,
                items: [],
            });
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(400);

        await prisma.transaction.delete({ where: { id: txId } });
        await cleanupAccount(creditAcc.id);
    });
});

describe("Transactions – TRANSFER processing", () => {
    let fromAccountId: number;
    let toAccountId: number;

    beforeAll(async () => {
        const from = await createDebitAccount("Transfer From");
        const to = await createDebitAccount("Transfer To");
        fromAccountId = from.id;
        toAccountId = to.id;
        await initBalance(fromAccountId, 1000);
        await initBalance(toAccountId, 500);
    });

    afterAll(async () => {
        await cleanupAccount(fromAccountId);
        await cleanupAccount(toAccountId);
    });

    it("processes TRANSFER → from decreases, to increases", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Transfer", notes: "Move money", processed: false,
                payAccountId: fromAccountId, counterpartyAccountId: toAccountId,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 200,
                items: [],
            });
        expect(createRes.status).toBe(201);
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(201);

        const fromBalances = await prisma.balance.findMany({
            where: { accountId: fromAccountId }, orderBy: { date: "desc" }
        });
        const toBalances = await prisma.balance.findMany({
            where: { accountId: toAccountId }, orderBy: { date: "desc" }
        });

        expect(Number(fromBalances[0].amount)).toBe(800);  // 1000 - 200
        expect(Number(toBalances[0].amount)).toBe(700);    // 500 + 200

        await prisma.balance.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });
});

describe("Transactions – CREDIT_PAYMENT processing", () => {
    let debitAccountId: number;
    let creditAccountId: number;

    beforeAll(async () => {
        const debit = await createDebitAccount("CreditPay Debit");
        const credit = await createCreditAccount("CreditPay Credit");
        debitAccountId = debit.id;
        creditAccountId = credit.id;
        await initBalance(debitAccountId, 1000);
        await initBalance(creditAccountId, 300); // 300 in debt
    });

    afterAll(async () => {
        await cleanupAccount(debitAccountId);
        await cleanupAccount(creditAccountId);
    });

    it("processes CREDIT_PAYMENT → debit decreases, credit balance decreases (debt paid)", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Credit_Payment", notes: "Pay credit bill", processed: false,
                payAccountId: debitAccountId, counterpartyAccountId: creditAccountId,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 150,
                items: [],
            });
        expect(createRes.status).toBe(201);
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(201);

        const debitBalances = await prisma.balance.findMany({
            where: { accountId: debitAccountId }, orderBy: { date: "desc" }
        });
        const creditBalances = await prisma.balance.findMany({
            where: { accountId: creditAccountId }, orderBy: { date: "desc" }
        });

        expect(Number(debitBalances[0].amount)).toBe(850);  // 1000 - 150
        expect(Number(creditBalances[0].amount)).toBe(150); // 300 - 150

        await prisma.balance.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } });
    });

    it("returns 400 when CREDIT_PAYMENT payAccount is a Credit account", async () => {
        const createRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Credit_Payment", notes: "Invalid", processed: false,
                payAccountId: creditAccountId,       // ← Credit can't be the payer
                counterpartyAccountId: debitAccountId,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 100,
                items: [],
            });
        const txId = createRes.body.id;

        const processRes = await request(app).post(`/api/transactions/${txId}/process`);
        expect(processRes.status).toBe(400);

        await prisma.transaction.delete({ where: { id: txId } });
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});
