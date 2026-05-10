import { TransactionJson } from "../src/transaction/TransactionJson";
import { TransactionValidator } from "../src/transaction/TransactionValidator";
import { TransactionTypeEnum } from "../src/transaction/TransactionType";
import BadRequestError from "../src/utilities/errors/BadRequestError";

// ─── Helpers ───────────────────────────────────────────────────────────────

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

// ─── EXPENSE ───────────────────────────────────────────────────────────────

describe("TransactionValidator – EXPENSE", () => {
    it("passes with valid expense data", () => {
        expect(() => TransactionValidator.validate(makeTx({}))).not.toThrow();
    });

    it("throws if payAccountId is null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ payAccountId: null }))
        ).toThrow();
    });

    it("throws if counterpartyAccountId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ counterpartyAccountId: 2 }))
        ).toThrow();
    });

    it("throws if grandTotal != subtotal + taxTotal", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ subtotal: 10, taxTotal: 2, grandTotal: 11 }))
        ).toThrow();
    });

    it("throws if amount is not 0", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ amount: 5 }))
        ).toThrow();
    });

    it("throws if subtotal is 0 or negative", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ subtotal: 0, grandTotal: 0 }))
        ).toThrow();
    });

    it("throws if taxTotal is negative", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ taxTotal: -1, grandTotal: 9 }))
        ).toThrow();
    });

    it("throws if refundOfId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ refundOfId: 5 }))
        ).toThrow();
    });
});

// ─── INCOME ────────────────────────────────────────────────────────────────

describe("TransactionValidator – INCOME", () => {
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

    it("passes with valid income data", () => {
        expect(() => TransactionValidator.validate(makeTx(validIncome))).not.toThrow();
    });

    it("throws if payAccountId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validIncome, payAccountId: 1 }))
        ).toThrow();
    });

    it("throws if counterpartyAccountId is null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validIncome, counterpartyAccountId: null }))
        ).toThrow();
    });

    it("throws if amount is <= 0", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validIncome, amount: 0 }))
        ).toThrow();
    });

    it("throws if storeId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validIncome, storeId: 3 }))
        ).toThrow();
    });

    it("throws if personId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validIncome, personId: 4 }))
        ).toThrow();
    });
});

// ─── CREDIT_PAYMENT ────────────────────────────────────────────────────────

describe("TransactionValidator – CREDIT_PAYMENT", () => {
    const validCreditPayment = {
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

    it("passes with valid credit payment data", () => {
        expect(() => TransactionValidator.validate(makeTx(validCreditPayment))).not.toThrow();
    });

    it("throws if payAccountId is null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validCreditPayment, payAccountId: null }))
        ).toThrow();
    });

    it("throws if counterpartyAccountId is null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validCreditPayment, counterpartyAccountId: null }))
        ).toThrow();
    });

    it("throws if amount is <= 0", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validCreditPayment, amount: 0 }))
        ).toThrow();
    });
});

// ─── TRANSFER ──────────────────────────────────────────────────────────────

describe("TransactionValidator – TRANSFER", () => {
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

    it("passes with valid transfer data", () => {
        expect(() => TransactionValidator.validate(makeTx(validTransfer))).not.toThrow();
    });

    it("throws if payAccountId is null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validTransfer, payAccountId: null }))
        ).toThrow();
    });

    it("throws if counterpartyAccountId is null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validTransfer, counterpartyAccountId: null }))
        ).toThrow();
    });
});

// ─── REFUND ────────────────────────────────────────────────────────────────

describe("TransactionValidator – REFUND", () => {
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

    it("passes with valid refund data", () => {
        expect(() => TransactionValidator.validate(makeTx(validRefund))).not.toThrow();
    });

    it("throws if refundOfId is null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validRefund, refundOfId: null }))
        ).toThrow();
    });

    it("throws if counterpartyAccountId is null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validRefund, counterpartyAccountId: null }))
        ).toThrow();
    });

    it("throws if payAccountId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validRefund, payAccountId: 1 }))
        ).toThrow();
    });

    it("throws if subtotal is 0", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validRefund, subtotal: 0, grandTotal: 1 }))
        ).toThrow();
    });
});

// ─── INIT_BALANCE ──────────────────────────────────────────────────────────

describe("TransactionValidator – INIT_BALANCE", () => {
    const validInit = {
        type: TransactionTypeEnum.INIT_BALANCE,
        payAccountId: null,
        counterpartyAccountId: 2,
        storeId: null,
        personId: null,
        subtotal: 0,
        taxTotal: 0,
        grandTotal: 0,
        amount: 500,
        refundOfId: null,
    };

    it("passes with valid init balance data", () => {
        expect(() => TransactionValidator.validate(makeTx(validInit))).not.toThrow();
    });

    it("throws if counterpartyAccountId is null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validInit, counterpartyAccountId: null }))
        ).toThrow();
    });

    it("throws if amount is <= 0", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validInit, amount: 0 }))
        ).toThrow();
    });

    it("throws if payAccountId is not null", () => {
        expect(() =>
            TransactionValidator.validate(makeTx({ ...validInit, payAccountId: 1 }))
        ).toThrow();
    });
});
