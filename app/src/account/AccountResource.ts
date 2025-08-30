import express, {Request, Response} from "express";
import handleAsync from "../utilities/HandleAsync";
import {AccountService} from "./AccountService";
import {AccountJson} from "./AccountJson";

const router = express.Router();
const accountService = new AccountService();

router.get("/",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await accountService.get()
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
                    await accountService.getById(
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
                    await accountService.create(
                        AccountJson.from(req.body)
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
                await accountService.update(
                    Number(req.params.id),
                    AccountJson.from(req.body)
                )
            );
        }
    )
);

router.delete("/:id",
    handleAsync(
        async (req: Request, res: Response) => {
            await accountService.delete(Number(req.params.id));
            res.status(204).send();
        }
    )
);

export default router;
