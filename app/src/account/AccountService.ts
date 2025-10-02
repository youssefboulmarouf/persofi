import {BaseService} from "../utilities/BaseService";
import {AccountJson} from "./AccountJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import BadRequestError from "../utilities/errors/BadRequestError";

export class AccountService extends BaseService {

    constructor() {
        super(AccountService.name);
    }

    async get(): Promise<AccountJson[]> {
        this.logger.log(`Get all accounts`);
        return (await this.prisma.account.findMany()).map(AccountJson.from);
    }

    async getById(id: number): Promise<AccountJson> {
        this.logger.log(`Get account by [id:${id}]`);

        const data = await this.prisma.account.findUnique({
            where: { id }
        });

        NotFoundError.throwIf(!data, `Account with [id:${id}] not found`);

        return AccountJson.from(data);
    }

    async create(account: AccountJson): Promise<AccountJson> {
        this.logger.log(`Create new account`, account);

        return AccountJson.from(
            await this.prisma.account.create({
                data: {
                    name: account.getName(),
                    accountType: account.getAccountType(),
                    currency: account.getCurrency(),
                    active: account.isActive()
                }
            })
        );
    }

    async update(id: number, account: AccountJson): Promise<AccountJson> {
        this.logger.log(`Update account with [id=${id}]`);

        BadRequestError.throwIf(id != account.getId(), `Account id mismatch`);

        const existingAccount = await this.getById(id);

        this.logger.log(`Update existing account`, existingAccount);
        this.logger.log(`Account updated data`, account);

        return AccountJson.from(
            await this.prisma.account.update({
                where: { id },
                data: {
                    name: account.getName(),
                    accountType: account.getAccountType(),
                    currency: account.getCurrency(),
                    active: account.isActive(),
                }
            })
        );
    }

    async delete(id: number): Promise<void> {
        this.logger.log(`Delete account with [id=${id}]`);
        await this.prisma.account.delete({
            where: { id }
        })
    }
}