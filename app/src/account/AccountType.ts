import AppError from "../utilities/errors/AppError";

export enum AccountTypeEnum {
    DEBIT = "Debit",
    CREDIT = "Credit",
    CASH = "Cash",
}

export function accountTypeFromString(type: string): AccountTypeEnum {
    if (Object.values(AccountTypeEnum).includes(type as AccountTypeEnum)) {
        return type as AccountTypeEnum;
    }
    throw new AppError("Runtime Error", 500, `Invalid AccountTypeEnum value: ${type}. Expected 'Debit', 'Credit' or 'Cash'.`);
}