import express, {Request, Response} from "express";
import handleAsync from "../utilities/HandleAsync";
import {TransactionItemService} from "./TransactionItemService";
import {TransactionItemJson} from "./TransactionItemJson";

const router = express.Router();
const transactionItemService = new TransactionItemService();

router.get("/",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await transactionItemService.get()
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
                    await transactionItemService.getById(
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
                    await transactionItemService.create(
                        TransactionItemJson.from(req.body)
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
                await transactionItemService.update(
                    Number(req.params.id),
                    TransactionItemJson.from(req.body)
                )
            );
        }
    )
);

router.delete("/:id",
    handleAsync(
        async (req: Request, res: Response) => {
            await transactionItemService.delete(Number(req.params.id));
            res.status(204).send();
        }
    )
);

export default router;
