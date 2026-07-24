import { prisma, disconnectPrisma } from "../src/utilities/prisma";
import { AccountService } from "../src/account/AccountService";
import { BalanceService } from "../src/balance/BalanceService";
import { TransactionService } from "../src/transaction/TransactionService";

describe("Shared Prisma client", () => {
    it("exports a client exposing the expected Prisma runtime API", () => {
        expect(typeof prisma.$connect).toBe("function");
        expect(typeof prisma.$disconnect).toBe("function");
        expect(typeof prisma.$transaction).toBe("function");
    });

    it("is reused by every BaseService subclass instead of constructing a new client", () => {
        const accountService = new AccountService();
        const balanceService = new BalanceService();

        expect((accountService as any).prisma).toBe(prisma);
        expect((balanceService as any).prisma).toBe(prisma);
    });

    it("is reused by services composed internally by other services", () => {
        // TransactionService internally constructs AccountService, TransactionItemService,
        // and TransactionProcessorService — those composed instances must reuse the same
        // client rather than opening additional connection pools.
        const transactionService = new TransactionService();

        expect((transactionService as any).prisma).toBe(prisma);
        expect((transactionService as any).accountService.prisma).toBe(prisma);
        expect((transactionService as any).transactionItemService.prisma).toBe(prisma);
        expect((transactionService as any).transactionProcessor.prisma).toBe(prisma);
    });

    it("disconnects cleanly without throwing", async () => {
        await expect(disconnectPrisma()).resolves.toBeUndefined();
    });
});
