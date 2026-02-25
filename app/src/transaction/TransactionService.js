"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const BaseService_1 = require("../utilities/BaseService");
const TransactionJson_1 = require("./TransactionJson");
const NotFoundError_1 = __importDefault(require("../utilities/errors/NotFoundError"));
const TransactionItemService_1 = require("../transaction-item/TransactionItemService");
const TransactionType_1 = require("./TransactionType");
const BadRequestError_1 = __importDefault(require("../utilities/errors/BadRequestError"));
const TransactionProcessorService_1 = require("./TransactionProcessorService");
const TransactionValidator_1 = require("./TransactionValidator");
const AccountService_1 = require("../account/AccountService");
const AppError_1 = __importDefault(require("../utilities/errors/AppError"));
class TransactionService extends BaseService_1.BaseService {
    constructor() {
        super(TransactionService.name);
        this.transactionItemService = new TransactionItemService_1.TransactionItemService();
        this.transactionProcessor = new TransactionProcessorService_1.TransactionProcessorService();
        this.accountService = new AccountService_1.AccountService();
    }
    get() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get all Transactions`);
            return (yield this.prisma.transaction.findMany({
                include: { items: true }
            })).map(TransactionJson_1.TransactionJson.from);
        });
    }
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Get transaction by [id:${id}]`);
            const data = yield this.prisma.transaction.findUnique({
                where: { id },
                include: { items: true }
            });
            NotFoundError_1.default.throwIf(!data, `Transaction with [id:${id}] not found`);
            return TransactionJson_1.TransactionJson.from(data);
        });
    }
    create(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Create new transaction`, transaction);
            this.logger.log(`Validating transaction data`);
            TransactionValidator_1.TransactionValidator.validate(transaction);
            this.logger.log(`Transaction data is valid`);
            this.logger.log(`Inserting transaction`);
            const data = yield this.prisma.transaction.create({
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
            return TransactionJson_1.TransactionJson.from(data);
        });
    }
    update(transactionId, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            TransactionValidator_1.TransactionValidator.validate(transaction);
            BadRequestError_1.default.throwIf(transactionId != transaction.getId(), `Transaction id mismatch`);
            BadRequestError_1.default.throwIf(transaction.isProcessed(), `Transaction is processed. Cannot be updated.`);
            // delete items
            yield this.transactionItemService.deleteByTransactionId(transactionId);
            // update transaction
            yield this.prisma.transaction.update({
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
            yield this.transactionItemService.createManyForTrnasaction(transactionId, transaction.getItems());
        });
    }
    processTransaction(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingTransaction = yield this.getById(transactionId);
            BadRequestError_1.default
                .throwIf(existingTransaction.isProcessed(), `Transaction with [id=${existingTransaction.getTransactionType()}] is already processed. Cannot be processed again.`);
            switch (existingTransaction.getTransactionType()) {
                case TransactionType_1.TransactionTypeEnum.EXPENSE:
                    this.validatePayAccountId(existingTransaction);
                    yield this.transactionProcessor.processExpenseTransaction(existingTransaction, yield this.accountService.getById(Number(existingTransaction.getPayAccountId())));
                    break;
                case TransactionType_1.TransactionTypeEnum.INCOME:
                    this.validateCounterpartyAccount(existingTransaction);
                    yield this.transactionProcessor.processIncomeTransaction(existingTransaction, yield this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId())));
                    break;
                case TransactionType_1.TransactionTypeEnum.CREDIT_PAYMENT:
                    this.validatePayAccountId(existingTransaction);
                    this.validateCounterpartyAccount(existingTransaction);
                    yield this.transactionProcessor.processCreditPaymentTransaction(existingTransaction, yield this.accountService.getById(Number(existingTransaction.getPayAccountId())), yield this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId())));
                    break;
                case TransactionType_1.TransactionTypeEnum.REFUND:
                    this.validateCounterpartyAccount(existingTransaction);
                    yield this.transactionProcessor.processRefundTransaction(existingTransaction, yield this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId())));
                    break;
                case TransactionType_1.TransactionTypeEnum.TRANSFER:
                    this.validatePayAccountId(existingTransaction);
                    this.validateCounterpartyAccount(existingTransaction);
                    yield this.transactionProcessor.processTransferTransaction(existingTransaction, yield this.accountService.getById(Number(existingTransaction.getPayAccountId())), yield this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId())));
                    break;
                case TransactionType_1.TransactionTypeEnum.INIT_BALANCE:
                    this.validateCounterpartyAccount(existingTransaction);
                    yield this.transactionProcessor.processInitBalanceTransaction(existingTransaction, yield this.accountService.getById(Number(existingTransaction.getCounterpartyAccountId())));
                    break;
                default:
                    BadRequestError_1.default
                        .throwIf(true, `Transaction Type [{${existingTransaction.getTransactionType()}] is not supported`);
            }
            // update transaction
            yield this.prisma.transaction.update({
                data: {
                    processed: true,
                },
                where: { id: transactionId },
            });
        });
    }
    validateCounterpartyAccount(existingTransaction) {
        if (existingTransaction.getCounterpartyAccountId() == null) {
            throw new AppError_1.default("Runtime Error", 500, `Counter Party Account is required for Expense transaction [id=${existingTransaction.getId()}]. `);
        }
    }
    validatePayAccountId(existingTransaction) {
        if (existingTransaction.getPayAccountId() == null) {
            throw new AppError_1.default("Runtime Error", 500, `Pay Account is required for Expense transaction [id=${existingTransaction.getId()}]. `);
        }
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log(`Delete transaction with [id=${id}]`);
            yield this.prisma.transaction.delete({
                where: { id }
            });
        });
    }
}
exports.TransactionService = TransactionService;
