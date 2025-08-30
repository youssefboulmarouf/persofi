import express, {Request, Response} from "express";
import handleAsync from "../utilities/HandleAsync";
import {PersonService} from "./PersonService";
import {PersonJson} from "./PersonJson";

const router = express.Router();
const personService = new PersonService();

router.get("/",
    handleAsync(
        async (req: Request, res: Response) => {
            res
                .status(200)
                .json(
                    await personService.get()
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
                    await personService.getById(
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
                    await personService.create(
                        PersonJson.from(req.body)
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
                await personService.update(
                    Number(req.params.id),
                    PersonJson.from(req.body)
                )
            );
        }
    )
);

router.delete("/:id",
    handleAsync(
        async (req: Request, res: Response) => {
            await personService.delete(Number(req.params.id));
            res.status(204).send();
        }
    )
);

export default router;
