export class ProductJson {
    private readonly id: number;
    private readonly name: string;
    private readonly brand: string;
    private readonly categoryId: number;

    constructor(id: number, name: string, brand: string, categoryId: number) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.categoryId = categoryId;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getBrand(): string {
        return this.brand;
    }

    public getCategoryId(): number {
        return this.categoryId;
    }

    public static from(body: any): ProductJson {
        return new ProductJson(
            Number(body.id),
            body.name,
            body.brand,
            body.categoryId,
        )
    }

}