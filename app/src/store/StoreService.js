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
exports.StoreService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const StoreJson_1 = require("./StoreJson");
const NotFoundError_1 = __importDefault(require("../utilities/errors/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
class StoreService extends BaseService_1.BaseService {
    constructor() {
        super(StoreService.name);
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get all stores`);
            return (yield this.prisma.store.findMany()).map(StoreJson_1.StoreJson.from);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get store by [id:${id}]`);
            const data = yield this.prisma.store.findUnique({
                where: { id }
            });
            NotFoundError_1.default.throwIf(!data, `Store with [id:${id}] not found`);
            return StoreJson_1.StoreJson.from(data);
        });
    }
    create(store) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Create new store`, store);
            return StoreJson_1.StoreJson.from(yield this.prisma.store.create({
                data: {
                    name: store.getName(),
                    url: store.getUrl(),
                    active: true
                }
            }));
        });
    }
    update(id, store) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Update store with [id=${id}]`);
            BadRequestError_1.default.throwIf(id != store.getId(), `Store id mismatch`);
            const existingStore = yield this.getById(id);
            this.logger.log(`Update existing store`, existingStore);
            this.logger.log(`Store updated data`, store);
            return StoreJson_1.StoreJson.from(yield this.prisma.store.update({
                where: { id },
                data: {
                    name: store.getName(),
                    url: store.getUrl(),
                    active: store.isActive(),
                }
            }));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Delete store with [id=${id}]`);
            yield this.prisma.store.delete({
                where: { id }
            });
        });
    }
}
exports.StoreService = StoreService;
