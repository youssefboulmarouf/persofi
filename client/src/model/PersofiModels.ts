export enum ModalTypeEnum {
    ADD = "Ajouter",
    UPDATE = "Modifier",
    DELETE = "Supprimer"
}

export enum AccountTypeEnum {
    DEBIT = "Debit",
    CREDIT = "Credit",
    CASH = "Cash",
    SAVING = "Saving",
}

export enum TransactionTypeEnum {
    EXPENSE = "Expense",
    INCOME = "Income",
    CREDIT_PAYMENT = "Credit_Payment",
    REFUND = "Refund",
    TRANSFER = "Transfer",
    INIT_BALANCE = "Init_Balance",
}

export enum UintTypeEnum {
    L = "L",
    KG = "Kg",
    PIECE = "Piece",
    PACK = "Pack",
}

export type AccountJson = {
    id: number,
    name: string,
    accountType: AccountTypeEnum,
    currency: string,
    active: boolean
}

export type BalanceJson = {
    id: number,
    amount: string,
    date: Date,
    accountId: number,
    transactionId: number
}

export type Store = {
    id: number,
    name: string,
    url: string,
    active: boolean,
}

export type Person = {
    id: number,
    name: string,
    active: boolean,
}

export type Category = {
    id: number,
    name: string,
    active: boolean,
    parentCategoryId: number | null,
}

export type ProductJson = {
    id: number,
    name: string,
    active: boolean,
    categoryId: number,
}

export type ProductVariantJson = {
    id: number;
    unitSize: number;
    unitType: UintTypeEnum;
    description: string;
    active: boolean,
}

export type Transaction = {
    id: number,
    date: Date,
    type: TransactionTypeEnum,
    processed: boolean,
    subtotal: number,
    taxTotal: number,
    grandTotal: number,
    amount: number,
    notes: string,
    payAccountId: number | null,
    counterpartyAccountId: number | null,
    storeId: number | null,
    personId: number | null,
    refundOfId: number | null,
}

export type TransactionItem = {
    id: number,
    description: string,
    quantity: number,
    unitPrice: number,
    lineTotal: number,
    transactionId: number,
    variantId: number | null,
    categoryId: number | null,
    brandId: number | null,
}