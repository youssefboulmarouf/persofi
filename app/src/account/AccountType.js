"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountTypeFromString = exports.AccountTypeEnum = void 0;
const AppError_1 = __importDefault(require("../utilities/errors/AppError"));
var AccountTypeEnum;
(function (AccountTypeEnum) {
    AccountTypeEnum["DEBIT"] = "Debit";
    AccountTypeEnum["CREDIT"] = "Credit";
    AccountTypeEnum["CASH"] = "Cash";
    AccountTypeEnum["SAVING"] = "Saving";
})(AccountTypeEnum || (exports.AccountTypeEnum = AccountTypeEnum = {}));
function accountTypeFromString(type) {
    if (Object.values(AccountTypeEnum).includes(type)) {
        return type;
    }
    throw new AppError_1.default("Runtime Error", 500, `Invalid AccountTypeEnum value: ${type}. Expected 'Debit', 'Credit' or 'Cash'.`);
}
exports.accountTypeFromString = accountTypeFromString;
