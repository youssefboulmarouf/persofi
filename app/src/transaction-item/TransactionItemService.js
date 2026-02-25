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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionItemService = void 0;
const BaseService_1 = require("../utilities/BaseService");
class TransactionItemService extends BaseService_1.BaseService {
    constructor() {
        super(TransactionItemService.name);
    }
    createManyForTrnasaction(transactionId, transactionItems) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Creating items for transaction with [id=${transactionId}]`);
            this.logger.log(`Items [${transactionItems}]`);
            yield this.prisma.transactionItem.createMany({
                data: transactionItems.map(item => ({
                    transactionId,
                    description: item.getDescription(),
                    variantId: item.getVariantId(),
                    categoryId: item.getCategoryId(),
                    brandId: item.getBrandId(),
                    quantity: item.getQuantity(),
                    unitPrice: item.getUnitPrice(),
                    lineTotal: item.getLineTotal()
                }))
            });
        });
    }
    deleteByTransactionId(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Deleting items for transaction with [id=${transactionId}]`);
            yield this.prisma.transactionItem.deleteMany({
                where: { transactionId }
            });
        });
    }
}
exports.TransactionItemService = TransactionItemService;
