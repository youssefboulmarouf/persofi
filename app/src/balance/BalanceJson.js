"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceJson = void 0;
class BalanceJson {
    constructor(id, amount, date, accountId, transactionId) {
        this.id = id;
        this.amount = amount;
        this.date = date;
        this.accountId = accountId;
        this.transactionId = transactionId;
    }
    getId() {
        return this.id;
    }
    getAmount() {
        return this.amount;
    }
    getDate() {
        return this.date;
    }
    getAccountId() {
        return this.accountId;
    }
    getTransactionId() {
        return this.transactionId;
    }
    static from(body) {
        return new BalanceJson(Number(body.id), Number(body.amount), new Date(body.date), Number(body.accountId), Number(body.transactionId));
    }
}
exports.BalanceJson = BalanceJson;
