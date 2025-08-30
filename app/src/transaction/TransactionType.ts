import AppError from "../utilities/errors/AppError";

export enum TransactionTypeEnum {
    EXPENSE = "Expense",
    INCOME = "Income",
    CREDIT_PAYMENT = "Credit_Payment",
    REFUND = "Refund",
}

export function TransactionTypeFromString(type: string): TransactionTypeEnum {
    if (Object.values(TransactionTypeEnum).includes(type as TransactionTypeEnum)) {
        return type as TransactionTypeEnum;
    }
    throw new AppError(
        "Runtime Error",
        500,
        `Invalid TransactionTypeEnum value: ${type}. Expected 'Expense', 'Income', 'Credit_Payment', 'Refund'.`
    );
}