import { BaseService } from "../utilities/BaseService";
import { TransactionJson } from "./TransactionJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import { TransactionItemService } from "../transaction-item/TransactionItemService";
import BadRequestError from "../utilities/errors/BadRequestError";
import { TransactionProcessorService } from "./TransactionProcessorService";
import { TransactionValidator } from "./TransactionValidator";
import { AccountService } from "../account/AccountService";
import { AccountJson } from "../account/AccountJson";
import { postingAccountIds } from "./BalanceEffects";

export class TransactionService extends BaseService {
    private readonly transactionItemService: TransactionItemService;
    private readonly transactionProcessor: TransactionProcessorService;
    private readonly accountService: AccountService;

    constructor() {
        super(TransactionService.name);
        this.transactionItemService = new TransactionItemService();
        this.transactionProcessor = new TransactionProcessorService();
        this.accountService = new AccountService();
    }

    async get(): Promise<TransactionJson[]> {
        this.logger.log(`Get all Transactions`);
        return (
            await this.prisma.transaction.findMany({
                include: { items: true },
            })
        ).map(TransactionJson.from);
    }

    async getById(id: number): Promise<TransactionJson> {
        this.logger.log(`Get transaction by [id:${id}]`);

        const data = await this.prisma.transaction.findUnique({
            where: { id },
            include: { items: true },
        });

        NotFoundError.throwIf(!data, `Transaction with [id:${id}] not found`);

        return TransactionJson.from(data);
    }

    async create(transaction: TransactionJson): Promise<TransactionJson> {
        this.logger.log(`Create new transaction`, transaction);

        this.logger.log(`Validating transaction data`);
        TransactionValidator.validate(transaction);
        this.logger.log(`Transaction data is valid`);

        this.logger.log(`Inserting transaction`);
        const data = await this.prisma.transaction.create({
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
                        variantId: it.getVariantId(),
                        brandId: it.getBrandId(),
                        categoryId: it.getCategoryId(),
                    })),
                },
            },
            include: {
                items: true,
            },
        });
        this.logger.log(`Transaction inserted successfully [id=${data.id}]`);

        return TransactionJson.from(data);
    }

    async update(transactionId: number, transaction: TransactionJson): Promise<void> {
        TransactionValidator.validate(transaction);
        BadRequestError.throwIf(transactionId != transaction.getId(), `Transaction id mismatch`);
        BadRequestError.throwIf(
            transaction.isProcessed(),
            `Transaction is processed. Cannot be updated.`,
        );

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
        await this.transactionItemService.createManyForTrnasaction(
            transactionId,
            transaction.getItems(),
        );
    }

    async processTransaction(transactionId: number): Promise<void> {
        const existingTransaction = await this.getById(transactionId);

        BadRequestError.throwIf(
            existingTransaction.isProcessed(),
            `Transaction with [id=${existingTransaction.getId()}] is already processed. Cannot be processed again.`,
        );

        const accounts = new Map<number, AccountJson>();
        for (const accountId of postingAccountIds(existingTransaction)) {
            accounts.set(accountId, await this.accountService.getById(accountId));
        }

        await this.transactionProcessor.process(existingTransaction, accounts);

        // update transaction
        await this.prisma.transaction.update({
            data: {
                processed: true,
            },
            where: { id: transactionId },
        });
    }

    async delete(id: number) {
        this.logger.log(`Delete transaction with [id=${id}]`);
        const existingTransaction = await this.getById(id);
        BadRequestError.throwIf(
            existingTransaction.isProcessed(),
            `Transaction is processed. Cannot be deleted.`,
        );

        // delete items first to avoid foreign key constraint violations
        await this.transactionItemService.deleteByTransactionId(id);

        await this.prisma.transaction.delete({
            where: { id },
        });
    }
}
