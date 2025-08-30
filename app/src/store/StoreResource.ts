import express, {Request, Response} from "express";
import handleAsync from "../utilities/HandleAsync";
import {StoreService} from "./StoreService";
import {StoreJson} from "./StoreJson";

const router = express.Router();
const storeService = new StoreService();

router.get("/",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await storeService.get()
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
                    await storeService.getById(
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
                    await storeService.create(
                        StoreJson.from(req.body)
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
                await storeService.update(
                    Number(req.params.id),
                    StoreJson.from(req.body)
                )
            );
        }
    )
);

router.delete("/:id",
    handleAsync(
        async (req: Request, res: Response) => {
            await storeService.delete(Number(req.params.id));
            res.status(204).send();
        }
    )
);

export default router;
