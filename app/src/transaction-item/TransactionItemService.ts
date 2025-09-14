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
            0,
            0
        );
    }

    async getByTransactionId(transactionId: number): Promise<TransactionItemJson[]> {
        return [];
    }

    async create(transactionItem: TransactionItemJson): Promise<TransactionItemJson> {
        this.prisma.transactionItem.create({
            data: {
                transactionId: transactionItem.getTransactionId(),
                description: transactionItem.getDescription(),
                variantId: transactionItem.getProductVariantId(),
                categoryId: transactionItem.getCategoryId(),
                brandId: transactionItem.getBrandId(),
                quantity: transactionItem.getQuantity(),
                unitPrice: transactionItem.getUnitPrice(),
                lineTotal: transactionItem.getLineTotal()
            }
        })
        return transactionItem;
    }

    async createMany(transactionItems: TransactionItemJson[]): Promise<TransactionItemJson[]> {
        if (transactionItems.length == 0) return [];

        await this.prisma.transactionItem.createMany({
            data: transactionItems.map(item => ({
                transactionId: item.getTransactionId(),
                description: item.getDescription(),
                variantId: item.getProductVariantId(),
                categoryId: item.getCategoryId(),
                brandId: item.getBrandId(),
                quantity: item.getQuantity(),
                unitPrice: item.getUnitPrice(),
                lineTotal: item.getLineTotal()
            }))
        })
        return this.getByTransactionId(transactionItems[0].getTransactionId());
    }

    async update(transactionItemId: number, transactionItem: TransactionItemJson): Promise<TransactionItemJson> {
        return transactionItem;
    }

    async delete(transactionItemId: number): Promise<void> {}
}