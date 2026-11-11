import { BaseService, DbClient } from "../utilities/BaseService";
import { TransactionJson } from "./TransactionJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import { TransactionItemService } from "../transaction-item/TransactionItemService";
import BadRequestError from "../utilities/errors/BadRequestError";
import { TransactionProcessorService } from "./TransactionProcessorService";
import { TransactionValidator } from "./TransactionValidator";
import { AccountService } from "../account/AccountService";
import { AccountJson } from "../account/AccountJson";
import { postingAccountIds } from "./BalanceEffects";
import { assertTransactionReferencesExist } from "./TransactionReferences";
import { lockForPosting } from "./PostingLocks";
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

    async create(transaction: TransactionJson, tx?: DbClient): Promise<TransactionJson> {
        this.logger.log(`Create new transaction`, transaction);

        this.logger.log(`Validating transaction data`);
        TransactionValidator.validate(transaction);
        this.logger.log(`Transaction data is valid`);

        const data = await this.inTransaction(async (db) => {
            await assertTransactionReferencesExist(db, transaction);

            this.logger.log(`Inserting transaction`);
            // Nested create: the transaction and its items are inserted in one statement batch.
            return db.transaction.create({
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
        }, tx);
        this.logger.log(`Transaction inserted successfully [id=${data.id}]`);

        return TransactionJson.from(data);
    }

    async update(
        transactionId: number,
        transaction: TransactionJson,
        tx?: DbClient,
    ): Promise<void> {
        TransactionValidator.validate(transaction);
        BadRequestError.throwIf(transactionId != transaction.getId(), `Transaction id mismatch`);

        await this.inTransaction(async (db) => {
            await assertTransactionReferencesExist(db, transaction);

            // Check and write in one statement, conditional on the stored state (never the
            // request's `processed` flag). It also locks the row, and it never writes
            // `processed`, so a concurrent process can't be undone by this update.
            const { count } = await db.transaction.updateMany({
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
                },
                where: { id: transactionId, processed: false },
            });
            if (count === 0) {
                const exists = await db.transaction.count({ where: { id: transactionId } });
                NotFoundError.throwIf(!exists, `Transaction with [id:${transactionId}] not found`);
                BadRequestError.throwIf(true, `Transaction is processed. Cannot be updated.`);
            }

            await this.transactionItemService.deleteByTransactionId(transactionId, db);

            await this.transactionItemService.createManyForTrnasaction(
                transactionId,
                transaction.getItems(),
                db,
            );
        }, tx);
    }

    async processTransaction(transactionId: number): Promise<void> {
        try {
            await this.prisma.$transaction(
                async (tx) => {
                    await lockForPosting(tx, { transactionId });
                    const stored = await tx.transaction.findUniqueOrThrow({
                        where: { id: transactionId },
                        include: { items: true },
                    });
                    const transaction = TransactionJson.from(stored);
                    const { count } = await tx.transaction.updateMany({
                        where: { id: transactionId, processed: false },
                        data: { processed: true },
                    });
                    BadRequestError.throwIf(
                        count === 0,
                        `Transaction with [id=${transactionId}] is already processed. Cannot be processed again.`,
                    );

                    const accounts = new Map<number, AccountJson>();
                    for (const accountId of postingAccountIds(transaction)) {
                        const account = await tx.account.findUnique({ where: { id: accountId } });
                        NotFoundError.throwIf(!account, `Account with [id:${accountId}] not found`);
                        accounts.set(accountId, AccountJson.from(account));
                    }
                    await this.transactionProcessor.process(transaction, accounts, tx);
                },
                { maxWait: 10000, timeout: 30000 },
            );
        } catch (error) {
            // MySQL deadlocks and lock timeouts are safe to retry: the transaction rolled back.
            const code = (error as { code?: string; meta?: { code?: string | number } }).code;
            const mysqlCode = String(
                (error as { meta?: { code?: string | number } }).meta?.code ?? "",
            );
            if (
                code === "P2034" ||
                code === "P2028" ||
                (code === "P2010" && ["1205", "1213"].includes(mysqlCode))
            ) {
                throw new AppError(
                    "PostingConflict",
                    409,
                    "Posting was interrupted by another transaction. Please retry.",
                );
            }
            throw error;
        }
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
