"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionJson = void 0;
const TransactionType_1 = require("./TransactionType");
const TransactionItemJson_1 = require("../transaction-item/TransactionItemJson");
class TransactionJson {
    constructor(id, date, type, notes, processed, items, payAccountId, counterpartyAccountId, storeId, refundOfId, personId, subtotal, taxTotal, grandTotal, amount) {
        this.id = id;
        this.date = date;
        this.type = type;
        this.notes = notes;
        this.processed = processed;
        this.items = items;
        this.payAccountId = payAccountId;
        this.counterpartyAccountId = counterpartyAccountId;
        this.storeId = storeId;
        this.refundOfId = refundOfId;
        this.personId = personId;
        this.subtotal = subtotal;
        this.taxTotal = taxTotal;
        this.grandTotal = grandTotal;
        this.amount = amount;
    }
    getId() {
        return this.id;
    }
    getDate() {
        return this.date;
    }
    getTransactionType() {
        return this.type;
    }
    getNotes() {
        return this.notes;
    }
    getPayAccountId() {
        return this.payAccountId;
    }
    getCounterpartyAccountId() {
        return this.counterpartyAccountId;
    }
    getStoreId() {
        return this.storeId;
    }
    getRefundOfId() {
        return this.refundOfId;
    }
    getPersonId() {
        return this.personId;
    }
    getSubtotal() {
        return this.subtotal;
    }
    getTaxTotal() {
        return this.taxTotal;
    }
    getGrandTotal() {
        return this.grandTotal;
    }
    getAmount() {
        return this.amount;
    }
    getItems() {
        return this.items;
    }
    isProcessed() {
        return this.processed;
    }
    static from(body) {
        return new TransactionJson(Number(body.id), new Date(body.date), (0, TransactionType_1.TransactionTypeFromString)(body.type), body.notes, Boolean(body.processed), body.items.map(TransactionItemJson_1.TransactionItemJson.from), (body.payAccountId === null) ? null : Number(body.payAccountId), (body.counterpartyAccountId === null) ? null : Number(body.counterpartyAccountId), (body.storeId === null) ? null : Number(body.storeId), (body.refundOfId === null) ? null : Number(body.refundOfId), (body.personId === null) ? null : Number(body.personId), Number(body.subtotal), Number(body.taxTotal), Number(body.grandTotal), Number(body.amount));
    }
}
exports.TransactionJson = TransactionJson;
