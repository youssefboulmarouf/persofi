import {BaseService} from "../utilities/BaseService";
import {TransactionJson} from "./TransactionJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import {TransactionItemService} from "../transaction-item/TransactionItemService";
import {TransactionTypeEnum} from "./TransactionType";
import BadRequestError from "../utilities/errors/BadRequestError";
import {TransactionProcessorService} from "./TransactionProcessorService";
import {TransactionValidationService} from "./TransactionValidationService";

export class TransactionService extends BaseService {
    private readonly transactionItemService: TransactionItemService;
    private readonly transactionProcessor: TransactionProcessorService;

    constructor() {
        super(TransactionService.name);
        this.transactionItemService = new TransactionItemService();
        this.transactionProcessor = new TransactionProcessorService();
    }

    async get(): Promise<TransactionJson[]> {
        this.logger.log(`Get all Transactions`);
        return (await this.prisma.transaction.findMany({
            include: { items: true }
        })).map(TransactionJson.from);
    }

    async getById(id: number): Promise<TransactionJson> {
        this.logger.log(`Get transaction by [id:${id}]`);

        const data = await this.prisma.transaction.findUnique({
            where: { id },
            include: { items: true }
        });

        NotFoundError.throwIf(!data, `Transaction with [id:${id}] not found`);

        return TransactionJson.from(data);
    }

    async create(transaction: TransactionJson): Promise<void> {
        this.logger.log(`Create new transaction`, transaction);
        TransactionValidationService.validate(transaction);
        await this.prisma.transaction.create({
                data: {
                    date: transaction.getDate(),
                    type: transaction.getTransactionType(),
                    notes: transaction.getNotes(),
                    payAccountId: transaction.getPayAccountId(),
                    counterpartyAccountId: transaction.getCounterpartyAccountId(),
                    storeId: transaction.getStoreId(),
                    refundOfId: transaction.getRefundOfId(),
                    personId: transaction.getPersonId(),
                    subtotal: transaction.getSubtotal(),
                    taxTotal: transaction.getTaxTotal(),
                    grandTotal: transaction.getGrandTotal(),
                    amount: transaction.getAmount(),
                    processed: false,
                    items: {
                        create: transaction.getItems().map((it) => ({
                            description: it.getDescription(),
                            quantity: it.getQuantity(),
                            unitPrice: it.getUnitPrice(),
                            lineTotal: it.getLineTotal(),
                            variantId: it.getProductVariantId(),
                            brandId: it.getBrandId(),
                            categoryId: it.getCategoryId(),
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });
    }

    async update(transactionId: number, transaction: TransactionJson): Promise<void> {
        TransactionValidationService.validate(transaction);
        BadRequestError.throwIf(transactionId != transaction.getId(), `Transaction id mismatch`);
        BadRequestError.throwIf(transaction.isProcessed(), `Transaction is processed. Cannot be updated.`);

        // delete items
        await this.transactionItemService.deleteByTransactionId(transactionId);

        // update transaction
        await this.prisma.transaction.update({
            data: {
                date: transaction.getDate(),
                type: transaction.getTransactionType(),
                notes: transaction.getNotes(),
                processed: false,
                payAccountId: transaction.getPayAccountId(),
                counterpartyAccountId: transaction.getCounterpartyAccountId(),
                storeId: transaction.getStoreId(),
                refundOfId: transaction.getRefundOfId(),
                personId: transaction.getPersonId(),
                subtotal: transaction.getSubtotal(),
                taxTotal: transaction.getTaxTotal(),
                grandTotal: transaction.getGrandTotal(),
                amount: transaction.getAmount(),
            },
            where: { id: transactionId },
        });

        // insert items
        await this.transactionItemService.createManyForTrnasaction(transactionId, transaction.getItems());
    }

    async processTransaction(transactionId: number): Promise<void> {
        const existingTransaction = await this.getById(transactionId);

        switch (existingTransaction.getTransactionType()) {
            case TransactionTypeEnum.EXPENSE:
                await this.transactionProcessor.processExpenseTransaction(existingTransaction);
                break;
            case TransactionTypeEnum.INCOME:
                await this.transactionProcessor.processIncomeTransaction(existingTransaction);
                break;
            case TransactionTypeEnum.CREDIT_PAYMENT:
                await this.transactionProcessor.processCreditPaymentTransaction(existingTransaction);
                break;
            case TransactionTypeEnum.REFUND:
                await this.transactionProcessor.processRefundTransaction(existingTransaction);
                break;
            case TransactionTypeEnum.TRANSFER:
                await this.transactionProcessor.processTransferTransaction(existingTransaction);
                break;
            case TransactionTypeEnum.INIT_BALANCE:
                await this.transactionProcessor.processInitBalanceTransaction(existingTransaction);
                break;
            default:
                BadRequestError
                    .throwIf(
                        true,
                        `Transaction Type [{${existingTransaction.getTransactionType()}] is not supported`
                    );
        }

        // update transaction
        await this.prisma.transaction.update({
            data: {
                processed: true,
            },
            where: { id: transactionId },
        });
    }

}