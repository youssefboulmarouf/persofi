import { TransactionJson } from "./TransactionJson";
import { TransactionTypeEnum } from "./TransactionType";
import BadRequestError from "../utilities/errors/BadRequestError";
import { Prisma } from "@prisma/client";
import { Money } from "../utilities/Money";
import PostingRuleError, { PostingErrorCode } from "../utilities/errors/PostingRuleError";

export class TransactionValidator {
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
                    `Transaction Type [${t.getTransactionType()}] is not supported`,
                    "type",
                );
        }
    }

    private static validateExpense(t: TransactionJson): void {
        this.mustNotNull(
            t.getPayAccountId(),
            "Pay Account cannot be null for an expense transaction",
            "payAccountId",
        );
        this.mustNull(
            t.getCounterpartyAccountId(),
            "Counter Party Account must be null for an expense transaction",
            "counterpartyAccountId",
        );
        this.mustGt0(
            t.getSubtotal(),
            "Subtotal must be greater than 0 for an expense transaction",
            "subtotal",
        );
        this.mustGte0(
            t.getTaxTotal(),
            "Tax Total must be greater than or equal to 0 for an expense transaction",
            "taxTotal",
        );
        this.mustEq(
            t.getGrandTotal(),
            Money.add(t.getSubtotal(), t.getTaxTotal()),
            "Grand Total must be equal to Subtotal + Tax Total for an expense transaction",
            "grandTotal",
        );
        this.mustEq(t.getAmount(), 0, "Amount must be 0 for an expense transaction", "amount");
        this.mustNull(
            t.getRefundOfId(),
            "Refund ID must be null for an expense transaction",
            "refundOfId",
        );
    }

    private static validateIncome(t: TransactionJson): void {
        this.mustNull(
            t.getPayAccountId(),
            "Pay Account must be null for an income transaction",
            "payAccountId",
        );
        this.mustNotNull(
            t.getCounterpartyAccountId(),
            "Counter Party Account cannot be null for an income transaction",
            "counterpartyAccountId",
        );
        this.mustNull(t.getStoreId(), "Store Id must be null for an income transaction", "storeId");
        this.mustNull(
            t.getPersonId(),
            "Person Id must be null for an income transaction",
            "personId",
        );
        this.mustEq(t.getSubtotal(), 0, "Subtotal must be 0 for an income transaction", "subtotal");
        this.mustEq(
            t.getTaxTotal(),
            0,
            "Tax Total must be 0 for an income transaction",
            "taxTotal",
        );
        this.mustEq(
            t.getGrandTotal(),
            0,
            "Grand Total must be 0 for an income transaction",
            "grandTotal",
        );
        this.mustGt0(
            t.getAmount(),
            "Amount must be greater than 0 for an income transaction",
            "amount",
        );
        this.mustNull(
            t.getRefundOfId(),
            "Refund ID must be null for an income transaction",
            "refundOfId",
        );
    }

    private static validateCreditPayment(t: TransactionJson): void {
        this.mustNotNull(
            t.getPayAccountId(),
            "Pay Account cannot be null for a credit payment transaction",
            "payAccountId",
        );
        this.mustNotNull(
            t.getCounterpartyAccountId(),
            "Counter Party Account cannot be null for a credit payment transaction",
            "counterpartyAccountId",
        );
        this.mustNull(
            t.getStoreId(),
            "Store Id must be null for a credit payment transaction",
            "storeId",
        );
        this.mustNull(
            t.getPersonId(),
            "Person Id must be null for a credit payment transaction",
            "personId",
        );
        this.mustEq(
            t.getSubtotal(),
            0,
            "Subtotal must be 0 for a credit payment transaction",
            "subtotal",
        );
        this.mustEq(
            t.getTaxTotal(),
            0,
            "Tax Total must be 0 for a credit payment transaction",
            "taxTotal",
        );
        this.mustEq(
            t.getGrandTotal(),
            0,
            "Grand Total must be 0 for a credit payment transaction",
            "grandTotal",
        );
        this.mustGt0(
            t.getAmount(),
            "Amount must be greater than 0 for a credit payment transaction",
            "amount",
        );
        this.mustNull(
            t.getRefundOfId(),
            "Refund ID must be null for a credit payment transaction",
            "refundOfId",
        );
    }

    private static validateTransfer(t: TransactionJson): void {
        this.mustNotNull(
            t.getPayAccountId(),
            "Pay Account cannot be null for a transfer transaction",
            "payAccountId",
        );
        this.mustNotNull(
            t.getCounterpartyAccountId(),
            "Counter Party Account cannot be null for a transfer transaction",
            "counterpartyAccountId",
        );
        this.mustNull(
            t.getStoreId(),
            "Store Id must be null for a transfer transaction",
            "storeId",
        );
        this.mustNull(
            t.getPersonId(),
            "Person Id must be null for a transfer transaction",
            "personId",
        );
        this.mustEq(
            t.getSubtotal(),
            0,
            "Subtotal must be 0 for a transfer transaction",
            "subtotal",
        );
        this.mustEq(
            t.getTaxTotal(),
            0,
            "Tax Total must be 0 for a transfer transaction",
            "taxTotal",
        );
        this.mustEq(
            t.getGrandTotal(),
            0,
            "Grand Total must be 0 for a transfer transaction",
            "grandTotal",
        );
        this.mustGt0(
            t.getAmount(),
            "Amount must be greater than 0 for a transfer transaction",
            "amount",
        );
        this.mustNull(
            t.getRefundOfId(),
            "Refund ID must be null for a transfer transaction",
            "refundOfId",
        );
    }

    private static validateRefund(t: TransactionJson): void {
        this.mustNull(
            t.getPayAccountId(),
            "Pay Account must be null for a refund transaction",
            "payAccountId",
        );
        this.mustNotNull(
            t.getCounterpartyAccountId(),
            "Counter Party Account cannot be null for a refund transaction",
            "counterpartyAccountId",
        );
        this.mustGt0(
            t.getSubtotal(),
            "Subtotal must be greater than 0 for a refund transaction",
            "subtotal",
        );
        this.mustGte0(
            t.getTaxTotal(),
            "Tax Total must be greater than or equal to 0 for a refund transaction",
            "taxTotal",
        );
        this.mustEq(
            t.getGrandTotal(),
            Money.add(t.getSubtotal(), t.getTaxTotal()),
            "Grand Total must be equal to Subtotal + Tax Total for a refund transaction",
            "grandTotal",
        );
        this.mustEq(t.getAmount(), 0, "Amount must be 0 for a refund transaction", "amount");
        if (t.getRefundOfId() == null) {
            // A posting rule (docs/POSTING_MATRIX.md §4), so it carries a code like the other refund rules.
            throw new PostingRuleError(
                PostingErrorCode.REFUND_ORIGINAL_REQUIRED,
                "Refund ID cannot be null for a refund transaction",
                400,
                "refundOfId",
            );
        }
    }

    private static validateInitBalance(t: TransactionJson): void {
        this.mustNull(
            t.getPayAccountId(),
            "Pay Account must be null for an init balance transaction",
            "payAccountId",
        );
        this.mustNotNull(
            t.getCounterpartyAccountId(),
            "Counter Party Account cannot be null for an init balance transaction",
            "counterpartyAccountId",
        );
        this.mustNull(
            t.getStoreId(),
            "Store Id must be null for an init balance transaction",
            "storeId",
        );
        this.mustNull(
            t.getPersonId(),
            "Person Id must be null for an init balance transaction",
            "personId",
        );
        this.mustEq(
            t.getSubtotal(),
            0,
            "Subtotal must be 0 for an init balance transaction",
            "subtotal",
        );
        this.mustEq(
            t.getTaxTotal(),
            0,
            "Tax Total must be 0 for an init balance transaction",
            "taxTotal",
        );
        this.mustEq(
            t.getGrandTotal(),
            0,
            "Grand Total must be 0 for an init balance transaction",
            "grandTotal",
        );
        this.mustGte0(
            t.getAmount(),
            "Amount must be greater than or equal to 0 for an init balance transaction",
            "amount",
        );
        this.mustNull(
            t.getRefundOfId(),
            "Refund ID must be null for an init balance transaction",
            "refundOfId",
        );
    }

    private static mustNull(v: any, msg: string, field: string): void {
        BadRequestError.throwIf(v != null, msg, field);
    }

    private static mustNotNull(v: any, msg: string, field: string): void {
        BadRequestError.throwIf(v == null, msg, field);
    }

    private static mustGt0(v: Prisma.Decimal, msg: string, field: string): void {
        BadRequestError.throwIf(Money.compare(v, 0) <= 0, msg, field);
    }

    private static mustGte0(v: Prisma.Decimal, msg: string, field: string): void {
        BadRequestError.throwIf(Money.compare(v, 0) < 0, msg, field);
    }

    private static mustEq(
        total: Prisma.Decimal,
        a: Prisma.Decimal | number,
        msg: string,
        field: string,
    ): void {
        BadRequestError.throwIf(Money.compare(total, a) !== 0, msg, field);
    }
}
