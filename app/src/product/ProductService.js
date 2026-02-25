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
exports.ProductService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const ProductJson_1 = require("./ProductJson");
const NotFoundError_1 = __importDefault(require("../utilities/errors/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
const ProductVariantService_1 = require("../product-variant/ProductVariantService");
class ProductService extends BaseService_1.BaseService {
    constructor() {
        super(ProductService.name);
        this.productVariantService = new ProductVariantService_1.ProductVariantService();
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get all products`);
            return (yield this.prisma.product.findMany()).map(ProductJson_1.ProductJson.from);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get product by [id:${id}]`);
            const data = yield this.prisma.product.findUnique({
                where: { id }
            });
            NotFoundError_1.default.throwIf(!data, `Product with [id:${id}] not found`);
            return ProductJson_1.ProductJson.from(data);
        });
    }
    create(product) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Create new product`, product);
            return ProductJson_1.ProductJson.from(yield this.prisma.product.create({
                data: {
                    name: product.getName(),
                    categoryId: product.getCategoryId(),
                    active: true
                }
            }));
        });
    }
    update(id, product) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Update product with [id=${id}]`);
            BadRequestError_1.default.throwIf(id != product.getId(), `Product id mismatch`);
            const existingProduct = yield this.getById(id);
            this.logger.log(`Update existing product`, existingProduct);
            this.logger.log(`Product updated data`, product);
            return ProductJson_1.ProductJson.from(yield this.prisma.product.update({
                where: { id },
                data: {
                    name: product.getName(),
                    categoryId: product.getCategoryId(),
                    active: product.isActive()
                }
            }));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Delete product with [id=${id}]`);
            const productVariants = yield this.productVariantService.getByProductId(id);
            this.logger.log(`Delete variant of product with [id=${id}]`);
            yield Promise.all(productVariants.map((variant) => __awaiter(this, void 0, void 0, function* () { return yield this.productVariantService.delete(variant.getId()); })));
            yield this.prisma.product.delete({
                where: { id }
            });
        });
    }
}
exports.ProductService = ProductService;
