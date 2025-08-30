export class CategoryJson {
    private readonly id: number;
    private readonly name: string;
    private readonly parentCategory: number | null;

    constructor(id: number, name: string, parentCategory: number | null) {
        this.id = id;
        this.name = name;
        this.parentCategory = parentCategory;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getParentCategory(): number | null {
        return this.parentCategory;
    }

    public static from(body: any): CategoryJson {
        return new CategoryJson(
            Number(body.id),
            body.name,
            body.parentCategory
        )
    }

}