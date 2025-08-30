import express, {Request, Response} from "express";
import handleAsync from "../utilities/HandleAsync";
import {CategoryService} from "./CategoryService";
import {CategoryJson} from "./CategoryJson";

const router = express.Router();
const categoryService = new CategoryService();

router.get("/",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await categoryService.get()
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
                    await categoryService.getById(
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
                    await categoryService.create(
                        CategoryJson.from(req.body)
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
                await categoryService.update(
                    Number(req.params.id),
                    CategoryJson.from(req.body)
                )
            );
        }
    )
);

router.delete("/:id",
    handleAsync(
        async (req: Request, res: Response) => {
            await categoryService.delete(Number(req.params.id));
            res.status(204).send();
        }
    )
);

export default router;
