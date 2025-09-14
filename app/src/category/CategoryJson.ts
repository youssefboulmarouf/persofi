export class CategoryJson {
    private readonly id: number;
    private readonly name: string;
    private readonly parentCategoryId: number | null;

    constructor(id: number, name: string, parentCategoryId: number | null) {
        this.id = id;
        this.name = name;
        this.parentCategoryId = parentCategoryId;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getParentCategory(): number | null {
        return this.parentCategoryId;
    }

    public static from(body: any): CategoryJson {
        return new CategoryJson(
            Number(body.id),
            body.name,
            body.parentCategoryId != null ? Number(body.parentCategoryId) : null,
        )
    }

}