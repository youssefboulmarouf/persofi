import { TransactionJson } from "./TransactionJson";
import { TransactionTypeEnum } from "./TransactionType";
import BadRequestError from "../utilities/errors/BadRequestError";

export class TransactionValidationService {
    static validate(t: TransactionJson): void {
        switch (t.getTransactionType()) {
            case TransactionTypeEnum.EXPENSE:
                return this.validateExpense(t);
            case TransactionTypeEnum.INCOME:
                return this.validateIncome(t);
            case TransactionTypeEnum.CREDIT_PAYMENT:
                return this.validateCreditPayment(t);
            case TransactionTypeEnum.TRANSFER:
                return this.validateTransfer(t);
            case TransactionTypeEnum.REFUND:
                return this.validateRefund(t);
            case TransactionTypeEnum.INIT_BALANCE:
                return this.validateInitBalance(t);
            default:
                BadRequestError.throwIf(
                    true,
                    `Transaction Type [${t.getTransactionType()}] is not supported`
                );
        }
    }

    private static validateExpense(t: TransactionJson): void {
        this.mustNotNull(t.getPayAccountId(), "Pay Account cannot be null for an expense transaction");
        this.mustNull(t.getCounterpartyAccountId(), "Counter Party Account must be null for an expense transaction");
        this.mustGt0(t.getSubtotal(), "Subtotal must be greater than 0 for an expense transaction");
        this.mustGte0(t.getTaxTotal(), "Tax Total must be greater than or equal to 0 for an expense transaction");
        this.mustEq(t.getGrandTotal(), t.getSubtotal() + t.getTaxTotal(), "Grand Total must be equal to Subtotal + Tax Total for an expense transaction");
        this.mustEq(t.getAmount(), 0, "Amount must be 0 for an expense transaction");
        this.mustNull(t.getRefundOfId(), "Refund ID must be null for an expense transaction");
    }

    private static validateIncome(t: TransactionJson): void {
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

    private static validateCreditPayment(t: TransactionJson): void {
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

    private static validateTransfer(t: TransactionJson): void {
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

    private static validateRefund(t: TransactionJson): void {
        this.mustNull(t.getPayAccountId(), "Pay Account must be null for a refund transaction");
        this.mustNotNull(t.getCounterpartyAccountId(), "Counter Party Account cannot be null for a refund transaction");
        this.mustGt0(t.getSubtotal(), "Subtotal must be greater than 0 for a refund transaction");
        this.mustGte0(t.getTaxTotal(), "Tax Total must be greater than or equal to 0 for a refund transaction");
        this.mustEq(t.getGrandTotal(), t.getSubtotal() + t.getTaxTotal(), "Grand Total must be equal to Subtotal + Tax Total for a refund transaction");
        this.mustEq(t.getAmount(), 0, "Amount must be greater than 0 for a refund transaction");
        this.mustNotNull(t.getRefundOfId(), "Refund ID cannot be null for a refund transaction");
    }

    private static validateInitBalance(t: TransactionJson): void {
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

    private static mustNull(v: any, msg: string): void {
        BadRequestError.throwIf(v != null, msg);
    }

    private static mustNotNull(v: any, msg: string): void {
        BadRequestError.throwIf(v == null, msg);
    }

    private static mustGt0(v: number, msg: string): void {
        BadRequestError.throwIf(v <= 0, msg);
    }

    private static mustGte0(v: number, msg: string): void {
        BadRequestError.throwIf(v < 0, msg);
    }

    private static mustPositive(v: number, msg: string): void {
        BadRequestError.throwIf(v < 0, msg);
    }

    private static mustEq(total: number, a: number, msg: string): void {
        BadRequestError.throwIf(total !== a, msg);
    }
}
