"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const client_1 = require("@prisma/client");
const Logger_1 = __importDefault(require("./Logger"));
class BaseService {
    constructor(className) {
        this.prisma = new client_1.PrismaClient();
        this.logger = new Logger_1.default(className);
    }
}
exports.BaseService = BaseService;
