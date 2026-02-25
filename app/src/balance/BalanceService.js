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
exports.BalanceService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const NotFoundError_1 = __importDefault(require("../utilities/errors/NotFoundError"));
const BalanceJson_1 = require("./BalanceJson");
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
class BalanceService extends BaseService_1.BaseService {
    constructor() {
        super(BalanceService.name);
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get all Balances`);
            return (yield this.prisma.balance.findMany()).map(BalanceJson_1.BalanceJson.from);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get balance by [id:${id}]`);
            const data = yield this.prisma.balance.findUnique({
                where: { id }
            });
            NotFoundError_1.default.throwIf(!data, `Balance with [id:${id}] not found`);
            return BalanceJson_1.BalanceJson.from(data);
        });
    }
    getByAccountId(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get balance by [accountI:${accountId}]`);
            const data = yield this.prisma.balance.findMany({
                where: { accountId }
            });
            return data.map(BalanceJson_1.BalanceJson.from);
        });
    }
    getLatestBalanceOfAccount(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get latest balance by [accountI:${accountId}]`);
            const data = yield this.prisma.balance.findFirst({
                where: { accountId },
                orderBy: [{ date: 'desc' }]
            });
            BadRequestError_1.default.throwIf(!data, `Balance for account with [id:${accountId}] not found, try to initialize it first`);
            return BalanceJson_1.BalanceJson.from(data);
        });
    }
    updateAccountBalance(newBalance, date, transactionId, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Update balance for account with [accountId:${accountId}] and transaction with [transactionId:${transactionId}]`);
            yield this.prisma.balance.create({
                data: {
                    amount: newBalance,
                    date,
                    accountId,
                    transactionId
                }
            });
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Deleting balance with [id:${id}]`);
            yield this.prisma.balance.delete({
                where: {
                    id
                }
            });
        });
    }
}
exports.BalanceService = BalanceService;
