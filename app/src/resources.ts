import express, { Request, Response } from "express";
import AccountResource from "./account/AccountResource";
import CategoryResource from "./category/CategoryResource";
import PersonResource from "./person/PersonResource";
import ProductResource from "./product/ProductResource";
import ProductVariantResource from "./product-variant/ProductVariantResource";
import StoreResource from "./store/StoreResource";
import TransactionResource from "./transaction/TransactionResource";
import BrandResource from "./brand/BrandResource";
import BalanceResource from "./balance/BalanceResource";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
    res.send("Persofi backend is running!");
});

router.use("/accounts", AccountResource);
router.use("/balances", BalanceResource);
router.use("/brands", BrandResource);
router.use("/categories", CategoryResource);
router.use("/persons", PersonResource);
router.use("/products", ProductResource);
router.use("/product-variants", ProductVariantResource);
router.use("/stores", StoreResource);
router.use("/transactions", TransactionResource);

export default router;