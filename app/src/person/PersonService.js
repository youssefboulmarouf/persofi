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
exports.PersonService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const PersonJson_1 = require("./PersonJson");
const NotFoundError_1 = __importDefault(require("../utilities/errors/NotFoundError"));
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
const AppError_1 = __importDefault(require("../utilities/errors/AppError"));
class PersonService extends BaseService_1.BaseService {
    constructor() {
        super(PersonService.name);
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get all persons`);
            return (yield this.prisma.person.findMany()).map(PersonJson_1.PersonJson.from);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get person by [id:${id}]`);
            const data = yield this.prisma.person.findUnique({
                where: { id }
            });
            NotFoundError_1.default.throwIf(!data, `Person with [id:${id}] not found`);
            return PersonJson_1.PersonJson.from(data);
        });
    }
    create(person) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Create new person`, person);
            return PersonJson_1.PersonJson.from(yield this.prisma.person.create({
                data: {
                    name: person.getName(),
                    active: true
                }
            }));
        });
    }
    update(id, person) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Update person with [id=${id}]`);
            BadRequestError_1.default.throwIf(id != person.getId(), `Person id mismatch`);
            const existingPerson = yield this.getById(id);
            this.logger.log(`Update existing person`, existingPerson);
            this.logger.log(`Person updated data`, person);
            return PersonJson_1.PersonJson.from(yield this.prisma.person.update({
                where: { id },
                data: {
                    name: person.getName(),
                    active: person.isActive()
                }
            }));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Delete person with [id=${id}]`);
            try {
                yield this.prisma.person.delete({
                    where: { id }
                });
            }
            catch (e) {
                throw new AppError_1.default("Runtime Error", 500, `Unable to delete person that is tied to other entities: ${e.message}.`);
            }
        });
    }
}
exports.PersonService = PersonService;
