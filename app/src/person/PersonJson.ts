export class PersonJson {
    private readonly id: number;
    private readonly name: string;
    private readonly active: boolean;

    constructor(id: number, name: string, active: boolean) {
        this.id = id;
        this.name = name;
        this.active = active;
    }

    public getId(): number {
        return this.id;
    }

    public getName(): string {
        return this.name;
    }

    public isActive(): boolean {
        return this.active;
    }

    public static from(body: any): PersonJson {
        return new PersonJson(
            Number(body.id),
            body.name,
            body.active
        )
    }

}