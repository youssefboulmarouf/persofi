"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionValidator = void 0;
const TransactionType_1 = require("./TransactionType");
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
class TransactionValidator {
    static validate(t) {
        switch (t.getTransactionType()) {
            case TransactionType_1.TransactionTypeEnum.EXPENSE:
                return this.validateExpense(t);
            case TransactionType_1.TransactionTypeEnum.INCOME:
                return this.validateIncome(t);
            case TransactionType_1.TransactionTypeEnum.CREDIT_PAYMENT:
                return this.validateCreditPayment(t);
            case TransactionType_1.TransactionTypeEnum.TRANSFER:
                return this.validateTransfer(t);
            case TransactionType_1.TransactionTypeEnum.REFUND:
                return this.validateRefund(t);
            case TransactionType_1.TransactionTypeEnum.INIT_BALANCE:
                return this.validateInitBalance(t);
            default:
                BadRequestError_1.default.throwIf(true, `Transaction Type [${t.getTransactionType()}] is not supported`);
        }
    }
    static validateExpense(t) {
        this.mustNotNull(t.getPayAccountId(), "Pay Account cannot be null for an expense transaction");
        this.mustNull(t.getCounterpartyAccountId(), "Counter Party Account must be null for an expense transaction");
        this.mustGt0(t.getSubtotal(), "Subtotal must be greater than 0 for an expense transaction");
        this.mustGte0(t.getTaxTotal(), "Tax Total must be greater than or equal to 0 for an expense transaction");
        this.mustEq(t.getGrandTotal(), t.getSubtotal() + t.getTaxTotal(), "Grand Total must be equal to Subtotal + Tax Total for an expense transaction");
        this.mustEq(t.getAmount(), 0, "Amount must be 0 for an expense transaction");
        this.mustNull(t.getRefundOfId(), "Refund ID must be null for an expense transaction");
    }
    static validateIncome(t) {
        this.mustNull(t.getPayAccountId(), "Pay Account must be null for an income transaction");
        this.mustNotNull(t.getCounterpartyAccountId(), "Counter Party Account cannot be null for an income transaction");
        this.mustNull(t.getStoreId(), "Store Id must be null for an income transaction");
        this.mustNull(t.getPersonId(), "Person Id must be null for an income transaction");
        this.mustEq(t.getSubtotal(), 0, "Subtotal must be 0 for an income transaction");
        this.mustEq(t.getTaxTotal(), 0, "Tax Total must be 0 for an income transaction");
        this.mustEq(t.getGrandTotal(), 0, "Grand Total must be 0 for an income transaction");
        this.mustPositive(t.getAmount(), "Amount must be greater than 0 for an income transaction");
        this.mustNull(t.getRefundOfId(), "Refund ID must be null for an income transaction");
    }
    static validateCreditPayment(t) {
        this.mustNotNull(t.getPayAccountId(), "Pay Account cannot be null for a credit payment transaction");
        this.mustNotNull(t.getCounterpartyAccountId(), "Counter Party Account cannot be null for a credit payment transaction");
        this.mustNull(t.getStoreId(), "Store Id must be null for a credit payment transaction");
        this.mustNull(t.getPersonId(), "Person Id must be null for a credit payment transaction");
        this.mustEq(t.getSubtotal(), 0, "Subtotal must be 0 for a credit payment transaction");
        this.mustEq(t.getTaxTotal(), 0, "Tax Total must be 0 for a credit payment transaction");
        this.mustEq(t.getGrandTotal(), 0, "Grand Total must be 0 for a credit payment transaction");
        this.mustPositive(t.getAmount(), "Amount must be greater than 0 for a credit payment transaction");
        this.mustNull(t.getRefundOfId(), "Refund ID must be null for a credit payment transaction");
    }
    static validateTransfer(t) {
        this.mustNotNull(t.getPayAccountId(), "Pay Account cannot be null for a transfer transaction");
        this.mustNotNull(t.getCounterpartyAccountId(), "Counter Party Account cannot be null for a transfer transaction");
        this.mustNull(t.getStoreId(), "Store Id must be null for a transfer transaction");
        this.mustNull(t.getPersonId(), "Person Id must be null for a transfer transaction");
        this.mustEq(t.getSubtotal(), 0, "Subtotal must be 0 for a transfer transaction");
        this.mustEq(t.getTaxTotal(), 0, "Tax Total must be 0 for a transfer transaction");
        this.mustEq(t.getGrandTotal(), 0, "Grand Total must be 0 for a transfer transaction");
        this.mustPositive(t.getAmount(), "Amount must be greater than 0 for a transfer transaction");
        this.mustNull(t.getRefundOfId(), "Refund ID must be null for a transfer transaction");
    }
    static validateRefund(t) {
        this.mustNull(t.getPayAccountId(), "Pay Account must be null for a refund transaction");
        this.mustNotNull(t.getCounterpartyAccountId(), "Counter Party Account cannot be null for a refund transaction");
        this.mustGt0(t.getSubtotal(), "Subtotal must be greater than 0 for a refund transaction");
        this.mustGte0(t.getTaxTotal(), "Tax Total must be greater than or equal to 0 for a refund transaction");
        this.mustEq(t.getGrandTotal(), t.getSubtotal() + t.getTaxTotal(), "Grand Total must be equal to Subtotal + Tax Total for a refund transaction");
        this.mustEq(t.getAmount(), 0, "Amount must be greater than 0 for a refund transaction");
        this.mustNotNull(t.getRefundOfId(), "Refund ID cannot be null for a refund transaction");
    }
    static validateInitBalance(t) {
        this.mustNull(t.getPayAccountId(), "Pay Account must be null for an init balance transaction");
        this.mustNotNull(t.getCounterpartyAccountId(), "Counter Party Account cannot be null for an init balance transaction");
        this.mustNull(t.getStoreId(), "Store Id must be null for an init balance transaction");
        this.mustNull(t.getPersonId(), "Person Id must be null for an init balance transaction");
        this.mustEq(t.getSubtotal(), 0, "Subtotal must be 0 for an init balance transaction");
        this.mustEq(t.getTaxTotal(), 0, "Tax Total must be 0 for an init balance transaction");
        this.mustEq(t.getGrandTotal(), 0, "Grand Total must be 0 for an init balance transaction");
        this.mustPositive(t.getAmount(), "Amount must be greater than 0 for an init balance transaction");
        this.mustNull(t.getRefundOfId(), "Refund ID must be null for an init balance transaction");
    }
    static mustNull(v, msg) {
        BadRequestError_1.default.throwIf(v != null, msg);
    }
    static mustNotNull(v, msg) {
        BadRequestError_1.default.throwIf(v == null, msg);
    }
    static mustGt0(v, msg) {
        BadRequestError_1.default.throwIf(v <= 0, msg);
    }
    static mustGte0(v, msg) {
        BadRequestError_1.default.throwIf(v < 0, msg);
    }
    static mustPositive(v, msg) {
        BadRequestError_1.default.throwIf(v < 0, msg);
    }
    static mustEq(total, a, msg) {
        BadRequestError_1.default.throwIf(total !== a, msg);
    }
}
exports.TransactionValidator = TransactionValidator;
