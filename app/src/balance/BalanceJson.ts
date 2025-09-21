export class BalanceJson {
    private readonly id: number;
    private readonly amount: number;
    private readonly date: Date;
    private readonly accountId: number;
    private readonly transactionId: number;

    constructor(id: number, amount: number, date: Date, accountId: number, transactionId: number) {
        this.id = id;
        this.amount = amount;
        this.date = date;
        this.accountId = accountId;
        this.transactionId = transactionId;
    }


    public getId(): number {
        return this.id;
    }

    public getAmount(): number {
        return this.amount;
    }

    public getDate(): Date {
        return this.date;
    }

    public getAccountId(): number {
        return this.accountId;
    }

    public getTransactionId(): number {
        return this.transactionId;
    }

    public static from(body: any): BalanceJson {
        return new BalanceJson(
            Number(body.id),
            Number(body.amount),
            new Date(body.date),
            Number(body.accountId),
            Number(body.transactionId)
        )
    }
}