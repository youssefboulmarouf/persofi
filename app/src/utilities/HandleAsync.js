"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = __importDefault(require("./errors/AppError"));
const Logger_1 = __importDefault(require("./Logger"));
const logger = new Logger_1.default("HandleAsync");
const handleAsync = (fn) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield fn(req, res, next);
    }
    catch (e) {
        if (e instanceof AppError_1.default) {
            logger.error(e.message, e);
            res.status(e.status).json({
                name: e.name,
                message: e.message,
            });
        }
        else {
            logger.error("Unexpected error:", e);
            res.status(500).json({
                name: "UnknownError",
                message: `An unexpected error occurred: ${e.message}`,
            });
        }
    }
});
exports.default = handleAsync;
