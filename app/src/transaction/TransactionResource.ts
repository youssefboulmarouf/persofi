import express, {Request, Response} from "express";
import handleAsync from "../utilities/HandleAsync";
import {TransactionService} from "./TransactionService";
import {TransactionJson} from "./TransactionJson";

const router = express.Router();
const transactionService = new TransactionService();

router.get("/",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await transactionService.get()
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
                    await transactionService.getById(
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
                    await transactionService.create(
                        TransactionJson.from(req.body)
                    )
                );
        }
    )
);

router.post("/:id/process",
    handleAsync(
        async  (req: Request, res: Response) => {
            res
                .status(201)
                .json(
                    await transactionService.processTransaction(
                        Number(req.params.id)
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
                await transactionService.update(
                    Number(req.params.id),
                    TransactionJson.from(req.body)
                )
            );
        }
    )
);

export default router;
