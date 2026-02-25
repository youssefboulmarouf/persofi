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
exports.ProductVariantService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const ProductVariantJson_1 = require("./ProductVariantJson");
const NotFoundError_1 = __importDefault(require("../utilities/errors/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
class ProductVariantService extends BaseService_1.BaseService {
    constructor() {
        super(ProductVariantService.name);
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get all product variants`);
            return (yield this.prisma.productVariant.findMany()).map(ProductVariantJson_1.ProductVariantJson.from);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get product variant by [id:${id}]`);
            const data = yield this.prisma.productVariant.findUnique({
                where: { id }
            });
            NotFoundError_1.default.throwIf(!data, `Product variant with [id:${id}] not found`);
            return ProductVariantJson_1.ProductVariantJson.from(data);
        });
    }
    getByProductId(productId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get product variant by [productId:${productId}]`);
            const data = yield this.prisma.productVariant.findMany({
                where: { productId }
            });
            return data.map(ProductVariantJson_1.ProductVariantJson.from);
        });
    }
    create(variant) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Create new product variant`, variant);
            return ProductVariantJson_1.ProductVariantJson.from(yield this.prisma.productVariant.create({
                data: {
                    description: variant.getDescription(),
                    active: true,
                    unitSize: variant.getUnitSize(),
                    unitType: variant.getUnitType(),
                    productId: variant.getProductId()
                }
            }));
        });
    }
    update(id, variant) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Update product variant with [id=${id}]`);
            BadRequestError_1.default.throwIf(id != variant.getId(), `Product variant id mismatch`);
            const existingVariant = yield this.getById(id);
            this.logger.log(`Update existing product variant`, existingVariant);
            this.logger.log(`Product variant updated data`, variant);
            // TODO add logic for ProductVariantBrand
            return ProductVariantJson_1.ProductVariantJson.from(yield this.prisma.productVariant.update({
                where: { id },
                data: {
                    description: variant.getDescription(),
                    active: variant.isActive(),
                    unitSize: variant.getUnitSize(),
                    unitType: variant.getUnitType(),
                    productId: variant.getProductId()
                }
            }));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Delete product variant with [id=${id}]`);
            yield this.prisma.productVariant.delete({
                where: { id }
            });
        });
    }
}
exports.ProductVariantService = ProductVariantService;
