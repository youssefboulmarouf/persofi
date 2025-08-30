import express, {Request, Response} from "express";
import handleAsync from "../utilities/HandleAsync";
import {ProductVariantService} from "./ProductVariantService";
import {ProductVariantJson} from "./ProductVariantJson";

const router = express.Router();
const productVariantService = new ProductVariantService();

router.get("/",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await productVariantService.get()
                );
        }
    )
);

router.get("/:id",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await productVariantService.getById(
                        Number(req.params.id)
                    )
                );
        }
    )
);

router.post("/",
    handleAsync(
        async  (req: Request, res: Response) => {
            res
                .status(201)
                .json(
                    await productVariantService.create(
                        ProductVariantJson.from(req.body)
                    )
                );
        }
    )
);

router.put("/:id",
    handleAsync(
        async (req: Request, res: Response) => {
            res
            .status(200)
            .json(
                await productVariantService.update(
                    Number(req.params.id),
                    ProductVariantJson.from(req.body)
                )
            );
        }
    )
);

router.delete("/:id",
    handleAsync(
        async (req: Request, res: Response) => {
            await productVariantService.delete(Number(req.params.id));
            res.status(204).send();
        }
    )
);

export default router;
