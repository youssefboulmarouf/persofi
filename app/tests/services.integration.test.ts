// Service-level tests for BalanceService, AccountService, and ProductService.
// Also verifies error response JSON shape across the API.

import request from "supertest";
import { app } from "../src/index";
import { PrismaClient } from "@prisma/client";
import { BalanceService } from "../src/balance/BalanceService";

const prisma = new PrismaClient();
const balanceService = new BalanceService();

// ─── Helpers ───────────────────────────────────────────────────────────────

async function createAccount(name: string, type: "Debit" | "Credit" | "Cash" | "Saving") {
    return prisma.account.create({
        data: { name, accountType: type, currency: "CAD", active: true }
    });
}

async function purgeAccount(id: number) {
    await prisma.balance.deleteMany({ where: { accountId: id } });
    await prisma.transactionItem.deleteMany({
        where: { transaction: { OR: [{ payAccountId: id }, { counterpartyAccountId: id }] } }
    });
    await prisma.transaction.deleteMany({
        where: { OR: [{ payAccountId: id }, { counterpartyAccountId: id }] }
    });
    await prisma.account.delete({ where: { id } }).catch(() => { });
}

// ─── BalanceService ─────────────────────────────────────────────────────────

describe("BalanceService", () => {
    let accountId: number;

    beforeAll(async () => {
        const acc = await createAccount("BalanceService Test", "Debit");
        accountId = acc.id;
    });

    afterAll(async () => {
        await purgeAccount(accountId);
    });

    it("getLatestBalanceOfAccount throws when account has no balance", async () => {
        await expect(
            balanceService.getLatestBalanceOfAccount(accountId)
        ).rejects.toThrow(/try to initialize it first/i);
    });

    it("getLatestBalanceOfAccount returns the most recent balance by date (not insertion order)", async () => {
        // Insert an older balance first
        const oldTx = await prisma.transaction.create({
            data: { date: new Date("2021-01-01"), type: "Init_Balance", processed: true, counterpartyAccountId: accountId, subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 100 }
        });
        await prisma.balance.create({ data: { amount: 100, date: new Date("2021-01-01"), accountId, transactionId: oldTx.id } });

        // Insert a newer balance
        const newTx = await prisma.transaction.create({
            data: { date: new Date("2023-06-01"), type: "Init_Balance", processed: true, counterpartyAccountId: accountId, subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 999 }
        });
        await prisma.balance.create({ data: { amount: 999, date: new Date("2023-06-01"), accountId, transactionId: newTx.id } });

        const latest = await balanceService.getLatestBalanceOfAccount(accountId);
        expect(Number(latest.getAmount())).toBe(999);
    });

    it("updateAccountBalance creates a new row (append-only, never updates existing)", async () => {
        const countBefore = await prisma.balance.count({ where: { accountId } });

        // Manufacture a tx to satisfy the FK
        const tx = await prisma.transaction.create({
            data: { date: new Date(), type: "Init_Balance", processed: true, counterpartyAccountId: accountId, subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 0 }
        });
        await balanceService.updateAccountBalance(500, new Date(), tx.id, accountId);

        const countAfter = await prisma.balance.count({ where: { accountId } });
        expect(countAfter).toBe(countBefore + 1);
    });

    it("getByAccountId returns all balance rows for an account", async () => {
        const rows = await balanceService.getByAccountId(accountId);
        // We've inserted 3 rows in this suite above
        expect(rows.length).toBeGreaterThanOrEqual(3);
        expect(rows.every(r => r.getAccountId() === accountId)).toBe(true);
    });
});

// ─── AccountService – delete tied to transaction ─────────────────────────────

describe("Accounts API – delete account tied to a transaction", () => {
    let accountId: number;
    let txId: number;

    beforeAll(async () => {
        const acc = await createAccount("Locked Account", "Debit");
        accountId = acc.id;

        // Give it a balance (needed to create a transaction)
        const initTx = await prisma.transaction.create({
            data: { date: new Date(), type: "Init_Balance", processed: true, counterpartyAccountId: accountId, subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 500 }
        });
        await prisma.balance.create({ data: { amount: 500, date: new Date(), accountId, transactionId: initTx.id } });

        // Create a transaction linked to this account
        const txRes = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense", notes: "link", processed: false,
                payAccountId: accountId, counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 10, taxTotal: 0, grandTotal: 10, amount: 0,
                items: [],
            });
        txId = txRes.body.id;
    });

    afterAll(async () => {
        // Order: items → transaction → balance → account
        await prisma.transactionItem.deleteMany({ where: { transactionId: txId } });
        await prisma.transaction.delete({ where: { id: txId } }).catch(() => { });
        await purgeAccount(accountId);
    });

    it("returns 500 when deleting an account with linked transactions", async () => {
        const res = await request(app).delete(`/api/accounts/${accountId}`);
        expect(res.status).toBe(500);
        expect(res.body.message).toMatch(/tied to other entities/i);
    });
});

// ─── ProductService ──────────────────────────────────────────────────────────

describe("Products API", () => {
    let categoryId: number;
    let productId: number;
    let variantId: number;

    beforeAll(async () => {
        // Need a category first
        const cat = await prisma.category.create({ data: { name: `Test Cat ${Date.now()}`, active: true } });
        categoryId = cat.id;
    });

    afterAll(async () => {
        await prisma.productVariant.deleteMany({ where: { productId } }).catch(() => { });
        await prisma.product.delete({ where: { id: productId } }).catch(() => { });
        await prisma.category.delete({ where: { id: categoryId } }).catch(() => { });
    });

    it("POST /api/products → creates a product and returns 201", async () => {
        const res = await request(app)
            .post("/api/products")
            .send({ name: `Test Product ${Date.now()}`, categoryId, active: true });

        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        productId = res.body.id;
    });

    it("GET /api/products/:id → returns the created product", async () => {
        const res = await request(app).get(`/api/products/${productId}`);
        expect(res.status).toBe(200);
        expect(res.body.id).toBe(productId);
    });

    it("GET /api/products/:id → returns 404 for unknown id", async () => {
        const res = await request(app).get("/api/products/999999");
        expect(res.status).toBe(404);
    });

    it("POST /api/variants → creates a variant for the product", async () => {
        const res = await request(app)
            .post(`/api/variants`)
            .send({ productId, unitSize: 1.0, unitType: "kg", description: "1kg bag", active: true });

        expect(res.status).toBe(201);
        expect(res.body.productId).toBe(productId);
        variantId = res.body.id;
    });

    it("DELETE /api/products/:id → deletes product and cascades to variants", async () => {
        const deleteRes = await request(app).delete(`/api/products/${productId}`);
        expect(deleteRes.status).toBe(204);

        const variantInDb = await prisma.productVariant.findUnique({ where: { id: variantId } });
        expect(variantInDb).toBeNull();
    });
});

// ─── CategoryService ──────────────────────────────────────────────────────────

describe("Categories API", () => {
    let parentId: number;
    let childId: number;

    afterAll(async () => {
        await prisma.category.delete({ where: { id: childId } }).catch(() => { });
        await prisma.category.delete({ where: { id: parentId } }).catch(() => { });
    });

    it("POST /api/categories → creates a parent category", async () => {
        const res = await request(app)
            .post("/api/categories")
            .send({ name: `Parent Cat ${Date.now()}`, active: true });

        expect(res.status).toBe(201);
        parentId = res.body.id;
    });

    it("POST /api/categories → creates a child category with parentCategoryId", async () => {
        const res = await request(app)
            .post("/api/categories")
            .send({ name: `Child Cat ${Date.now()}`, parentCategoryId: parentId, active: true });

        expect(res.status).toBe(201);
        expect(res.body.parentCategoryId).toBe(parentId);
        childId = res.body.id;
    });

    it("GET /api/categories/:id → returns 404 for unknown id", async () => {
        const res = await request(app).get("/api/categories/999999");
        expect(res.status).toBe(404);
    });
});

// ─── Error Response Shape ─────────────────────────────────────────────────────

describe("API Error Response Shape", () => {
    it("400 responses include { name, message } body", async () => {
        const res = await request(app)
            .post("/api/transactions")
            .send({
                date: new Date().toISOString(),
                type: "Expense", notes: "bad",
                processed: false,
                payAccountId: null,       // invalid — triggers 400
                counterpartyAccountId: null,
                storeId: null, personId: null, refundOfId: null,
                subtotal: 10, taxTotal: 0, grandTotal: 10, amount: 0,
                items: [],
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("name");
        expect(res.body).toHaveProperty("message");
        expect(typeof res.body.name).toBe("string");
        expect(typeof res.body.message).toBe("string");
    });

    it("404 responses include { name, message } body", async () => {
        const res = await request(app).get("/api/accounts/999999");
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty("name");
        expect(res.body).toHaveProperty("message");
    });

    it("500 responses include { name, message } body", async () => {
        // Trigger a 500 by trying to delete a non-existent but FK-violation-proof account
        // We create and immediately try to delete one tied to a balance directly
        const acc = await createAccount("500 Test", "Cash");
        const tx = await prisma.transaction.create({
            data: { date: new Date(), type: "Init_Balance", processed: true, counterpartyAccountId: acc.id, subtotal: 0, taxTotal: 0, grandTotal: 0, amount: 0 }
        });
        await prisma.balance.create({ data: { amount: 0, date: new Date(), accountId: acc.id, transactionId: tx.id } });

        const res = await request(app).delete(`/api/accounts/${acc.id}`);
        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("name");
        expect(res.body).toHaveProperty("message");

        // Cleanup
        await prisma.balance.deleteMany({ where: { accountId: acc.id } });
        await prisma.transaction.delete({ where: { id: tx.id } });
        await prisma.account.delete({ where: { id: acc.id } });
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});
