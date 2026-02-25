"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("./AppError"));
class NotFoundError extends AppError_1.default {
    constructor(message) {
        super(NotFoundError.name, 404, message);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
    static throwIf(condition, message) {
        if (condition) {
            throw new NotFoundError(message);
        }
    }
}
exports.default = NotFoundError;
