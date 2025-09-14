import {BaseService} from "../utilities/BaseService";
import {TransactionJson} from "./TransactionJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import {TransactionItemService} from "../transaction-item/TransactionItemService";

export class TransactionService extends BaseService {
    private transactionItemService: TransactionItemService;
    constructor() {
        super(TransactionService.name);
        this.transactionItemService = new TransactionItemService();
    }

    async get(): Promise<TransactionJson[]> {
        this.logger.log(`Get all Transactions`);
        return (await this.prisma.transaction.findMany()).map(TransactionJson.from);
    }

    async getById(id: number): Promise<TransactionJson> {
        this.logger.log(`Get transaction by [id:${id}]`);

        const data = await this.prisma.transaction.findUnique({
            where: { id },
        });

        NotFoundError.throwIf(!data, `Transaction with [id:${id}] not found`);

        return TransactionJson.from(data);
    }

    async create(transaction: TransactionJson): Promise<TransactionJson> {
        this.logger.log(`Create new transaction`, transaction);

        const transactionData = await this.prisma.transaction.create({
            data: {
                date: transaction.getDate(),
                type: transaction.getTransactionType(),
                payAccountId: transaction.getPayAccountId(),
                counterpartyAccountId: transaction.getCounterpartyAccountId(),
                storeId: transaction.getStoreId(),
                personId: transaction.getPersonId(),
                subtotal: transaction.getSubtotal(),
                taxTotal: transaction.getTaxTotal(),
                grandTotal: transaction.getGrandTotal(),
                amount: transaction.getAmount(),
                notes: transaction.getNotes(),
                refundOfId: transaction.getRefundId()
            }
        })

        transaction.getTransactionItems().forEach(item => item.setTransactionId(transactionData.id));

        this.transactionItemService.createMany(transaction.getTransactionItems());

        return this.getById(transactionData.id);
    }

    async update(transactionId: number, transaction: TransactionJson): Promise<TransactionJson> {
        return transaction;
    }

    async delete(transactionId: number): Promise<void> {}
}