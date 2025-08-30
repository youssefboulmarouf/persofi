import {BaseService} from "../utilities/BaseService";
import {TransactionJson} from "./TransactionJson";
import {TransactionTypeEnum} from "./TransactionType";

export class TransactionService extends BaseService {
    constructor() {
        super(TransactionService.name);
    }

    async get(): Promise<TransactionJson[]> {
        return [];
    }

    async getById(transactionId: number): Promise<TransactionJson> {
        return new TransactionJson(
            0,
            new Date(),
            TransactionTypeEnum.EXPENSE,
            "",
            [],
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0);
    }

    async create(transaction: TransactionJson): Promise<TransactionJson> {
        return transaction;
    }

    async update(transactionId: number, transaction: TransactionJson): Promise<TransactionJson> {
        return transaction;
    }

    async delete(transactionId: number): Promise<void> {}
}