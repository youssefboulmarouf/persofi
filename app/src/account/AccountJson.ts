import {AccountTypeEnum, accountTypeFromString} from "./AccountType";

export class AccountJson {
    private readonly id: number;
    private readonly name: string;
    private readonly accountType: AccountTypeEnum;
    private readonly currentBalance: number;

    constructor(id: number, name: string, accountType: AccountTypeEnum, currentBalance: number) {
        this.id = id;
        this.name = name;
        this.accountType = accountType;
        this.currentBalance = currentBalance;
    }


    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getAccountType(): AccountTypeEnum {
        return this.accountType;
    }

    public getCurrentBalance(): number {
        return this.currentBalance;
    }

    public static from(body: any): AccountJson {
        return new AccountJson(
            Number(body.id),
            body.name,
            accountTypeFromString(body.accountType),
            body.currentBalance,
        )
    }
}