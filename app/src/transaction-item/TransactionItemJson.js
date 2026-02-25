"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionItemJson = void 0;
class TransactionItemJson {
    constructor(id, transactionId, description, quantity, unitPrice, lineTotal, variantId, brandId, categoryId) {
        this.id = id;
        this.transactionId = transactionId;
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
        this.brandId = brandId;
        this.variantId = variantId;
        this.categoryId = categoryId;
    }
    getId() {
        return this.id;
    }
    getTransactionId() {
        return this.transactionId;
    }
    setTransactionId(transactionId) {
        this.transactionId = transactionId;
    }
    getDescription() {
        return this.description;
    }
    getQuantity() {
        return this.quantity;
    }
    getUnitPrice() {
        return this.unitPrice;
    }
    getLineTotal() {
        return this.lineTotal;
    }
    getVariantId() {
        return this.variantId;
    }
    getCategoryId() {
        return this.categoryId;
    }
    getBrandId() {
        return this.brandId;
    }
    static from(body) {
        return new TransactionItemJson(Number(body.id), Number(body.transactionId), body.description, Number(body.quantity), Number(body.unitPrice), Number(body.lineTotal), (body.variantId === null) ? null : Number(body.variantId), (body.brandId === null) ? null : Number(body.brandId), (body.categoryId === null) ? null : Number(body.categoryId));
    }
}
exports.TransactionItemJson = TransactionItemJson;
