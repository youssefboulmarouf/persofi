export class CategoryJson {
    private readonly id: number;
    private readonly name: string;
    private readonly active: boolean;
    private readonly parentCategoryId: number | null;

    constructor(id: number, name: string, active: boolean, parentCategoryId: number | null) {
        this.id = id;
        this.name = name;
        this.active = active;
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

    public isActive(): boolean {
        return this.active;
    }

    public static from(body: any): CategoryJson {
        return new CategoryJson(
            Number(body.id),
            body.name,
            body.active,
            body.parentCategoryId != null ? Number(body.parentCategoryId) : null,
        )
    }

}