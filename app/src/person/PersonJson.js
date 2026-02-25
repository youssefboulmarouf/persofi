"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonJson = void 0;
class PersonJson {
    constructor(id, name, active) {
        this.id = id;
        this.name = name;
        this.active = active;
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    isActive() {
        return this.active;
    }
    static from(body) {
        return new PersonJson(Number(body.id), body.name, body.active);
    }
}
exports.PersonJson = PersonJson;
