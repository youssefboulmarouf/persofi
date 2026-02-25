"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountJson = void 0;
const AccountType_1 = require("./AccountType");
class AccountJson {
    constructor(id, name, accountType, currency, active) {
        this.id = id;
        this.name = name;
        this.accountType = accountType;
        this.currency = currency;
        this.active = active;
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    getAccountType() {
        return this.accountType;
    }
    getCurrency() {
        return this.currency;
    }
    isActive() {
        return this.active;
    }
    static from(body) {
        return new AccountJson(Number(body.id), body.name, (0, AccountType_1.accountTypeFromString)(body.accountType), body.currency, body.active);
    }
}
exports.AccountJson = AccountJson;
