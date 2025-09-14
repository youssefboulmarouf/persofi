import {BaseService} from "../utilities/BaseService";
import {PersonJson} from "./PersonJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import BadRequestError from "../utilities/errors/BadRequestError";

export class PersonService extends BaseService {
    constructor() {
        super(PersonService.name);
    }

    async get(): Promise<PersonJson[]> {
        this.logger.log(`Get all persons`);
        return (await this.prisma.person.findMany()).map(PersonJson.from);
    }

    async getById(id: number): Promise<PersonJson> {
        this.logger.log(`Get person by [id:${id}]`);

        const data = await this.prisma.person.findUnique({
            where: { id }
        });

        NotFoundError.throwIf(!data, `Person with [id:${id}] not found`);

        return PersonJson.from(data);
    }

    async create(person: PersonJson): Promise<PersonJson> {
        this.logger.log(`Create new person`, person);

        return PersonJson.from(
            await this.prisma.person.create({
                data: {
                    name: person.getName()
                }
            })
        );
    }

    async update(id: number, person: PersonJson): Promise<PersonJson> {
        this.logger.log(`Update person with [id=${id}]`);

        BadRequestError.throwIf(id != person.getId(), `Person id mismatch`);

        const existingPerson = await this.getById(id);

        this.logger.log(`Update existing person`, existingPerson);
        this.logger.log(`Person updated data`, person);

        return PersonJson.from(
            await this.prisma.person.update({
                where: { id },
                data: {
                    name: person.getName()
                }
            })
        );
    }

    async delete(id: number): Promise<void> {
        this.logger.log(`Delete person with [id=${id}]`);
        await this.prisma.person.delete({
            where: { id }
        });
    }
}