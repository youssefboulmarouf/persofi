export class ProductJson {
    private readonly id: number;
    private readonly name: string;
    private readonly active: boolean;
    private readonly categoryId: number;

    constructor(id: number, name: string, active: boolean, categoryId: number) {
        this.id = id;
        this.name = name;
        this.active = active;
        this.categoryId = categoryId;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getCategoryId(): number {
        return this.categoryId;
    }

    public isActive(): boolean {
        return this.active;
    }

    public static from(body: any): ProductJson {
        return new ProductJson(
            Number(body.id),
            body.name,
            body.active,
            body.categoryId,
        )
    }

}