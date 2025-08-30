import {BaseService} from "../utilities/BaseService";
import {CategoryJson} from "./CategoryJson";

export class CategoryService extends BaseService {
    constructor() {
        super(CategoryService.name);
    }

    async get(): Promise<CategoryJson[]> {
        return [];
    }

    async getById(accountId: number): Promise<CategoryJson> {
        return new CategoryJson(0,"", 0);
    }

    async create(category: CategoryJson): Promise<CategoryJson> {
        return category;
    }

    async update(categoryId: number, category: CategoryJson): Promise<CategoryJson> {
        return category;
    }

    async delete(categoryId: number): Promise<void> {}
}