import {BaseService} from "../utilities/BaseService";
import {ProductJson} from "./ProductJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import BadRequestError from "../utilities/errors/BadRequestError";
import {ProductVariantJson} from "../product-variant/ProductVariantJson";
import {ProductVariantService} from "../product-variant/ProductVariantService";

export class ProductService extends BaseService {
    private readonly productVariantService: ProductVariantService;
    constructor() {
        super(ProductService.name);
        this.productVariantService = new ProductVariantService();
    }

    async get(): Promise<ProductJson[]> {
        this.logger.log(`Get all products`);
        return (await this.prisma.product.findMany()).map(ProductJson.from);
    }

    async getById(id: number): Promise<ProductJson> {
        this.logger.log(`Get product by [id:${id}]`);

        const data = await this.prisma.product.findUnique({
            where: { id }
        });

        NotFoundError.throwIf(!data, `Product with [id:${id}] not found`);

        return ProductJson.from(data);
    }

    async create(product: ProductJson): Promise<ProductJson> {
        this.logger.log(`Create new product`, product);

        return ProductJson.from(
            await this.prisma.product.create({
                data: {
                    name: product.getName(),
                    categoryId: product.getCategoryId(),
                    active: true
                }
            })
        );
    }

    async update(id: number, product: ProductJson): Promise<ProductJson> {
        this.logger.log(`Update product with [id=${id}]`);
        BadRequestError.throwIf(id != product.getId(), `Product id mismatch`);

        const existingProduct = await this.getById(id);

        this.logger.log(`Update existing product`, existingProduct);
        this.logger.log(`Product updated data`, product);


        return ProductJson.from(
            await this.prisma.product.update({
                where: { id },
                data: {
                    name: product.getName(),
                    categoryId: product.getCategoryId(),
                    active: product.isActive()
                }
            })
        );
    }

    async delete(id: number): Promise<void> {
        this.logger.log(`Delete product with [id=${id}]`);

        const productVariants: ProductVariantJson[] = await this.productVariantService.getByProductId(id);

        this.logger.log(`Delete variant of product with [id=${id}]`);
        await Promise.all(productVariants.map(async (variant) => await this.productVariantService.delete(variant.getId())))

        await this.prisma.product.delete({
            where: { id }
        })
    }
}