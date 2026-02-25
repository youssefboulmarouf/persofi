"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AccountResource_1 = __importDefault(require("./account/AccountResource"));
const CategoryResource_1 = __importDefault(require("./category/CategoryResource"));
const PersonResource_1 = __importDefault(require("./person/PersonResource"));
const ProductResource_1 = __importDefault(require("./product/ProductResource"));
const ProductVariantResource_1 = __importDefault(require("./product-variant/ProductVariantResource"));
const StoreResource_1 = __importDefault(require("./store/StoreResource"));
const TransactionResource_1 = __importDefault(require("./transaction/TransactionResource"));
const BrandResource_1 = __importDefault(require("./brand/BrandResource"));
const BalanceResource_1 = __importDefault(require("./balance/BalanceResource"));
const router = express_1.default.Router();
router.get("/", (req, res) => {
    res.send("Persofi backend is running!");
});
router.use("/accounts", AccountResource_1.default);
router.use("/balances", BalanceResource_1.default);
router.use("/brands", BrandResource_1.default);
router.use("/categories", CategoryResource_1.default);
router.use("/persons", PersonResource_1.default);
router.use("/products", ProductResource_1.default);
router.use("/variants", ProductVariantResource_1.default);
router.use("/stores", StoreResource_1.default);
router.use("/transactions", TransactionResource_1.default);
exports.default = router;
