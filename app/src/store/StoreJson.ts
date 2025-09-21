export class StoreJson {
    private readonly id: number;
    private readonly name: string;
    private readonly url: string | null;
    private readonly active: boolean;

    constructor(id: number, name: string, url: string | null, active: boolean) {
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
    public getUrl(): string | null {
        return this.url;
    }

    public isActive(): boolean {
        return this.active;
    }

    public static from(body: any): StoreJson {
        return new StoreJson(
            Number(body.id),
            body.name,
            body.url,
            body.active,
        )
    }

}