export enum ModalTypeEnum {
    ADD = "Add",
    UPDATE = "Update",
    DELETE = "Delete"
}

export enum CurrencyEnum {
    CAD = "CAD",
    MAD = "MAD",
    USD = "USD"
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
    currency: CurrencyEnum,
    active: boolean
}

export type BalanceJson = {
    id: number,
    amount: string,
    date: Date,
    accountId: number,
    transactionId: number
}

export type StoreJson = {
    id: number,
    name: string,
    url: string,
    active: boolean,
}

export type BrandJson = {
    id: number,
    name: string,
    url: string,
    active: boolean,
}

export type PersonJson = {
    id: number,
    name: string,
    active: boolean,
}

export type CategoryJson = {
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
    variants: ProductVariantJson[]
}

export type ProductVariantJson = {
    id: number;
    productId: number,
    unitSize: number;
    unitType: UintTypeEnum;
    description: string;
    active: boolean,
}

export type TransactionJson = {
    id: number,
    date: Date,
    type: TransactionTypeEnum,
    notes: string,
    processed: boolean,
    items: TransactionItemJson[],
    payAccountId: number | null,
    counterpartyAccountId: number | null,
    storeId: number | null,
    personId: number | null,
    refundOfId: number | null,
    subtotal: number,
    taxTotal: number,
    grandTotal: number,
    amount: number,
}

export type TransactionItemJson = {
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