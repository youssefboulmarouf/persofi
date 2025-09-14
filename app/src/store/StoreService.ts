import {BaseService} from "../utilities/BaseService";
import {StoreJson} from "./StoreJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import BadRequestError from "../utilities/errors/BadRequestError";

export class StoreService extends BaseService {
    constructor() {
        super(StoreService.name);
    }

    async get(): Promise<StoreJson[]> {
        this.logger.log(`Get all stores`);
        return (await this.prisma.store.findMany()).map(StoreJson.from);
    }

    async getById(id: number): Promise<StoreJson> {
        this.logger.log(`Get store by [id:${id}]`);

        const data = await this.prisma.store.findUnique({
            where: { id }
        });

        NotFoundError.throwIf(!data, `Store with [id:${id}] not found`);

        return StoreJson.from(data);
    }

    async create(store: StoreJson): Promise<StoreJson> {
        this.logger.log(`Create new store`, store);
        return StoreJson.from(
            await this.prisma.store.create({
                data: {
                    name: store.getName(),
                    url: store.getUrl(),
                }
            })
        );
    }

    async update(id: number, store: StoreJson): Promise<StoreJson> {
        this.logger.log(`Update store with [id=${id}]`);

        BadRequestError.throwIf(id != store.getId(), `Store id mismatch`);

        const existingStore = await this.getById(id);

        this.logger.log(`Update existing store`, existingStore);
        this.logger.log(`Store updated data`, store);

        return StoreJson.from(
            await this.prisma.store.update({
                where: { id },
                data: {
                    name: store.getName(),
                    url: store.getUrl(),
                }
            })
        );
    }

    async delete(id: number): Promise<void> {
        this.logger.log(`Delete store with [id=${id}]`);
        await this.prisma.store.delete({
            where: { id }
        });
    }
}