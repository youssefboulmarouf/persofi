import express, {Request, Response} from "express";
import {BrandService} from "./BrandService";
import handleAsync from "../utilities/HandleAsync";
import {BrandJson} from "./BrandJson";

const router = express.Router();
const brandService = new BrandService();

router.get("/",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await brandService.get()
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
                    await brandService.getById(
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
                    await brandService.create(
                        BrandJson.from(req.body)
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
                    await brandService.update(
                        Number(req.params.id),
                        BrandJson.from(req.body)
                    )
                );
        }
    )
);

router.delete("/:id",
    handleAsync(
        async (req: Request, res: Response) => {
            await brandService.delete(Number(req.params.id));
            res.status(204).send();
        }
    )
);

export default router;
