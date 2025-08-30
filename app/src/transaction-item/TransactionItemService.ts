import {BaseService} from "../utilities/BaseService";
import {TransactionItemJson} from "./TransactionItemJson";

export class TransactionItemService extends BaseService {
    constructor() {
        super(TransactionItemService.name);
    }

    async get(): Promise<TransactionItemJson[]> {
        return [];
    }

    async getById(transactionItemId: number): Promise<TransactionItemJson> {
        return new TransactionItemJson(
            0,
            0,
            "",
            0,
            0,
            0,
            0,
            0
        );
    }

    async create(transactionItemId: TransactionItemJson): Promise<TransactionItemJson> {
        return transactionItemId;
    }

    async update(transactionItemId: number, transactionItem: TransactionItemJson): Promise<TransactionItemJson> {
        return transactionItem;
    }

    async delete(transactionItemId: number): Promise<void> {}
}