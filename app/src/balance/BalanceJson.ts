import { Prisma } from "@prisma/client";
import { Money } from "../utilities/Money";

export class BalanceJson {
    private readonly id: number;
    private readonly amount: Prisma.Decimal;
    private readonly date: Date;
    private readonly accountId: number;
    private readonly transactionId: number;

    constructor(
        id: number,
        amount: Prisma.Decimal,
        date: Date,
        accountId: number,
        transactionId: number,
    ) {
        this.id = id;
        this.amount = amount;
        this.date = date;
        this.accountId = accountId;
        this.transactionId = transactionId;
    }

    public getId(): number {
        return this.id;
    }

    public getAmount(): Prisma.Decimal {
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
            Money.parse(body.amount === null ? 0 : body.amount, "amount"),
            new Date(body.date),
            Number(body.accountId),
            Number(body.transactionId),
        );
    }

    public toJSON() {
        return {
            id: this.id,
            amount: Money.serialize(this.amount),
            date: this.date,
            accountId: this.accountId,
            transactionId: this.transactionId,
        };
    }
}
