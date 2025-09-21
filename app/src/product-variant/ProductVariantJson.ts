import {UnitTypeEnum, unitTypeFromString} from "./UnitType";

export class ProductVariantJson {
    private readonly id: number;
    private readonly description: string;
    private readonly active: boolean;
    private readonly unitSize: number;
    private readonly unitType: UnitTypeEnum;
    private readonly productId: number;

    constructor(id: number, description: string, active: boolean, unitSize: number, unitType: UnitTypeEnum, productId: number) {
        this.id = id;
        this.description = description;
        this.active = active;
        this.unitSize = unitSize;
        this.unitType = unitType;
        this.productId = productId;
    }

    public getId(): number {
        return this.id;
    }

    public getDescription(): string {
        return this.description;
    }

    public getUnitSize(): number {
        return this.unitSize;
    }

    public getUnitType(): UnitTypeEnum {
        return this.unitType;
    }

    public isActive(): boolean {
        return this.active;
    }

    public getProductId(): number {
        return this.productId;
    }

    public static from(body: any): ProductVariantJson {
        return new ProductVariantJson(
            Number(body.id),
            body.description,
            body.active,
            Number(body.unitSize),
            unitTypeFromString(body.unitType),
            Number(body.productId),
        )
    }
}