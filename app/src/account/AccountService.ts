import {BaseService} from "../utilities/BaseService";
import {AccountJson} from "./AccountJson";
import {AccountTypeEnum} from "./AccountType";

export class AccountService extends BaseService {
    constructor() {
        super(AccountService.name);
    }

    async get(): Promise<AccountJson[]> {
        return [];
    }

    async getById(accountId: number): Promise<AccountJson> {
        return new AccountJson(0,"", AccountTypeEnum.CASH, 0);
    }

    async create(account: AccountJson): Promise<AccountJson> {
        return account;
    }

    async update(accountId: number, account: AccountJson): Promise<AccountJson> {
        return account;
    }

    async delete(accountId: number): Promise<void> {}
}