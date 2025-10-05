import {BaseService} from "../utilities/BaseService";
import {CategoryJson} from "./CategoryJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import BadRequestError from "../utilities/errors/BadRequestError";

export class CategoryService extends BaseService {
    constructor() {
        super(CategoryService.name);
    }

    async get(): Promise<CategoryJson[]> {
        this.logger.log(`Get all accounts`);
        return (await this.prisma.category.findMany()).map(CategoryJson.from);
    }

    async getById(id: number): Promise<CategoryJson> {
        this.logger.log(`Get category by [id:${id}]`);

        const data = await this.prisma.category.findUnique({
            where: { id }
        });

        NotFoundError.throwIf(!data, `Category with [id:${id}] not found`);

        return CategoryJson.from(data);
    }

    async create(category: CategoryJson): Promise<CategoryJson> {
        this.logger.log(`Create new category`, category);

        return CategoryJson.from(
            await this.prisma.category.create({
                data: {
                    name: category.getName(),
                    parentCategoryId: category.getParentCategory(),
                    active: true
                }
            })
        );
    }

    async update(id: number, category: CategoryJson): Promise<CategoryJson> {
        this.logger.log(`Update category with [id=${id}]`);
        BadRequestError.throwIf(id != category.getId(), `Category id mismatch`);

        const existingCategory = await this.getById(id);

        this.logger.log(`Update existing category`, existingCategory);
        this.logger.log(`Category updated data`, category);

        return CategoryJson.from(
            await this.prisma.category.update({
                where: { id },
                data: {
                    name: category.getName(),
                    parentCategoryId: category.getParentCategory(),
                    active: category.isActive()
                }
            })
        );
    }

    async delete(id: number): Promise<void> {
        this.logger.log(`Delete category with [id=${id}]`);
        const childrenCount = await this.prisma.category.findMany({
            where: { parentCategoryId: id }
        })

        if (childrenCount.length > 0) {
            this.logger.log(`Category with [id=${id}] have [id=${childrenCount.length}] children, will deactivate instead of deleting`);
            await this.prisma.category.updateMany({
                where: {
                    OR: [
                        { id },
                        { parentCategoryId: id }
                    ],
                },
                data: {
                    active: false
                }
            });
        } else {
            this.logger.log(`Deleting category with [id=${id}]`);
            await this.prisma.category.delete({
                where: { id }
            })
        }
    }
}