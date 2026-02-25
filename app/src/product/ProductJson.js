"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductJson = void 0;
class ProductJson {
    constructor(id, name, active, categoryId) {
        this.id = id;
        this.name = name;
        this.active = active;
        this.categoryId = categoryId;
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    getCategoryId() {
        return this.categoryId;
    }
    isActive() {
        return this.active;
    }
    static from(body) {
        return new ProductJson(Number(body.id), body.name, body.active, body.categoryId);
    }
}
exports.ProductJson = ProductJson;
