import {BaseService} from "../utilities/BaseService";
import {ProductVariantJson} from "./ProductVariantJson";
import {UnitTypeEnum} from "./UnitType";

export class ProductVariantService extends BaseService {
    constructor() {
        super(ProductVariantService.name);
    }

    async get(): Promise<ProductVariantJson[]> {
        return [];
    }

    async getByProductId(productId: number): Promise<ProductVariantJson[]> {
        return [];
    }

    async getById(variantId: number): Promise<ProductVariantJson> {
        return new ProductVariantJson(0,"", 0, UnitTypeEnum.KG, 0);
    }

    async create(variant: ProductVariantJson): Promise<ProductVariantJson> {
        return variant;
    }

    async update(variantId: number, variant: ProductVariantJson): Promise<ProductVariantJson> {
        return variant;
    }

    async delete(variantId: number): Promise<void> {}
}