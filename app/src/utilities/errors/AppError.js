"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AppError extends Error {
    constructor(name, status, message) {
        super(message);
        this.name = name;
        this.status = status;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.default = AppError;
