import { PrismaClient } from "@prisma/client";
import Logger from "./Logger";

export class BaseService {
    protected prisma: PrismaClient;
    protected readonly logger: Logger;

    protected constructor(className: string) {
        this.prisma = new PrismaClient();
        this.logger = new Logger(className);
    }
}
