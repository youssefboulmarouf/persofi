"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryJson = void 0;
class CategoryJson {
    constructor(id, name, active, parentCategoryId) {
        this.id = id;
        this.name = name;
        this.active = active;
        this.parentCategoryId = parentCategoryId;
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    getParentCategory() {
        return this.parentCategoryId;
    }
    isActive() {
        return this.active;
    }
    static from(body) {
        return new CategoryJson(Number(body.id), body.name, body.active, body.parentCategoryId != null ? Number(body.parentCategoryId) : null);
    }
}
exports.CategoryJson = CategoryJson;
