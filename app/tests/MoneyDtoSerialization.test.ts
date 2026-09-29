import { BalanceJson } from "../src/balance/BalanceJson";
import { TransactionItemJson } from "../src/transaction-item/TransactionItemJson";

describe("money DTO serialization", () => {
    it("keeps item prices and balance amounts as JSON numbers", () => {
        const item = TransactionItemJson.from({
            id: 2,
            transactionId: 1,
            description: "Coffee",
            quantity: 1,
            unitPrice: "1.25",
            lineTotal: "1.25",
            variantId: null,
            brandId: null,
            categoryId: null,
        });
        const balance = BalanceJson.from({
            id: 3,
            amount: "10.50",
            date: "2026-01-01T00:00:00.000Z",
            accountId: 4,
            transactionId: 1,
        });

        const itemResponse = JSON.parse(JSON.stringify(item));
        const balanceResponse = JSON.parse(JSON.stringify(balance));
        expect(itemResponse.unitPrice).toBe(1.25);
        expect(itemResponse.lineTotal).toBe(1.25);
        expect(balanceResponse.amount).toBe(10.5);
        expect(typeof itemResponse.lineTotal).toBe("number");
        expect(typeof balanceResponse.amount).toBe("number");
    });
});
