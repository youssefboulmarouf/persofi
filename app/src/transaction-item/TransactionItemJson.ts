export class TransactionItemJson {
    private readonly id: number;
    private transactionId: number;
    private readonly description: string;

    private readonly brandId: number | null;
    private readonly variantId: number | null;
    private readonly categoryId: number | null;

    private readonly quantity: number;
    private readonly unitPrice: number;
    private readonly lineTotal: number;

    constructor(
        id: number,
        transactionId: number,
        description: string,
        quantity: number,
        unitPrice: number,
        lineTotal: number,
        variantId: number | null,
        brandId: number | null,
        categoryId: number | null,
    ) {
        this.id = id;
        this.transactionId = transactionId;
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.lineTotal = lineTotal;
        this.brandId = brandId;
        this.variantId = variantId;
        this.categoryId = categoryId;
    }

    public getId(): number {
        return this.id;
    }

    public getTransactionId(): number {
        return this.transactionId;
    }

    public setTransactionId(transactionId: number): void {
        this.transactionId = transactionId;
    }

    public getDescription(): string {
        return this.description;
    }

    public getQuantity(): number {
        return this.quantity;
    }

    public getUnitPrice(): number {
        return this.unitPrice;
    }

    public getLineTotal(): number {
        return this.lineTotal;
    }

    public getVariantId(): number | null {
        return this.variantId;
    }

    public getCategoryId(): number | null {
        return this.categoryId;
    }

    public getBrandId(): number | null {
        return this.brandId;
    }

    public static from(body: any): TransactionItemJson {
        return new TransactionItemJson(
            Number(body.id),
            Number(body.transactionId),
            body.description,
            Number(body.quantity),
            Number(body.unitPrice),
            Number(body.lineTotal),
            (body.variantId === null) ? null : Number(body.variantId),
            (body.brandId === null) ? null : Number(body.brandId),
            (body.categoryId === null) ? null : Number(body.categoryId),
        )
    }

}