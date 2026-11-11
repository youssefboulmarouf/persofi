import request from "supertest";
import { PrismaClient } from "@prisma/client";
import { app } from "../src/index";
import { BalanceService } from "../src/balance/BalanceService";

const prisma = new PrismaClient();
const accountIds: number[] = [];
const initial = 500;

async function makeAccount(name: string): Promise<number> {
    const account = await prisma.account.create({
        data: { name, accountType: "Debit", currency: "CAD", active: true },
    });
    accountIds.push(account.id);
    const transaction = await prisma.transaction.create({
        data: {
            date: new Date(),
            type: "Init_Balance",
            processed: true,
            counterpartyAccountId: account.id,
            amount: initial,
        },
    });
    await prisma.balance.create({
        data: {
            accountId: account.id,
            transactionId: transaction.id,
            amount: initial,
            date: new Date(),
        },
    });
    return account.id;
}

async function draft(
    type: string,
    payAccountId: number,
    counterpartyAccountId: number | null,
    amount: number,
) {
    return prisma.transaction.create({
        data: {
            date: new Date(),
            type,
            processed: false,
            payAccountId,
            counterpartyAccountId,
            amount: type === "Transfer" ? amount : 0,
            subtotal: type === "Expense" ? amount : 0,
            taxTotal: 0,
            grandTotal: type === "Expense" ? amount : 0,
        },
    });
}

async function latest(accountId: number): Promise<string> {
    const row = await prisma.balance.findFirstOrThrow({
        where: { accountId },
        orderBy: { id: "desc" },
    });
    return row.amount!.toFixed(2);
}

let firstAccount: number;
let secondAccount: number;

beforeAll(async () => {
    firstAccount = await makeAccount("Concurrency A");
    secondAccount = await makeAccount("Concurrency B");
});

afterEach(() => jest.restoreAllMocks());

afterAll(async () => {
    await prisma.balance.deleteMany({ where: { accountId: { in: accountIds } } });
    await prisma.transaction.deleteMany({
        where: {
            OR: [
                { payAccountId: { in: accountIds } },
                { counterpartyAccountId: { in: accountIds } },
            ],
        },
    });
    await prisma.account.deleteMany({ where: { id: { in: accountIds } } });
    await prisma.$disconnect();
});

describe("atomic and concurrent posting", () => {
    it("rolls back the claim and first transfer leg when the second leg fails", async () => {
        const beforeA = await latest(firstAccount);
        const beforeB = await latest(secondAccount);
        const transaction = await draft("Transfer", firstAccount, secondAccount, 25);
        const realWrite = BalanceService.prototype.updateAccountBalance;
        let calls = 0;
        jest.spyOn(BalanceService.prototype, "updateAccountBalance").mockImplementation(
            async function (this: BalanceService, ...args) {
                calls++;
                if (calls === 2) throw new Error("second leg failure");
                return realWrite.apply(this, args);
            },
        );

        const response = await request(app).post(`/api/transactions/${transaction.id}/process`);
        expect(response.status).toBe(500);
        expect(await prisma.balance.count({ where: { transactionId: transaction.id } })).toBe(0);
        expect(
            (await prisma.transaction.findUniqueOrThrow({ where: { id: transaction.id } }))
                .processed,
        ).toBe(false);
        expect(await latest(firstAccount)).toBe(beforeA);
        expect(await latest(secondAccount)).toBe(beforeB);
    });

    it("applies only one posting for parallel requests on one draft", async () => {
        const before = Number(await latest(firstAccount));
        const transaction = await draft("Expense", firstAccount, null, 11);
        const results = await Promise.all(
            Array.from({ length: 6 }, () =>
                request(app).post(`/api/transactions/${transaction.id}/process`),
            ),
        );
        expect(results.filter((result) => result.status === 201)).toHaveLength(1);
        expect(results.filter((result) => result.status === 400)).toHaveLength(5);
        expect(await prisma.balance.count({ where: { transactionId: transaction.id } })).toBe(1);
        expect(await latest(firstAccount)).toBe((before - 11).toFixed(2));
    });

    it("preserves every effect from concurrent expenses on the same account", async () => {
        const before = Number(await latest(firstAccount));
        const transactions = await Promise.all(
            [3, 4, 5, 6].map((amount) => draft("Expense", firstAccount, null, amount)),
        );
        const results = await Promise.all(
            transactions.map((transaction) =>
                request(app).post(`/api/transactions/${transaction.id}/process`),
            ),
        );
        expect(results.map((result) => result.status)).toEqual([201, 201, 201, 201]);
        expect(await latest(firstAccount)).toBe((before - 18).toFixed(2));
    });

    it("posts opposite-direction transfers without losing balances", async () => {
        const beforeA = Number(await latest(firstAccount));
        const beforeB = Number(await latest(secondAccount));
        const [aToB, bToA] = await Promise.all([
            draft("Transfer", firstAccount, secondAccount, 17),
            draft("Transfer", secondAccount, firstAccount, 9),
        ]);
        const results = await Promise.all([
            request(app).post(`/api/transactions/${aToB.id}/process`),
            request(app).post(`/api/transactions/${bToA.id}/process`),
        ]);
        expect(results.map((result) => result.status)).toEqual([201, 201]);
        expect(await latest(firstAccount)).toBe((beforeA - 8).toFixed(2));
        expect(await latest(secondAccount)).toBe((beforeB + 8).toFixed(2));
    });
});
