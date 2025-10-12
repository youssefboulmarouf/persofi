import {BaseService} from "../utilities/BaseService";
import {TransactionJson} from "./TransactionJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import {TransactionItemService} from "../transaction-item/TransactionItemService";
import {TransactionTypeEnum} from "./TransactionType";
import BadRequestError from "../utilities/errors/BadRequestError";
import {TransactionProcessorService} from "./TransactionProcessorService";
import {TransactionValidationService} from "./TransactionValidationService";
import {AccountService} from "../account/AccountService";
import AppError from "../utilities/errors/AppError";

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

    async create(transaction: TransactionJson): Promise<TransactionJson> {
        this.logger.log(`Create new transaction`, transaction);

        this.logger.log(`Validating transaction data`);
        TransactionValidationService.validate(transaction);
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

        BadRequestError
            .throwIf(
                existingTransaction.isProcessed(),
                `Transaction with [id=${existingTransaction.getTransactionType()}] is already processed. Cannot be processed again.`
            );

        switch (existingTransaction.getTransactionType()) {
            case TransactionTypeEnum.EXPENSE:
                this.validatePayAccountId(existingTransaction);
                await this.transactionProcessor.processExpenseTransaction(
                    existingTransaction,
                    await this.accountService.getById(Number(existingTransaction.getPayAccountId()))
                );
                break;
            case TransactionTypeEnum.INCOME:
                this.validateCounterpartyAccount(existingTransaction);
                await this.transactionProcessor.processIncomeTransaction(
                    existingTransaction,
                    await this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId()))
                );
                break;
            case TransactionTypeEnum.CREDIT_PAYMENT:
                this.validatePayAccountId(existingTransaction);
                this.validateCounterpartyAccount(existingTransaction);
                await this.transactionProcessor.processCreditPaymentTransaction(
                    existingTransaction,
                    await this.accountService.getById(Number(existingTransaction.getPayAccountId())),
                    await this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId()))
                );
                break;
            case TransactionTypeEnum.REFUND:
                this.validateCounterpartyAccount(existingTransaction);
                await this.transactionProcessor.processRefundTransaction(
                    existingTransaction,
                    await this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId()))
                );
                break;
            case TransactionTypeEnum.TRANSFER:
                this.validatePayAccountId(existingTransaction);
                this.validateCounterpartyAccount(existingTransaction);
                await this.transactionProcessor.processTransferTransaction(
                    existingTransaction,
                    await this.accountService.getById(Number(existingTransaction.getPayAccountId())),
                    await this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId()))
                );
                break;
            case TransactionTypeEnum.INIT_BALANCE:
                this.validateCounterpartyAccount(existingTransaction);
                await this.transactionProcessor.processInitBalanceTransaction(
                    existingTransaction,
                    await this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId()))
                );
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


    private validateCounterpartyAccount(existingTransaction: TransactionJson) {
        if (existingTransaction.getCounterpartyAccountId() == null) {
            throw new AppError(
                "Runtime Error",
                500,
                `Counter Party Account is required for Expense transaction [id=${existingTransaction.getId()}]. `
            );
        }
    }

    private validatePayAccountId(existingTransaction: TransactionJson) {
        if (existingTransaction.getPayAccountId() == null) {
            throw new AppError(
                "Runtime Error",
                500,
                `Pay Account is required for Expense transaction [id=${existingTransaction.getId()}]. `
            );
        }
    }

    async delete(id: number) {
        this.logger.log(`Delete transaction with [id=${id}]`);
        await this.prisma.transaction.delete({
            where: { id }
        })
    }
}