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
exports.AccountService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const AccountJson_1 = require("./AccountJson");
const NotFoundError_1 = __importDefault(require("../utilities/errors/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
const AppError_1 = __importDefault(require("../utilities/errors/AppError"));
class AccountService extends BaseService_1.BaseService {
    constructor() {
        super(AccountService.name);
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get all accounts`);
            return (yield this.prisma.account.findMany()).map(AccountJson_1.AccountJson.from);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get account by [id:${id}]`);
            const data = yield this.prisma.account.findUnique({
                where: { id }
            });
            NotFoundError_1.default.throwIf(!data, `Account with [id:${id}] not found`);
            return AccountJson_1.AccountJson.from(data);
        });
    }
    create(account) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Create new account`, account);
            return AccountJson_1.AccountJson.from(yield this.prisma.account.create({
                data: {
                    name: account.getName(),
                    accountType: account.getAccountType(),
                    currency: account.getCurrency(),
                    active: account.isActive()
                }
            }));
        });
    }
    update(id, account) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Update account with [id=${id}]`);
            BadRequestError_1.default.throwIf(id != account.getId(), `Account id mismatch`);
            const existingAccount = yield this.getById(id);
            this.logger.log(`Update existing account`, existingAccount);
            this.logger.log(`Account updated data`, account);
            return AccountJson_1.AccountJson.from(yield this.prisma.account.update({
                where: { id },
                data: {
                    name: account.getName(),
                    accountType: account.getAccountType(),
                    currency: account.getCurrency(),
                    active: account.isActive(),
                }
            }));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Delete account with [id=${id}]`);
            try {
                yield this.prisma.account.delete({
                    where: { id }
                });
            }
            catch (e) {
                throw new AppError_1.default("Runtime Error", 500, `Unable to delete account that is tied to other entities: ${e.message}.`);
            }
        });
    }
}
exports.AccountService = AccountService;
