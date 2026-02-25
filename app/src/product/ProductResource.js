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
const ProductService_1 = require("./ProductService");
const ProductJson_1 = require("./ProductJson");
const router = express_1.default.Router();
const productService = new ProductService_1.ProductService();
router.get("/", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(yield productService.get());
})));
router.get("/:id", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(yield productService.getById(Number(req.params.id)));
})));
router.post("/", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(201)
        .json(yield productService.create(ProductJson_1.ProductJson.from(req.body)));
})));
router.put("/:id", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(yield productService.update(Number(req.params.id), ProductJson_1.ProductJson.from(req.body)));
})));
router.delete("/:id", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield productService.delete(Number(req.params.id));
    res.status(204).send();
})));
exports.default = router;
