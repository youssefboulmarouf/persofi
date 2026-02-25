"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionTypeFromString = exports.TransactionTypeEnum = void 0;
const AppError_1 = __importDefault(require("../utilities/errors/AppError"));
var TransactionTypeEnum;
(function (TransactionTypeEnum) {
    TransactionTypeEnum["EXPENSE"] = "Expense";
    TransactionTypeEnum["INCOME"] = "Income";
    TransactionTypeEnum["CREDIT_PAYMENT"] = "Credit_Payment";
    TransactionTypeEnum["REFUND"] = "Refund";
    TransactionTypeEnum["TRANSFER"] = "Transfer";
    TransactionTypeEnum["INIT_BALANCE"] = "Init_Balance";
})(TransactionTypeEnum || (exports.TransactionTypeEnum = TransactionTypeEnum = {}));
function TransactionTypeFromString(type) {
    if (Object.values(TransactionTypeEnum).includes(type)) {
        return type;
    }
    throw new AppError_1.default("Runtime Error", 500, `Invalid TransactionTypeEnum value: ${type}. Expected 'Expense', 'Income', 'Credit_Payment', 'Refund'.`);
}
exports.TransactionTypeFromString = TransactionTypeFromString;
