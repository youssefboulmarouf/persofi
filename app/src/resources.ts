import express, { Request, Response } from "express";
import AccountResource from "./account/AccountResource";
import CategoryResource from "./category/CategoryResource";
import PersonResource from "./person/PersonResource";
import ProductResource from "./product/ProductResource";
import ProductVariantResource from "./product-variant/ProductVariantResource";
import StoreResource from "./store/StoreResource";
import TransactionResource from "./transaction/TransactionResource";
import TransactionItemResource from "./transaction-item/TransactionItemResource";
import BrandResource from "./brand/BrandResource";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
    res.send("Persofi backend is running!");
});

router.use("/account", AccountResource);
router.use("/brand", BrandResource);
router.use("/category", CategoryResource);
router.use("/person", PersonResource);
router.use("/product", ProductResource);
router.use("/product-variant", ProductVariantResource);
router.use("/store", StoreResource);
router.use("/transaction", TransactionResource);
router.use("/transaction-item", TransactionItemResource);

export default router;