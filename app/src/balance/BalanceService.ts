import { BaseService } from "../utilities/BaseService";
import NotFoundError from "../utilities/errors/NotFoundError";
import { BalanceJson } from "./BalanceJson";
import BadRequestError from "../utilities/errors/BadRequestError";
import { Prisma } from "@prisma/client";
import { Money } from "../utilities/Money";

export class BalanceService extends BaseService {
    constructor() {
        super(BalanceService.name);
    }

    async get(): Promise<BalanceJson[]> {
        this.logger.log(`Get all Balances`);
        return (await this.prisma.balance.findMany()).map(BalanceJson.from);
    }

    async getById(id: number): Promise<BalanceJson> {
        this.logger.log(`Get balance by [id:${id}]`);

        const data = await this.prisma.balance.findUnique({
            where: { id },
        });

        NotFoundError.throwIf(!data, `Balance with [id:${id}] not found`);

        return BalanceJson.from(data);
    }

    async getByAccountId(accountId: number): Promise<BalanceJson[]> {
        this.logger.log(`Get balance by [accountI:${accountId}]`);

        const data = await this.prisma.balance.findMany({
            where: { accountId },
        });

        return data.map(BalanceJson.from);
    }

    async getLatestBalanceOfAccount(accountId: number): Promise<BalanceJson> {
        const latest = await this.findLatestBalanceOfAccount(accountId);

        BadRequestError.throwIf(
            !latest,
            `Balance for account with [id:${accountId}] not found, try to initialize it first`,
        );

        return latest as BalanceJson;
    }

    async findLatestBalanceOfAccount(accountId: number): Promise<BalanceJson | null> {
        this.logger.log(`Get latest balance by [accountI:${accountId}]`);

        const data = await this.prisma.balance.findFirst({
            where: { accountId },
            orderBy: [{ id: "desc" }],
        });

        return data ? BalanceJson.from(data) : null;
    }

    async updateAccountBalance(
        newBalance: Prisma.Decimal | number,
        date: Date,
        transactionId: number,
        accountId: number,
    ): Promise<void> {
        this.logger.log(
            `Update balance for account with [accountId:${accountId}] and transaction with [transactionId:${transactionId}]`,
        );
        await this.prisma.balance.create({
            data: {
                amount: Money.parse(newBalance),
                date,
                accountId,
                transactionId,
            },
        });
    }

    async delete(id: number) {
        this.logger.log(`Deleting balance with [id:${id}]`);
        await this.prisma.balance.delete({
            where: {
                id,
            },
        });
    }
}
