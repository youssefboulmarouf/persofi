import {AccountTypeEnum, accountTypeFromString} from "./AccountType";

export class AccountJson {
    private readonly id: number;
    private readonly name: string;
    private readonly accountType: AccountTypeEnum;
    private readonly currency: string;
    private readonly active: boolean;

    constructor(id: number, name: string, accountType: AccountTypeEnum, currency: string, active: boolean) {
        this.id = id;
        this.name = name;
        this.accountType = accountType;
        this.currency = currency;
        this.active = active;
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

    public getCurrency(): string {
        return this.currency;
    }

    public isActive(): boolean {
        return this.active;
    }

    public static from(body: any): AccountJson {
        return new AccountJson(
            Number(body.id),
            body.name,
            accountTypeFromString(body.accountType),
            body.currency,
            body.active
        )
    }
}