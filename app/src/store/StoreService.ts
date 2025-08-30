import {BaseService} from "../utilities/BaseService";
import {StoreJson} from "./StoreJson";

export class StoreService extends BaseService {
    constructor() {
        super(StoreService.name);
    }

    async get(): Promise<StoreJson[]> {
        return [];
    }

    async getById(storeId: number): Promise<StoreJson> {
        return new StoreJson(0,"", "");
    }

    async create(store: StoreJson): Promise<StoreJson> {
        return store;
    }

    async update(storeId: number, store: StoreJson): Promise<StoreJson> {
        return store;
    }

    async delete(storeId: number): Promise<void> {}
}