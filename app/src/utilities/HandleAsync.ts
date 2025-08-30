import { Request, Response, NextFunction } from "express";
import AppError from "./errors/AppError";
import Logger from "./Logger";

const logger = new Logger("HandleAsync");

const handleAsync =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
        async (req: Request, res: Response, next: NextFunction) => {
            try {
                await fn(req, res, next);
            } catch (e: any) {
                if (e instanceof AppError) {
                    logger.error(e.message, e);
                    res.status(e.status).json({
                        name: e.name,
                        message: e.message,
                    });
                } else {
                    logger.error("Unexpected error:", e);
                    res.status(500).json({
                        name: "UnknownError",
                        message: `An unexpected error occurred: ${e.message}`,
                    });
                }
            }
        };

export default handleAsync;