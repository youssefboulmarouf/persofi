import {BaseService} from "../utilities/BaseService";
import {ProductJson} from "./ProductJson";

export class ProductService extends BaseService {
    constructor() {
        super(ProductService.name);
    }

    async get(): Promise<ProductJson[]> {
        return [];
    }

    async getById(productId: number): Promise<ProductJson> {
        return new ProductJson(0,"", "", 0);
    }

    async create(product: ProductJson): Promise<ProductJson> {
        return product;
    }

    async update(productId: number, product: ProductJson): Promise<ProductJson> {
        return product;
    }

    async delete(productId: number): Promise<void> {}
}