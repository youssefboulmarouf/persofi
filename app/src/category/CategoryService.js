"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const CategoryJson_1 = require("./CategoryJson");
const NotFoundError_1 = __importDefault(require("../utilities/errors/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
const AppError_1 = __importDefault(require("../utilities/errors/AppError"));
class CategoryService extends BaseService_1.BaseService {
    constructor() {
        super(CategoryService.name);
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get all accounts`);
            return (yield this.prisma.category.findMany()).map(CategoryJson_1.CategoryJson.from);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get category by [id:${id}]`);
            const data = yield this.prisma.category.findUnique({
                where: { id }
            });
            NotFoundError_1.default.throwIf(!data, `Category with [id:${id}] not found`);
            return CategoryJson_1.CategoryJson.from(data);
        });
    }
    create(category) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Create new category`, category);
            return CategoryJson_1.CategoryJson.from(yield this.prisma.category.create({
                data: {
                    name: category.getName(),
                    parentCategoryId: category.getParentCategory(),
                    active: true
                }
            }));
        });
    }
    update(id, category) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Update category with [id=${id}]`);
            BadRequestError_1.default.throwIf(id != category.getId(), `Category id mismatch`);
            const existingCategory = yield this.getById(id);
            this.logger.log(`Update existing category`, existingCategory);
            this.logger.log(`Category updated data`, category);
            return CategoryJson_1.CategoryJson.from(yield this.prisma.category.update({
                where: { id },
                data: {
                    name: category.getName(),
                    parentCategoryId: category.getParentCategory(),
                    active: category.isActive()
                }
            }));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Delete category with [id=${id}]`);
            const childrenCount = yield this.prisma.category.findMany({
                where: { parentCategoryId: id }
            });
            if (childrenCount.length > 0) {
                this.logger.log(`Category with [id=${id}] have [id=${childrenCount.length}] children, will deactivate instead of deleting`);
                yield this.prisma.category.updateMany({
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
            }
            else {
                this.logger.log(`Deleting category with [id=${id}]`);
                try {
                    yield this.prisma.category.delete({
                        where: { id }
                    });
                }
                catch (e) {
                    throw new AppError_1.default("Runtime Error", 500, `Unable to delete category that is tied to other entities: ${e.message}.`);
                }
            }
        });
    }
}
exports.CategoryService = CategoryService;
