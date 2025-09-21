export class BrandJson {
    private readonly id: number;
    private readonly name: string;
    private readonly url: string;
    private readonly active: boolean;

    constructor(id: number, name: string, url: string, active: boolean) {
        this.id = id;
        this.name = name;
        this.url = url;
        this.active = active;
    }


    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public getUrl(): string {
        return this.url;
    }

    public isActive(): boolean {
        return this.active;
    }

    public static from(body: any): BrandJson {
        return new BrandJson(
            Number(body.id),
            body.name,
            body.url,
            body.active
        )
    }
}