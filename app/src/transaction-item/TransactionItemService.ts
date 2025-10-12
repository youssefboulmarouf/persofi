import {BaseService} from "../utilities/BaseService";
import {TransactionItemJson} from "./TransactionItemJson";

export class TransactionItemService extends BaseService {
    constructor() {
        super(TransactionItemService.name);
    }

    async createManyForTrnasaction(transactionId: number, transactionItems: TransactionItemJson[]): Promise<void> {
        this.logger.log(`Creating items for transaction with [id=${transactionId}]`)
        this.logger.log(`Items [${transactionItems}]`)

        await this.prisma.transactionItem.createMany({
            data: transactionItems.map(item => ({
                transactionId,
                description: item.getDescription(),
                variantId: item.getVariantId(),
                categoryId: item.getCategoryId(),
                brandId: item.getBrandId(),
                quantity: item.getQuantity(),
                unitPrice: item.getUnitPrice(),
                lineTotal: item.getLineTotal()
            }))
        })
    }

    async deleteByTransactionId(transactionId: number): Promise<void> {
        this.logger.log(`Deleting items for transaction with [id=${transactionId}]`)
        await this.prisma.transactionItem.deleteMany({
            where: { transactionId }
        })
    }
}