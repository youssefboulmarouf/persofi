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
exports.BrandService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const BrandJson_1 = require("./BrandJson");
const NotFoundError_1 = __importDefault(require("../utilities/errors/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
class BrandService extends BaseService_1.BaseService {
    constructor() {
        super(BrandService.name);
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get all brands`);
            return (yield this.prisma.brand.findMany()).map(BrandJson_1.BrandJson.from);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get brand by [id:${id}]`);
            const data = yield this.prisma.brand.findUnique({
                where: { id }
            });
            NotFoundError_1.default.throwIf(!data, `Brand with [id:${id}] not found`);
            return BrandJson_1.BrandJson.from(data);
        });
    }
    create(brand) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Create new brand`, brand);
            const data = yield this.prisma.brand.create({
                data: {
                    name: brand.getName(),
                    url: brand.getUrl(),
                    active: true
                }
            });
            return BrandJson_1.BrandJson.from(data);
        });
    }
    update(id, brand) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Update brand with [id=${id}]`);
            BadRequestError_1.default.throwIf(id != brand.getId(), `Brand id mismatch`);
            const existingBrand = yield this.getById(id);
            this.logger.log(`Update existing brand`, existingBrand);
            this.logger.log(`Brand updated data`, brand);
            return BrandJson_1.BrandJson.from(yield this.prisma.brand.update({
                where: { id },
                data: {
                    name: brand.getName(),
                    url: brand.getUrl(),
                    active: brand.isActive()
                }
            }));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Delete brand with [id=${id}]`);
            yield this.prisma.brand.delete({
                where: { id }
            });
        });
    }
}
exports.BrandService = BrandService;
