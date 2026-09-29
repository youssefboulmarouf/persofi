import { TransactionTypeEnum, TransactionTypeFromString } from "./TransactionType";
import { TransactionItemJson } from "../transaction-item/TransactionItemJson";
import { Money, MoneyInput } from "../utilities/Money";
import { Prisma } from "@prisma/client";

export class TransactionJson {
    private readonly id: number;
    private readonly date: Date;
    private readonly type: TransactionTypeEnum;
    private readonly items: TransactionItemJson[];
    private readonly notes: string;
    private readonly processed: boolean;

    private readonly payAccountId: number | null;
    private readonly counterpartyAccountId: number | null;
    private readonly storeId: number | null;
    private readonly refundOfId: number | null;

    private readonly personId: number | null;
    // Totals for EXPENSE (required when type = expense)
    private readonly subtotal: Prisma.Decimal;
    private readonly taxTotal: Prisma.Decimal;
    private readonly grandTotal: Prisma.Decimal;

    // Simple amount for INCOME / CREDIT_PAYMENT / REFUND (required in those cases)
    private readonly amount: Prisma.Decimal;

    constructor(
        id: number,
        date: Date,
        type: TransactionTypeEnum,
        notes: string,
        processed: boolean,
        items: TransactionItemJson[],
        payAccountId: number | null,
        counterpartyAccountId: number | null,
        storeId: number | null,
        refundOfId: number | null,
        personId: number | null,
        subtotal: MoneyInput,
        taxTotal: MoneyInput,
        grandTotal: MoneyInput,
        amount: MoneyInput,
    ) {
        this.id = id;
        this.date = date;
        this.type = type;
        this.notes = notes;
        this.processed = processed;
        this.items = items;
        this.payAccountId = payAccountId;
        this.counterpartyAccountId = counterpartyAccountId;
        this.storeId = storeId;
        this.refundOfId = refundOfId;
        this.personId = personId;
        this.subtotal = Money.parse(subtotal, "subtotal");
        this.taxTotal = Money.parse(taxTotal, "taxTotal");
        this.grandTotal = Money.parse(grandTotal, "grandTotal");
        this.amount = Money.parse(amount, "amount");
    }

    public getId(): number {
        return this.id;
    }

    public getDate(): Date {
        return this.date;
    }

    public getTransactionType(): TransactionTypeEnum {
        return this.type;
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

    public getSubtotal(): Prisma.Decimal {
        return this.subtotal;
    }

    public getTaxTotal(): Prisma.Decimal {
        return this.taxTotal;
    }

    public getGrandTotal(): Prisma.Decimal {
        return this.grandTotal;
    }

    public getAmount(): Prisma.Decimal {
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
            TransactionTypeFromString(body.type),
            body.notes,
            Boolean(body.processed),
            body.items.map(TransactionItemJson.from),
            body.payAccountId === null ? null : Number(body.payAccountId),
            body.counterpartyAccountId === null ? null : Number(body.counterpartyAccountId),
            body.storeId === null ? null : Number(body.storeId),
            body.refundOfId === null ? null : Number(body.refundOfId),
            body.personId === null ? null : Number(body.personId),
            Money.parse(body.subtotal === null ? 0 : body.subtotal, "subtotal"),
            Money.parse(body.taxTotal === null ? 0 : body.taxTotal, "taxTotal"),
            Money.parse(body.grandTotal === null ? 0 : body.grandTotal, "grandTotal"),
            Money.parse(body.amount === null ? 0 : body.amount, "amount"),
        );
    }

    public toJSON() {
        return {
            id: this.id,
            date: this.date,
            type: this.type,
            items: this.items,
            notes: this.notes,
            processed: this.processed,
            payAccountId: this.payAccountId,
            counterpartyAccountId: this.counterpartyAccountId,
            storeId: this.storeId,
            refundOfId: this.refundOfId,
            personId: this.personId,
            subtotal: Money.serialize(this.subtotal),
            taxTotal: Money.serialize(this.taxTotal),
            grandTotal: Money.serialize(this.grandTotal),
            amount: Money.serialize(this.amount),
        };
    }
}
