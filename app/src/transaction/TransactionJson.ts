import {TransactionTypeEnum} from "./TransactionType";
import {TransactionItemJson} from "../transaction-item/TransactionItemJson";

export class TransactionJson {
    private readonly id: number;
    private readonly date: Date;
    private readonly transactionType: TransactionTypeEnum;
    private readonly items: TransactionItemJson[];
    private readonly notes: string;
    private readonly processed: boolean;

    private readonly payAccountId: number | null;
    private readonly counterpartyAccountId: number | null;
    private readonly storeId: number | null;
    private readonly refundOfId: number | null;

    private readonly personId: number | null;
    // Totals for EXPENSE (required when type = expense)
    private readonly subtotal: number;
    private readonly taxTotal: number;
    private readonly grandTotal: number;

    // Simple amount for INCOME / CREDIT_PAYMENT / REFUND (required in those cases)
    private readonly amount: number;

    constructor(
        id: number,
        date: Date,
        transactionType: TransactionTypeEnum,
        notes: string,
        processed: boolean,
        items: TransactionItemJson[],
        payAccountId: number | null,
        counterpartyAccountId: number | null,
        storeId: number | null,
        refundOfId: number | null,
        personId: number | null,
        subtotal: number,
        taxTotal: number,
        grandTotal: number,
        amount: number
    ) {
        this.id = id;
        this.date = date;
        this.transactionType = transactionType;
        this.notes = notes;
        this.processed = processed;
        this.items = items;
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

    public getPayAccountId(): number | null {
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

    public getSubtotal(): number {
        return this.subtotal;
    }

    public getTaxTotal(): number {
        return this.taxTotal;
    }

    public getGrandTotal(): number {
        return this.grandTotal;
    }

    public getAmount(): number {
        return this.amount;
    }

    public getItems(): TransactionItemJson[] {
        return this.items;
    }

    public isProcessed(): boolean {
        return this.processed;
    }

    public static from(body: any): TransactionJson {
        return new TransactionJson(
            Number(body.id),
            new Date(body.date),
            body.transactionType,
            body.notes,
            Boolean(body.processed),
            body.items.map(TransactionItemJson.from),
            Number(body.payAccountId),
            (body.counterpartyAccountId === null) ? null : Number(body.counterpartyAccountId),
            (body.storeId === null) ? null : Number(body.storeId),
            (body.refundOfId === null) ? null : Number(body.refundOfId),
            (body.personId === null) ? null : Number(body.personId),
            Number(body.subtotal),
            Number(body.taxTotal),
            Number(body.grandTotal),
            Number(body.amount),
        )
    }
}