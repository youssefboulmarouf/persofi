import {BaseService} from "../utilities/BaseService";
import NotFoundError from "../utilities/errors/NotFoundError";
import {BalanceJson} from "./BalanceJson";

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
            where: { id }
        });

        NotFoundError.throwIf(!data, `Balance with [id:${id}] not found`);

        return BalanceJson.from(data);
    }

    async getByAccountId(accountId: number): Promise<BalanceJson[]> {
        this.logger.log(`Get balance by [accountI:${accountId}]`);

        const data = await this.prisma.balance.findMany({
            where: { accountId }
        });

        return data.map(BalanceJson.from);
    }
}