import express, {Request, Response} from "express";
import handleAsync from "../utilities/HandleAsync";
import {BalanceService} from "./BalanceService";

const router = express.Router();
const balanceService = new BalanceService();

router.get("/",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await balanceService.get()
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
                    await balanceService.getById(
                        Number(req.params.id)
                    )
                );
        }
    )
);

export default router;
