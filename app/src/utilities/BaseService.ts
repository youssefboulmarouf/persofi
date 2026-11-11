import { Prisma, PrismaClient } from "@prisma/client";
import Logger from "./Logger";
import { prisma } from "./prisma";

/** The shared client or an open interactive transaction; both expose the same model API. */
export type DbClient = Prisma.TransactionClient;

export class BaseService {
    protected prisma: PrismaClient;
    protected readonly logger: Logger;

    protected constructor(className: string) {
        this.prisma = prisma;
        this.logger = new Logger(className);
    }

    /** The client to query with: the caller's transaction when given, else the shared client. */
    protected db(tx?: DbClient): DbClient {
        return tx ?? this.prisma;
    }

    /**
     * Runs `work` atomically. Joins the caller's transaction when `tx` is given, so services
     * can compose into one database transaction; otherwise opens a new one.
     */
    protected async inTransaction<T>(
        work: (tx: DbClient) => Promise<T>,
        tx?: DbClient,
    ): Promise<T> {
        return tx ? work(tx) : this.prisma.$transaction(work);
    }
}
