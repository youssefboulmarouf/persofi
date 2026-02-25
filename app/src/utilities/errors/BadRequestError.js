"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("./AppError"));
class BadRequestError extends AppError_1.default {
    constructor(message) {
        super(BadRequestError.name, 400, message);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }
    static throwIf(condition, message) {
        if (condition) {
            throw new BadRequestError(message);
        }
    }
}
exports.default = BadRequestError;
