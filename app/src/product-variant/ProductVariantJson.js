"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductVariantJson = void 0;
const UnitType_1 = require("./UnitType");
class ProductVariantJson {
    constructor(id, description, active, unitSize, unitType, productId) {
        this.id = id;
        this.description = description;
        this.active = active;
        this.unitSize = unitSize;
        this.unitType = unitType;
        this.productId = productId;
    }
    getId() {
        return this.id;
    }
    getDescription() {
        return this.description;
    }
    getUnitSize() {
        return this.unitSize;
    }
    getUnitType() {
        return this.unitType;
    }
    isActive() {
        return this.active;
    }
    getProductId() {
        return this.productId;
    }
    static from(body) {
        return new ProductVariantJson(Number(body.id), body.description, body.active, Number(body.unitSize), (0, UnitType_1.unitTypeFromString)(body.unitType), Number(body.productId));
    }
}
exports.ProductVariantJson = ProductVariantJson;
