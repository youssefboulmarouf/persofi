import {BaseService} from "../utilities/BaseService";
import {AccountService} from "../account/AccountService";
import {BalanceService} from "../balance/BalanceService";
import {TransactionJson} from "./TransactionJson";
import {AccountTypeEnum} from "../account/AccountType";
import BadRequestError from "../utilities/errors/BadRequestError";
import AppError from "../utilities/errors/AppError";

export class TransactionProcessorService extends BaseService {

    private readonly accountService: AccountService;
    private readonly balanceService: BalanceService;

    constructor() {
        super(TransactionProcessorService.name);
        this.accountService = new AccountService();
        this.balanceService = new BalanceService();
    }

    async processExpenseTransaction(transaction: TransactionJson): Promise<void> {
        const payAccount = await this.accountService.getById(Number(transaction.getPayAccountId()));
        const payAccountBalance = await this.balanceService.getLatestBalanceOfAccount(payAccount.getId());

        await this.balanceService.updateAccountBalance(
            (payAccount.getAccountType() == AccountTypeEnum.CREDIT)
                ? payAccountBalance.getAmount() + transaction.getGrandTotal()
                : payAccountBalance.getAmount() - transaction.getGrandTotal(),
            transaction.getDate(),
            transaction.getId(),
            payAccount.getId()
        );
    }

    async processIncomeTransaction(transaction: TransactionJson): Promise<void> {
        const counterPartyAccount = await this.accountService.getById(Number(transaction.getCounterpartyAccountId()));
        BadRequestError.throwIf(
            counterPartyAccount.getAccountType() == AccountTypeEnum.CREDIT,
            `Income is only added to Debit, Cash or Saving but got [accountType=${counterPartyAccount.getAccountType()}].`
        );

        const counterPartyAccountBalance = await this.balanceService.getLatestBalanceOfAccount(counterPartyAccount.getId());

        await this.balanceService.updateAccountBalance(
            counterPartyAccountBalance.getAmount() + transaction.getAmount(),
            transaction.getDate(),
            transaction.getId(),
            counterPartyAccount.getId()
        );
    }

    async processCreditPaymentTransaction(transaction: TransactionJson): Promise<void> {
        const payAccount = await this.accountService.getById(Number(transaction.getPayAccountId()));
        BadRequestError.throwIf(
            payAccount.getAccountType() == AccountTypeEnum.CREDIT,
            `Credit Payment emitter should be Debit, Cash or Saving but got [accountType=${payAccount.getAccountType()}].`
        );

        const counterPartyAccount = await this.accountService.getById(Number(transaction.getCounterpartyAccountId()));
        BadRequestError.throwIf(
            counterPartyAccount.getAccountType() != AccountTypeEnum.CREDIT,
            `Credit Payment receiver should be Credit but got [accountType=${counterPartyAccount.getAccountType()}].`
        );

        const payAccountBalance = await this.balanceService.getLatestBalanceOfAccount(payAccount.getId());
        const counterPartyAccountBalance = await this.balanceService.getLatestBalanceOfAccount(counterPartyAccount.getId());

        await this.balanceService.updateAccountBalance(
            payAccountBalance.getAmount() - transaction.getAmount(),
            transaction.getDate(),
            transaction.getId(),
            payAccount.getId()
        );

        await this.balanceService.updateAccountBalance(
            counterPartyAccountBalance.getAmount() + transaction.getAmount(),
            transaction.getDate(),
            transaction.getId(),
            counterPartyAccount.getId()
        );
    }

    async processRefundTransaction(transaction: TransactionJson): Promise<void> {
        const counterPartyAccount = await this.accountService.getById(Number(transaction.getCounterpartyAccountId()));
        const counterPartyAccountBalance = await this.balanceService.getLatestBalanceOfAccount(counterPartyAccount.getId());

        await this.balanceService.updateAccountBalance(
            (counterPartyAccount.getAccountType() == AccountTypeEnum.CREDIT)
                ? counterPartyAccountBalance.getAmount() - transaction.getGrandTotal()
                : counterPartyAccountBalance.getAmount() + transaction.getGrandTotal(),
            transaction.getDate(),
            transaction.getId(),
            counterPartyAccount.getId()
        );
    }

    async processTransferTransaction(transaction: TransactionJson): Promise<void> {
        const payAccount = await this.accountService.getById(Number(transaction.getPayAccountId()));
        const payAccountBalance = await this.balanceService.getLatestBalanceOfAccount(payAccount.getId());

        const counterPartyAccount = await this.accountService.getById(Number(transaction.getCounterpartyAccountId()));
        const counterPartyAccountBalance = await this.balanceService.getLatestBalanceOfAccount(counterPartyAccount.getId());

        await this.balanceService.updateAccountBalance(
            payAccountBalance.getAmount() - transaction.getAmount(),
            transaction.getDate(),
            transaction.getId(),
            payAccount.getId()
        );

        await this.balanceService.updateAccountBalance(
            counterPartyAccountBalance.getAmount() + transaction.getAmount(),
            transaction.getDate(),
            transaction.getId(),
            counterPartyAccount.getId()
        );
    }

    async processInitBalanceTransaction(transaction: TransactionJson): Promise<void> {
        const counterPartyAccount = await this.accountService.getById(Number(transaction.getCounterpartyAccountId()));
        try {
            await this.balanceService.getLatestBalanceOfAccount(counterPartyAccount.getId());
            BadRequestError.throwIf(true, `Balance already exists for account [id=${counterPartyAccount.getId()}]`);
        } catch (e: any) {
            if (e instanceof BadRequestError && e.message.includes("try to initialize it first")) {
                await this.balanceService.updateAccountBalance(
                    0,
                    transaction.getDate(),
                    transaction.getId(),
                    counterPartyAccount.getId()
                );
            } else {
                throw new AppError(
                    "Runtime Error",
                    500,
                    `Unable to initialize balance for account [id=${counterPartyAccount.getId()}]. ` + e.message
                );
            }
        }


    }

}