import AppError from "../src/utilities/errors/AppError";
import { TransactionTypeFromString } from "../src/transaction/TransactionType";
import { TransactionJson } from "../src/transaction/TransactionJson";

describe("transaction type error source", () => {
    it("reports an invalid request type as a field validation error", () => {
        expect(() => TransactionTypeFromString("Unknown")).toThrow(AppError);
        try {
            TransactionTypeFromString("Unknown");
        } catch (error) {
            expect((error as AppError).status).toBe(400);
            expect((error as AppError).field).toBe("type");
        }
    });

    it("treats an invalid stored type as an internal error", () => {
        expect(() => TransactionTypeFromString("Unknown", "stored")).toThrow("Invalid stored type");
        try {
            TransactionTypeFromString("Unknown", "stored");
        } catch (error) {
            expect(error).not.toBeInstanceOf(AppError);
        }
    });
});

describe("stored transaction structure", () => {
    const row = {
        id: 1,
        date: new Date("2026-11-11T00:00:00Z"),
        type: "Expense",
        notes: null,
        processed: false,
        payAccountId: 1,
        counterpartyAccountId: null,
        storeId: null,
        personId: null,
        refundOfId: null,
        subtotal: 5,
        taxTotal: 0,
        grandTotal: 5,
        amount: 0,
        items: [],
    };

    it.each([
        ["missing items", { items: undefined }],
        ["a null date", { date: null }],
        ["an invalid date", { date: "not a date" }],
        ["a non-object item", { items: [null] }],
    ])("treats a stored row with %s as an internal error", (_label, overrides) => {
        let thrown: unknown;
        try {
            TransactionJson.from({ ...row, ...overrides }, "stored");
        } catch (error) {
            thrown = error;
        }
        expect(thrown).toBeInstanceOf(Error);
        expect(thrown).not.toBeInstanceOf(AppError);
        expect((thrown as Error).message).toMatch(/^Invalid stored/);
    });

    it("reports the same problems in a request as field validation errors", () => {
        for (const [overrides, field] of [
            [{ items: undefined }, "items"],
            [{ date: null }, "date"],
            [{ items: [null] }, "items[0]"],
        ] as const) {
            let thrown: unknown;
            try {
                TransactionJson.from({ ...row, ...overrides });
            } catch (error) {
                thrown = error;
            }
            expect(thrown).toBeInstanceOf(AppError);
            expect((thrown as AppError).status).toBe(400);
            expect((thrown as AppError).field).toBe(field);
        }
    });
});
