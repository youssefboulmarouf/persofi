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
const BrandService_1 = require("./BrandService");
const HandleAsync_1 = __importDefault(require("../utilities/HandleAsync"));
const BrandJson_1 = require("./BrandJson");
const router = express_1.default.Router();
const brandService = new BrandService_1.BrandService();
router.get("/", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(yield brandService.get());
})));
router.get("/:id", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(yield brandService.getById(Number(req.params.id)));
})));
router.post("/", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(201)
        .json(yield brandService.create(BrandJson_1.BrandJson.from(req.body)));
})));
router.put("/:id", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res
        .status(200)
        .json(yield brandService.update(Number(req.params.id), BrandJson_1.BrandJson.from(req.body)));
})));
router.delete("/:id", (0, HandleAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield brandService.delete(Number(req.params.id));
    res.status(204).send();
})));
exports.default = router;
