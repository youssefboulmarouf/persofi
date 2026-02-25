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
const express_1 = __importDefault(require("express"));
const HandleAsync_1 = __importDefault(require("../utilities/HandleAsync"));
const TransactionService_1 = require("./TransactionService");
const TransactionJson_1 = require("./TransactionJson");
const router = express_1.default.Router();
const transactionService = new TransactionService_1.TransactionService();
router.get("/", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(yield transactionService.get());
})));
router.get("/:id", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(yield transactionService.getById(Number(req.params.id)));
})));
router.post("/", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(201)
        .json(yield transactionService.create(TransactionJson_1.TransactionJson.from(req.body)));
})));
router.post("/:id/process", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(201)
        .json(yield transactionService.processTransaction(Number(req.params.id)));
})));
router.put("/:id", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(yield transactionService.update(Number(req.params.id), TransactionJson_1.TransactionJson.from(req.body)));
})));
router.delete("/:id", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield transactionService.delete(Number(req.params.id));
    res.status(204).send();
})));
exports.default = router;
