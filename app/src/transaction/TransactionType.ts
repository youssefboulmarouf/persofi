import { DataSource, invalidData } from "../utilities/DataSource";

export enum TransactionTypeEnum {
    EXPENSE = "Expense",
    INCOME = "Income",
    CREDIT_PAYMENT = "Credit_Payment",
    REFUND = "Refund",
    TRANSFER = "Transfer",
    INIT_BALANCE = "Init_Balance",
}

export function TransactionTypeFromString(
    type: string,
    source: DataSource = "request",
): TransactionTypeEnum {
    if (Object.values(TransactionTypeEnum).includes(type as TransactionTypeEnum)) {
        return type as TransactionTypeEnum;
    }
    return invalidData(source)(`Invalid transaction type: ${type}`, "type");
}
