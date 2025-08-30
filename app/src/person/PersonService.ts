import {BaseService} from "../utilities/BaseService";
import {PersonJson} from "./PersonJson";

export class PersonService extends BaseService {
    constructor() {
        super(PersonService.name);
    }

    async get(): Promise<PersonJson[]> {
        return [];
    }

    async getById(personId: number): Promise<PersonJson> {
        return new PersonJson(0,"");
    }

    async create(person: PersonJson): Promise<PersonJson> {
        return person;
    }

    async update(personId: number, person: PersonJson): Promise<PersonJson> {
        return person;
    }

    async delete(personId: number): Promise<void> {}
}