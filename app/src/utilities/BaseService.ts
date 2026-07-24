import { PrismaClient } from "@prisma/client";
import Logger from "./Logger";
import { prisma } from "./prisma";

export class BaseService {
    protected prisma: PrismaClient;
    protected readonly logger: Logger;

    protected constructor(className: string) {
        this.prisma = prisma;
        this.logger = new Logger(className);
    }
}
