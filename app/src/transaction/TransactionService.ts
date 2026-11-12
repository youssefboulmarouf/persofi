import { BaseService, DbClient } from "../utilities/BaseService";
import { TransactionJson } from "./TransactionJson";
import NotFoundError from "../utilities/errors/NotFoundError";
import { TransactionItemService } from "../transaction-item/TransactionItemService";
import BadRequestError from "../utilities/errors/BadRequestError";
import ConflictError from "../utilities/errors/ConflictError";

// Processed transactions are immutable: update, delete and re-process all answer with this code.
const TRANSACTION_PROCESSED = "TRANSACTION_PROCESSED";
import { TransactionProcessorService } from "./TransactionProcessorService";
import { TransactionValidator } from "./TransactionValidator";
import { AccountJson } from "../account/AccountJson";
import { postingAccountIds } from "./BalanceEffects";
import { assertTransactionReferencesExist } from "./TransactionReferences";
import { lockForPosting, runPosting } from "./PostingLocks";
import { assertRefundAllowed, getRefundableAmount } from "./RefundRules";
import { Money } from "../utilities/Money";

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
        return (
            await this.prisma.transaction.findMany({
                include: { items: true },
            })
        ).map((data) => TransactionJson.from(data, "stored"));
    }

    async getById(id: number): Promise<TransactionJson> {
        this.logger.log(`Get transaction by [id:${id}]`);

        const data = await this.prisma.transaction.findUnique({
            where: { id },
            include: { items: true },
        });

        NotFoundError.throwIf(!data, `Transaction with [id:${id}] not found`);

        return TransactionJson.from(data, "stored");
    }

    async getRefundable(id: number) {
        this.logger.log(`Get refundable amount of transaction [id:${id}]`);
        const refundable = await getRefundableAmount(this.prisma, id);
        return {
            transactionId: refundable.transactionId,
            grandTotal: Money.serialize(refundable.grandTotal),
            refunded: Money.serialize(refundable.refunded),
            remaining: Money.serialize(refundable.remaining),
        };
    }

    async create(transaction: TransactionJson, tx?: DbClient): Promise<TransactionJson> {
        this.logger.log(`Create new transaction`, transaction);

        this.logger.log(`Validating transaction data`);
        TransactionValidator.validate(transaction);
        this.logger.log(`Transaction data is valid`);

        const data = await this.inTransaction(async (db) => {
            await assertTransactionReferencesExist(db, transaction);
            await assertRefundAllowed(db, transaction);

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

        return TransactionJson.from(data, "stored");
    }

    async update(
        transactionId: number,
        transaction: TransactionJson,
        tx?: DbClient,
    ): Promise<void> {
        TransactionValidator.validate(transaction);
        BadRequestError.throwIf(
            transactionId != transaction.getId(),
            `Transaction id mismatch`,
            "id",
        );

        await runPosting(async (db) => {
            await assertTransactionReferencesExist(db, transaction);
            await assertRefundAllowed(db, transaction);

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
                ConflictError.throwIf(
                    true,
                    `Transaction is processed. Cannot be updated.`,
                    TRANSACTION_PROCESSED,
                );
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
        await runPosting(async (tx) => {
            await lockForPosting(tx, { transactionId });
            const stored = await tx.transaction.findUniqueOrThrow({
                where: { id: transactionId },
                include: { items: true },
            });
            const transaction = TransactionJson.from(stored, "stored");
            if (!stored.processed) {
                // Stored drafts may predate current rules or come from a restore; never trust them.
                TransactionValidator.validate(transaction);
                // Authoritative refund check: lockForPosting holds the original expense's row lock.
                // It runs before the claim so the refund's own row isn't counted as processed.
                await assertRefundAllowed(tx, transaction);
            }
            const { count } = await tx.transaction.updateMany({
                where: { id: transactionId, processed: false },
                data: { processed: true },
            });
            ConflictError.throwIf(
                count === 0,
                `Transaction with [id=${transactionId}] is already processed. Cannot be processed again.`,
                TRANSACTION_PROCESSED,
            );

            const accounts = new Map<number, AccountJson>();
            for (const accountId of postingAccountIds(transaction)) {
                const account = await tx.account.findUnique({ where: { id: accountId } });
                NotFoundError.throwIf(!account, `Account with [id:${accountId}] not found`);
                accounts.set(accountId, AccountJson.from(account));
            }
            await this.transactionProcessor.process(transaction, accounts, tx);
        });
    }

    async delete(id: number) {
        this.logger.log(`Delete transaction with [id=${id}]`);
        await runPosting(async (tx) => {
            await lockForPosting(tx, { transactionId: id });
            const stored = await tx.transaction.findUniqueOrThrow({ where: { id } });
            ConflictError.throwIf(
                stored.processed,
                `Transaction is processed. Cannot be deleted.`,
                TRANSACTION_PROCESSED,
            );
            await this.transactionItemService.deleteByTransactionId(id, tx);
            await tx.transaction.delete({ where: { id } });
        });
    }
}
