// ─── Additional TransactionValidator edge cases ───────────────────────────
// These supplement the existing TransactionValidator.test.ts

import { TransactionJson } from "../src/transaction/TransactionJson";
import { TransactionValidator } from "../src/transaction/TransactionValidator";
import { TransactionTypeEnum } from "../src/transaction/TransactionType";

function makeTx(overrides: Partial<{
    id: number;
    type: TransactionTypeEnum;
    payAccountId: number | null;
    counterpartyAccountId: number | null;
    storeId: number | null;
    personId: number | null;
    refundOfId: number | null;
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
    amount: number;
    processed: boolean;
}>): TransactionJson {
    const defaults = {
        id: 1,
        type: TransactionTypeEnum.EXPENSE,
        payAccountId: 1,
        counterpartyAccountId: null,
        storeId: null,
        personId: null,
        refundOfId: null,
        subtotal: 10,
        taxTotal: 1,
        grandTotal: 11,
        amount: 0,
        processed: false,
    };
    const d = { ...defaults, ...overrides };
    return new TransactionJson(
        d.id, new Date(), d.type, "test", d.processed, [],
        d.payAccountId, d.counterpartyAccountId, d.storeId,
        d.refundOfId, d.personId,
        d.subtotal, d.taxTotal, d.grandTotal, d.amount
    );
}

// ─── EXPENSE additional edge cases ─────────────────────────────────────────

describe("TransactionValidator – EXPENSE edge cases", () => {
    it("passes when taxTotal = 0 (no-tax purchase)", () => {
        // taxTotal = 0 is valid; grandTotal = subtotal + 0 = subtotal
        expect(() =>
            TransactionValidator.validate(makeTx({ subtotal: 10, taxTotal: 0, grandTotal: 10 }))
        ).not.toThrow();
    });

    it("throws when subtotal is negative", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ subtotal: -5, grandTotal: -5, taxTotal: 0 }))
        ).toThrow();
    });

    it("throws when grandTotal is larger than subtotal + taxTotal", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ subtotal: 10, taxTotal: 1, grandTotal: 15 }))
        ).toThrow();
    });

    it("throws when grandTotal is smaller than subtotal + taxTotal", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ subtotal: 10, taxTotal: 1, grandTotal: 5 }))
        ).toThrow();
    });
});

// ─── INCOME additional edge cases ──────────────────────────────────────────

describe("TransactionValidator – INCOME edge cases", () => {
    const validIncome = {
        type: TransactionTypeEnum.INCOME,
        payAccountId: null,
        counterpartyAccountId: 2,
        storeId: null,
        personId: null,
        subtotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        amount: 100,
        refundOfId: null,
    };

    it("throws when refundOfId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validIncome, refundOfId: 5 }))
        ).toThrow();
    });

    it("throws when amount is negative", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validIncome, amount: -50 }))
        ).toThrow();
    });
});

// ─── CREDIT_PAYMENT additional edge cases ──────────────────────────────────

describe("TransactionValidator – CREDIT_PAYMENT edge cases", () => {
    const validCP = {
        type: TransactionTypeEnum.CREDIT_PAYMENT,
        payAccountId: 1,
        counterpartyAccountId: 2,
        storeId: null,
        personId: null,
        subtotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        amount: 200,
        refundOfId: null,
    };

    it("throws when refundOfId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validCP, refundOfId: 5 }))
        ).toThrow();
    });

    it("throws when storeId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validCP, storeId: 1 }))
        ).toThrow();
    });

    it("throws when personId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validCP, personId: 1 }))
        ).toThrow();
    });
});

// ─── TRANSFER additional edge cases ────────────────────────────────────────

describe("TransactionValidator – TRANSFER edge cases", () => {
    const validTransfer = {
        type: TransactionTypeEnum.TRANSFER,
        payAccountId: 1,
        counterpartyAccountId: 2,
        storeId: null,
        personId: null,
        subtotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        amount: 50,
        refundOfId: null,
    };

    it("throws when amount is exactly 0", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validTransfer, amount: 0 }))
        ).toThrow();
    });

    it("throws when refundOfId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validTransfer, refundOfId: 5 }))
        ).toThrow();
    });
});

// ─── REFUND additional edge cases ──────────────────────────────────────────

describe("TransactionValidator – REFUND edge cases", () => {
    const validRefund = {
        type: TransactionTypeEnum.REFUND,
        payAccountId: null,
        counterpartyAccountId: 2,
        storeId: null,
        personId: null,
        subtotal: 10,
        taxTotal: 1,
        grandTotal: 11,
        amount: 0,
        refundOfId: 99,
    };

    it("throws when grandTotal != subtotal + taxTotal", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validRefund, subtotal: 10, taxTotal: 1, grandTotal: 5 }))
        ).toThrow();
    });

    it("throws when taxTotal is negative", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validRefund, taxTotal: -1, grandTotal: 9 }))
        ).toThrow();
    });
});
