import {BaseService} from "../utilities/BaseService";
import {ProductVariantJson} from "./ProductVariantJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import BadRequestError from "../utilities/errors/BadRequestError";

export class ProductVariantService extends BaseService {
    constructor() {
        super(ProductVariantService.name);
    }

    async get(): Promise<ProductVariantJson[]> {
        this.logger.log(`Get all product variants`);
        return (await this.prisma.productVariant.findMany()).map(ProductVariantJson.from);
    }

    async getById(id: number): Promise<ProductVariantJson> {
        this.logger.log(`Get product variant by [id:${id}]`);

        const data = await this.prisma.productVariant.findUnique({
            where: { id }
        });

        NotFoundError.throwIf(!data, `Product variant with [id:${id}] not found`);

        return ProductVariantJson.from(data);
    }

    async getByProductId(productId: number): Promise<ProductVariantJson[]> {
        this.logger.log(`Get product variant by [productId:${productId}]`);

        const data = await this.prisma.productVariant.findMany({
            where: { productId }
        });

        return data.map(ProductVariantJson.from);
    }

    async create(variant: ProductVariantJson): Promise<ProductVariantJson> {
        this.logger.log(`Create new product variant`, variant);
        return ProductVariantJson.from(
            await this.prisma.productVariant.create({
                data: {
                    description: variant.getDescription(),
                    active: true,
                    unitSize: variant.getUnitSize(),
                    unitType: variant.getUnitType(),
                    productId: variant.getProductId()
                }
            })
        );
    }

    async update(id: number, variant: ProductVariantJson): Promise<ProductVariantJson> {
        this.logger.log(`Update product variant with [id=${id}]`);

        BadRequestError.throwIf(id != variant.getId(), `Product variant id mismatch`);

        const existingVariant = await this.getById(id);

        this.logger.log(`Update existing product variant`, existingVariant);
        this.logger.log(`Product variant updated data`, variant);

        // TODO add logic for ProductVariantBrand
        return ProductVariantJson.from(
            await this.prisma.productVariant.update({
                where: { id },
                data: {
                    description: variant.getDescription(),
                    active: variant.isActive(),
                    unitSize: variant.getUnitSize(),
                    unitType: variant.getUnitType(),
                    productId: variant.getProductId()
                }
            })
        );
    }

    async delete(id: number): Promise<void> {
        this.logger.log(`Delete product variant with [id=${id}]`);
        await this.prisma.productVariant.delete({
            where: { id }
        });
    }
}