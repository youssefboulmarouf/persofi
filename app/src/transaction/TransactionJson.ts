import {TransactionTypeEnum} from "./TransactionType";
import {TransactionItemJson} from "../transaction-item/TransactionItemJson";
import {UnitTypeEnum, unitTypeFromString} from "../product-variant/UnitType";
import {ProductVariantJson} from "../product-variant/ProductVariantJson";

export class TransactionJson {
    private readonly id: number;
    private readonly date: Date;
    private readonly transactionType: TransactionTypeEnum;
    private readonly notes: string;
    private readonly transactionItems: TransactionItemJson[];

    private readonly payAccountId: number;
    private readonly counterpartyAccountId: number | null;
    private readonly storeId: number | null;
    private readonly refundId: number | null;

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
        transactionItems: TransactionItemJson[],
        payAccountId: number,
        counterpartyAccountId: number | null,
        storeId: number | null,
        refundId: number | null,
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
        this.transactionItems = transactionItems;
        this.payAccountId = payAccountId;
        this.counterpartyAccountId = counterpartyAccountId;
        this.storeId = storeId;
        this.refundId = refundId;
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

    public getTransactionItems(): TransactionItemJson[] {
        return this.transactionItems;
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

    public getRefundId(): number | null {
        return this.refundId;
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
            body.transactionItems.map(TransactionItemJson.from),
            Number(body.payAccountId),
            (body.counterpartyAccountId === null) ? null : Number(body.counterpartyAccountId),
            (body.storeId === null) ? null : Number(body.storeId),
            (body.refundId === null) ? null : Number(body.refundId),
            (body.personId === null) ? null : Number(body.personId),
            (body.subtotal === null) ? null : Number(body.subtotal),
            (body.taxTotal === null) ? null : Number(body.taxTotal),
            (body.grandTotal === null) ? null : Number(body.grandTotal),
            (body.amount === null) ? null : Number(body.amount),
        )
    }
}