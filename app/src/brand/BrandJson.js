"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrandJson = void 0;
class BrandJson {
    constructor(id, name, url, active) {
        this.id = id;
        this.name = name;
        this.url = url;
        this.active = active;
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    getUrl() {
        return this.url;
    }
    isActive() {
        return this.active;
    }
    static from(body) {
        return new BrandJson(Number(body.id), body.name, body.url, body.active);
    }
}
exports.BrandJson = BrandJson;
