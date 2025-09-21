import {BaseService} from "../utilities/BaseService";
import {BrandJson} from "./BrandJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import BadRequestError from "../utilities/errors/BadRequestError";

export class BrandService extends BaseService {

    constructor() {
        super(BrandService.name);
    }

    async get(): Promise<BrandJson[]> {
        this.logger.log(`Get all brands`);
        return (await this.prisma.brand.findMany()).map(BrandJson.from);
    }

    async getById(id: number): Promise<BrandJson> {
        this.logger.log(`Get brand by [id:${id}]`);

        const data = await this.prisma.brand.findUnique({
            where: { id }
        });

        NotFoundError.throwIf(!data, `Brand with [id:${id}] not found`);

        return BrandJson.from(data);
    }

    async create(brand: BrandJson): Promise<BrandJson> {
        this.logger.log(`Create new brand`, brand);

        const data = await this.prisma.brand.create({
            data: {
                name: brand.getName(),
                url: brand.getUrl(),
                active: true
            }
        });
        return BrandJson.from(
            data
        );
    }

    async update(id: number, brand: BrandJson): Promise<BrandJson> {
        this.logger.log(`Update brand with [id=${id}]`);

        BadRequestError.throwIf(id != brand.getId(), `Brand id mismatch`);

        const existingBrand = await this.getById(id);

        this.logger.log(`Update existing brand`, existingBrand);
        this.logger.log(`Brand updated data`, brand);

        return BrandJson.from(
            await this.prisma.brand.update({
                where: { id },
                data: {
                    name: brand.getName(),
                    url: brand.getUrl(),
                    active: brand.isActive()
                }
            })
        );
    }

    async delete(id: number): Promise<void> {
        this.logger.log(`Delete brand with [id=${id}]`);
        await this.prisma.brand.update({
            where: { id },
            data: {
                active: false
            }
        })
    }
}