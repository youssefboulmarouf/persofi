import express, { Request, Response } from "express";
import handleAsync from "../utilities/HandleAsync";
import { BackupService } from "./BackupService";

const router = express.Router();
const backupService = new BackupService();

/**
 * GET /api/backup
 * Streams a full JSON backup of all database tables as a downloadable file.
 */
router.get(
    "/",
    handleAsync(async (req: Request, res: Response) => {
        const data = await backupService.exportAll();
        const filename = `persofi-backup-${new Date().toISOString().slice(0, 10)}.json`;

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.status(200).json(data);
    })
);

/**
 * POST /api/backup/restore
 * Accepts a JSON body containing a previously exported backup.
 * WARNING: This will DELETE all existing data before re-inserting.
 */
router.post(
    "/restore",
    handleAsync(async (req: Request, res: Response) => {
        await backupService.importAll(req.body);
        res.status(200).json({ message: "Restore completed successfully." });
    })
);

export default router;
