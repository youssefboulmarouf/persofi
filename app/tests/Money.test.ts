import { Money } from "../src/utilities/Money";
import { TransactionJson } from "../src/transaction/TransactionJson";
import BadRequestError from "../src/utilities/errors/BadRequestError";

describe("Money", () => {
    it("adds decimal amounts without binary floating-point drift", () => {
        expect(Money.compare(Money.add("0.1", "0.2"), "0.3")).toBe(0);
        expect(Money.serialize(Money.add("19.99", "1.50"))).toBe(21.49);
    });

    it("compares, subtracts, and rounds to two decimal places", () => {
        expect(Money.compare("10.01", "10.00")).toBeGreaterThan(0);
        expect(Money.serialize(Money.subtract("10.00", "0.01"))).toBe(9.99);
        expect(Money.serialize(Money.round("1.005"))).toBe(1.01);
        expect(() => Money.round("not-money")).toThrow("must be a valid number");
        expect(() => Money.round("NaN")).toThrow("must be a finite number");
    });

    it("accepts the Decimal(10,2) boundary and rejects overflow or excess precision", () => {
        expect(Money.serialize(Money.parse("99999999.99"))).toBe(99999999.99);
        expect(() => Money.parse("100000000.00")).toThrow("exceeds the maximum value");
        expect(() => Money.parse("1.001")).toThrow("at most 2 decimal places");
        expect(() => Money.parse("NaN")).toThrow("finite number");
    });

    it("only reports a field when the caller names one", () => {
        try {
            Money.add("99999999.99", "0.01");
            throw new Error("Expected money overflow");
        } catch (error) {
            expect(error).toBeInstanceOf(BadRequestError);
            expect((error as BadRequestError).field).toBeUndefined();
            expect((error as BadRequestError).message).toMatch(/Money value exceeds/);
        }

        try {
            Money.parse("100000000.00", "grandTotal");
            throw new Error("Expected money overflow");
        } catch (error) {
            expect(error).toBeInstanceOf(BadRequestError);
            expect((error as BadRequestError).field).toBe("grandTotal");
        }
    });

    it("serializes transaction money fields as JSON numbers", () => {
        const transaction = TransactionJson.from({
            id: 1,
            date: "2026-01-01T00:00:00.000Z",
            type: "Expense",
            notes: "",
            processed: false,
            items: [],
            payAccountId: 1,
            counterpartyAccountId: null,
            storeId: null,
            refundOfId: null,
            personId: null,
            subtotal: 0.1,
            taxTotal: 0.2,
            grandTotal: 0.3,
            amount: 0,
        });

        const response = JSON.parse(JSON.stringify(transaction));
        expect(response.subtotal).toBe(0.1);
        expect(response.taxTotal).toBe(0.2);
        expect(response.grandTotal).toBe(0.3);
        expect(typeof response.grandTotal).toBe("number");
    });
});
