import request from "supertest";
import { app } from "../src/index";
import { PrismaClient } from "@prisma/client";
import { TransactionItemService } from "../src/transaction-item/TransactionItemService";
import * as references from "../src/transaction/TransactionReferences";

// R1-05: atomic create/update, stored-state processed check, and reference validation.

const prisma = new PrismaClient();
const MISSING_ID = 999999;

let accountId: number;

function expenseBody(overrides: Record<string, unknown> = {}) {
    return {
        date: new Date().toISOString(),
        type: "Expense",
        notes: "original",
        processed: false,
        payAccountId: accountId,
        counterpartyAccountId: null,
        storeId: null,
        personId: null,
        refundOfId: null,
        subtotal: 10,
        taxTotal: 0,
        grandTotal: 10,
        amount: 0,
        items: [
            { description: "first", quantity: 1, unitPrice: 4, lineTotal: 4 },
            { description: "second", quantity: 2, unitPrice: 3, lineTotal: 6 },
        ],
        ...overrides,
    };
}

async function createExpense(overrides: Record<string, unknown> = {}): Promise<number> {
    const res = await request(app).post("/api/transactions").send(expenseBody(overrides));
    expect(res.status).toBe(201);
    return res.body.id;
}

async function snapshot(id: number) {
    const tx = await prisma.transaction.findUniqueOrThrow({
        where: { id },
        include: { items: { orderBy: { id: "asc" } } },
    });
    return {
        notes: tx.notes,
        processed: tx.processed,
        storeId: tx.storeId,
        personId: tx.personId,
        grandTotal: tx.grandTotal?.toString(),
        items: tx.items.map((it) => ({
            id: it.id,
            description: it.description,
            lineTotal: it.lineTotal.toString(),
            variantId: it.variantId,
        })),
    };
}

beforeAll(async () => {
    const account = await prisma.account.create({
        data: { name: "Writes Test", accountType: "Debit", currency: "CAD", active: true },
    });
    accountId = account.id;
    const init = await prisma.transaction.create({
        data: {
            date: new Date(),
            type: "Init_Balance",
            processed: true,
            counterpartyAccountId: accountId,
            amount: 500,
        },
    });
    await prisma.balance.create({
        data: { amount: 500, date: new Date(), accountId, transactionId: init.id },
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

afterAll(async () => {
    await prisma.balance.deleteMany({ where: { accountId } });
    await prisma.transactionItem.deleteMany({
        where: {
            transaction: {
                OR: [{ payAccountId: accountId }, { counterpartyAccountId: accountId }],
            },
        },
    });
    await prisma.transaction.deleteMany({
        where: { OR: [{ payAccountId: accountId }, { counterpartyAccountId: accountId }] },
    });
    await prisma.account.delete({ where: { id: accountId } });
    await prisma.$disconnect();
});

describe("Update – processed state comes from the database", () => {
    it("rejects PUT with processed: false on a processed transaction and changes nothing", async () => {
        const id = await createExpense();
        expect((await request(app).post(`/api/transactions/${id}/process`)).status).toBe(201);
        const before = await snapshot(id);
        const balancesBefore = await prisma.balance.count({ where: { accountId } });

        const res = await request(app)
            .put(`/api/transactions/${id}`)
            .send(
                expenseBody({
                    id,
                    processed: false,
                    notes: "sneaky edit",
                    subtotal: 1,
                    grandTotal: 1,
                    items: [],
                }),
            );

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/processed/i);
        expect(await snapshot(id)).toEqual(before);
        expect(await prisma.balance.count({ where: { accountId } })).toBe(balancesBefore);
    });

    it("returns 404 when updating a transaction that does not exist", async () => {
        const res = await request(app)
            .put(`/api/transactions/${MISSING_ID}`)
            .send(expenseBody({ id: MISSING_ID }));
        expect(res.status).toBe(404);
    });
});

describe("Update – race with processing", () => {
    it("rejects an update when the transaction is processed after the update began", async () => {
        const id = await createExpense();
        const realCheck = references.assertTransactionReferencesExist;

        // The reference check runs inside the update's database transaction, before the
        // write. Process the transaction there, on another connection, to hit the window
        // between the update starting and writing.
        jest.spyOn(references, "assertTransactionReferencesExist").mockImplementationOnce(
            async (db, transaction) => {
                const processRes = await request(app).post(`/api/transactions/${id}/process`);
                expect(processRes.status).toBe(201);
                return realCheck(db, transaction);
            },
        );

        const res = await request(app)
            .put(`/api/transactions/${id}`)
            .send(expenseBody({ id, notes: "racing edit", subtotal: 20, grandTotal: 20 }));

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/processed/i);
        const stored = await snapshot(id);
        expect(stored.processed).toBe(true);
        expect(stored.notes).toBe("original");
        expect(stored.grandTotal).toBe("10");
        expect(await prisma.balance.count({ where: { transactionId: id } })).toBe(1);
    });
});

describe("Update – atomic item replacement", () => {
    it("leaves the transaction and its items unchanged when item insert fails", async () => {
        const id = await createExpense();
        const before = await snapshot(id);

        jest.spyOn(
            TransactionItemService.prototype,
            "createManyForTrnasaction",
        ).mockRejectedValueOnce(new Error("injected item insert failure"));

        const res = await request(app)
            .put(`/api/transactions/${id}`)
            .send(
                expenseBody({
                    id,
                    notes: "should roll back",
                    subtotal: 20,
                    grandTotal: 20,
                    items: [
                        { description: "replacement", quantity: 1, unitPrice: 20, lineTotal: 20 },
                    ],
                }),
            );

        expect(res.status).toBe(500);
        expect(await snapshot(id)).toEqual(before);
    });

    it("replaces fields and items together on success", async () => {
        const id = await createExpense();

        const res = await request(app)
            .put(`/api/transactions/${id}`)
            .send(
                expenseBody({
                    id,
                    notes: "updated",
                    subtotal: 20,
                    grandTotal: 20,
                    items: [
                        { description: "replacement", quantity: 1, unitPrice: 20, lineTotal: 20 },
                    ],
                }),
            );

        expect(res.status).toBe(200);
        const after = await snapshot(id);
        expect(after.notes).toBe("updated");
        expect(after.grandTotal).toBe("20");
        expect(after.items.map((it) => it.description)).toEqual(["replacement"]);
    });
});

describe("Reference validation", () => {
    test.each([
        ["storeId", { storeId: MISSING_ID }, /Store with \[id=999999\] does not exist/],
        ["personId", { personId: MISSING_ID }, /Person with \[id=999999\] does not exist/],
        ["payAccountId", { payAccountId: MISSING_ID }, /Account with \[id=999999\] does not exist/],
        [
            "item variantId",
            {
                items: [
                    {
                        description: "x",
                        quantity: 1,
                        unitPrice: 10,
                        lineTotal: 10,
                        variantId: MISSING_ID,
                    },
                ],
            },
            /Product Variant with \[id=999999\] does not exist/,
        ],
        [
            "item brandId",
            {
                items: [
                    {
                        description: "x",
                        quantity: 1,
                        unitPrice: 10,
                        lineTotal: 10,
                        brandId: MISSING_ID,
                    },
                ],
            },
            /Brand with \[id=999999\] does not exist/,
        ],
        [
            "item categoryId",
            {
                items: [
                    {
                        description: "x",
                        quantity: 1,
                        unitPrice: 10,
                        lineTotal: 10,
                        categoryId: MISSING_ID,
                    },
                ],
            },
            /Category with \[id=999999\] does not exist/,
        ],
    ])(
        "create rejects a missing %s with 400 and writes nothing",
        async (_field, overrides, message) => {
            const countBefore = await prisma.transaction.count();

            const res = await request(app).post("/api/transactions").send(expenseBody(overrides));

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(message);
            expect(await prisma.transaction.count()).toBe(countBefore);
        },
    );

    it("create rejects a non-numeric id with 400 instead of a database error", async () => {
        const res = await request(app)
            .post("/api/transactions")
            .send(expenseBody({ storeId: "abc" }));

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Store id must be an integer/);
    });

    it("create rejects a missing refundOfId with 400", async () => {
        const res = await request(app).post("/api/transactions").send({
            date: new Date().toISOString(),
            type: "Refund",
            notes: "",
            processed: false,
            payAccountId: null,
            counterpartyAccountId: accountId,
            storeId: null,
            personId: null,
            refundOfId: MISSING_ID,
            subtotal: 5,
            taxTotal: 0,
            grandTotal: 5,
            amount: 0,
            items: [],
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Refunded Transaction with \[id=999999\] does not exist/);
    });

    it("update rejects a missing reference with 400 and changes nothing", async () => {
        const id = await createExpense();
        const before = await snapshot(id);

        const res = await request(app)
            .put(`/api/transactions/${id}`)
            .send(expenseBody({ id, notes: "bad ref", storeId: MISSING_ID }));

        expect(res.status).toBe(400);
        expect(await snapshot(id)).toEqual(before);
    });
});
