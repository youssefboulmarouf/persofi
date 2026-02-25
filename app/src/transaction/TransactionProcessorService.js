"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionProcessorService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const BalanceService_1 = require("../balance/BalanceService");
const AccountType_1 = require("../account/AccountType");
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
const AppError_1 = __importDefault(require("../utilities/errors/AppError"));
class TransactionProcessorService extends BaseService_1.BaseService {
    constructor() {
        super(TransactionProcessorService.name);
        this.balanceService = new BalanceService_1.BalanceService();
    }
    processExpenseTransaction(transaction, payAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            const payAccountBalance = yield this.balanceService.getLatestBalanceOfAccount(payAccount.getId());
            yield this.balanceService.updateAccountBalance((payAccount.getAccountType() == AccountType_1.AccountTypeEnum.CREDIT)
                ? payAccountBalance.getAmount() + transaction.getGrandTotal()
                : payAccountBalance.getAmount() - transaction.getGrandTotal(), transaction.getDate(), transaction.getId(), payAccount.getId());
        });
    }
    processIncomeTransaction(transaction, counterPartyAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            BadRequestError_1.default.throwIf(counterPartyAccount.getAccountType() == AccountType_1.AccountTypeEnum.CREDIT, `Income is only added to Debit, Cash or Saving but got [accountType=${counterPartyAccount.getAccountType()}].`);
            const counterPartyAccountBalance = yield this.balanceService.getLatestBalanceOfAccount(counterPartyAccount.getId());
            yield this.balanceService.updateAccountBalance(counterPartyAccountBalance.getAmount() + transaction.getAmount(), transaction.getDate(), transaction.getId(), counterPartyAccount.getId());
        });
    }
    processCreditPaymentTransaction(transaction, payAccount, counterPartyAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            BadRequestError_1.default.throwIf(payAccount.getAccountType() == AccountType_1.AccountTypeEnum.CREDIT, `Credit Payment emitter should be Debit, Cash or Saving but got [accountType=${payAccount.getAccountType()}].`);
            BadRequestError_1.default.throwIf(counterPartyAccount.getAccountType() != AccountType_1.AccountTypeEnum.CREDIT, `Credit Payment receiver should be Credit but got [accountType=${counterPartyAccount.getAccountType()}].`);
            yield this.processTransferTransaction(transaction, payAccount, counterPartyAccount);
        });
    }
    processRefundTransaction(transaction, counterPartyAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            const counterPartyAccountBalance = yield this.balanceService.getLatestBalanceOfAccount(counterPartyAccount.getId());
            yield this.balanceService.updateAccountBalance((counterPartyAccount.getAccountType() == AccountType_1.AccountTypeEnum.CREDIT)
                ? counterPartyAccountBalance.getAmount() - transaction.getGrandTotal()
                : counterPartyAccountBalance.getAmount() + transaction.getGrandTotal(), transaction.getDate(), transaction.getId(), counterPartyAccount.getId());
        });
    }
    processTransferTransaction(transaction, payAccount, counterPartyAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            const payAccountBalance = yield this.balanceService.getLatestBalanceOfAccount(payAccount.getId());
            const counterPartyAccountBalance = yield this.balanceService.getLatestBalanceOfAccount(counterPartyAccount.getId());
            yield this.balanceService.updateAccountBalance(payAccountBalance.getAmount() - transaction.getAmount(), transaction.getDate(), transaction.getId(), payAccount.getId());
            yield this.balanceService.updateAccountBalance(counterPartyAccountBalance.getAmount() + transaction.getAmount(), transaction.getDate(), transaction.getId(), counterPartyAccount.getId());
        });
    }
    processInitBalanceTransaction(transaction, counterPartyAccount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.balanceService.getLatestBalanceOfAccount(counterPartyAccount.getId());
                BadRequestError_1.default.throwIf(true, `Balance already exists for account [id=${counterPartyAccount.getId()}]`);
            }
            catch (e) {
                if (e instanceof BadRequestError_1.default && e.message.includes("try to initialize it first")) {
                    yield this.balanceService.updateAccountBalance(transaction.getAmount(), transaction.getDate(), transaction.getId(), counterPartyAccount.getId());
                }
                else {
                    throw new AppError_1.default("Runtime Error", 500, `Unable to initialize balance for account [id=${counterPartyAccount.getId()}]. ` + e.message);
                }
            }
        });
    }
}
exports.TransactionProcessorService = TransactionProcessorService;
