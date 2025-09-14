export class BrandJson {
    private readonly id: number;
    private readonly name: string;
    private readonly url: string;

    constructor(id: number, name: string, url: string) {
        this.id = id;
        this.name = name;
        this.url = url;
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

    public static from(body: any): BrandJson {
        return new BrandJson(
            Number(body.id),
            body.name,
            body.url
        )
    }
}