import {TransactionTypeEnum} from "./TransactionType";

export class TransactionJson {
    private readonly id: number;
    private readonly date: Date;
    private readonly transactionType: TransactionTypeEnum;
    private readonly notes: string;

    private readonly payAccountId: number;
    private readonly counterpartyAccountId: number | null;
    private readonly storeId: number | null;
    private readonly refundOfId: number | null;

    private readonly personId: number | null;
    // Totals for EXPENSE (required when type = expense)
    private readonly subtotal: number | null;
    private readonly taxTotal: number | null;
    private readonly grandTotal: number | null;

    // Simple amount for INCOME / CREDIT_PAYMENT / REFUND (required in those cases)
    private readonly amount: number | null;

    constructor(
        id: number,
        date: Date,
        transactionType: TransactionTypeEnum,
        notes: string,
        payAccountId: number,
        counterpartyAccountId: number | null,
        storeId: number | null,
        refundOfId: number | null,
        personId: number | null,
        subtotal: number | null,
        taxTotal: number | null,
        grandTotal: number | null,
        amount: number | null
    ) {
        this.id = id;
        this.date = date;
        this.transactionType = transactionType;
        this.notes = notes;
        this.payAccountId = payAccountId;
        this.counterpartyAccountId = counterpartyAccountId;
        this.storeId = storeId;
        this.refundOfId = refundOfId;
        this.personId = personId;
        this.subtotal = subtotal;
        this.taxTotal = taxTotal;
        this.grandTotal = grandTotal;
        this.amount = amount;
    }

    public getId(): number {
        return this.id;
    }

    public getDate(): Date {
        return this.date;
    }

    public getTransactionType(): TransactionTypeEnum {
        return this.transactionType;
    }

    public getNotes(): string {
        return this.notes;
    }

    public getPayAccountId(): number {
        return this.payAccountId;
    }

    public getCounterpartyAccountId(): number | null {
        return this.counterpartyAccountId;
    }

    public getStoreId(): number | null {
        return this.storeId;
    }

    public getRefundOfId(): number | null {
        return this.refundOfId;
    }

    public getPersonId(): number | null {
        return this.personId;
    }

    public getSubtotal(): number | null {
        return this.subtotal;
    }

    public getTaxTotal(): number | null {
        return this.taxTotal;
    }

    public getGrandTotal(): number | null {
        return this.grandTotal;
    }

    public getAmount(): number | null {
        return this.amount;
    }

    public static from(body: any): TransactionJson {
        return new TransactionJson(
            Number(body.id),
            new Date(body.date),
            body.transactionType,
            body.notes,
            Number(body.payAccountId),
            (body.counterpartyAccountId === null) ? null : Number(body.counterpartyAccountId),
            (body.storeId === null) ? null : Number(body.storeId),
            (body.refundOfId === null) ? null : Number(body.refundOfId),
            (body.personId === null) ? null : Number(body.personId),
            (body.subtotal === null) ? null : Number(body.subtotal),
            (body.taxTotal === null) ? null : Number(body.taxTotal),
            (body.grandTotal === null) ? null : Number(body.grandTotal),
            (body.amount === null) ? null : Number(body.amount),
        )
    }
}