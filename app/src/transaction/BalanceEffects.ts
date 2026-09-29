import { Prisma } from "@prisma/client";
import { TransactionJson } from "./TransactionJson";
import { TransactionTypeEnum } from "./TransactionType";
import { AccountJson } from "../account/AccountJson";
import { AccountTypeEnum } from "../account/AccountType";
import { Money } from "../utilities/Money";
import PostingRuleError, { PostingErrorCode } from "../utilities/errors/PostingRuleError";

// Pure implementation of docs/POSTING_MATRIX.md. No Prisma calls: the caller loads
// the accounts and their latest balances, then writes the returned rows.

export interface BalanceEffect {
    accountId: number;
    delta: Prisma.Decimal;
    newBalance: Prisma.Decimal;
}

export type AccountsById = ReadonlyMap<number, AccountJson>;

/** Latest balance per account id; `null` means the account has no balance row yet. */
export type LatestBalances = ReadonlyMap<number, Prisma.Decimal | null>;

const NON_CREDIT = [AccountTypeEnum.DEBIT, AccountTypeEnum.CASH, AccountTypeEnum.SAVING];
const CREDIT_ONLY = [AccountTypeEnum.CREDIT];

/** Account ids a transaction touches, i.e. the accounts and balances to load before posting. */
export function postingAccountIds(transaction: TransactionJson): number[] {
    const ids = [transaction.getPayAccountId(), transaction.getCounterpartyAccountId()].filter(
        (id): id is number => id != null,
    );
    return [...new Set(ids)];
}

export function computeBalanceEffects(
    transaction: TransactionJson,
    accounts: AccountsById,
    latestBalances: LatestBalances,
): BalanceEffect[] {
    const type = transaction.getTransactionType();
    const grandTotal = transaction.getGrandTotal();
    const amount = transaction.getAmount();

    switch (type) {
        case TransactionTypeEnum.EXPENSE: {
            const pay = requireAccount(transaction.getPayAccountId(), "Pay", type, accounts);
            const delta =
                pay.getAccountType() == AccountTypeEnum.CREDIT ? grandTotal : grandTotal.negated();
            return [applyDelta(pay, delta, latestBalances)];
        }
        case TransactionTypeEnum.INCOME: {
            const counterparty = requireAccount(
                transaction.getCounterpartyAccountId(),
                "Counter Party",
                type,
                accounts,
            );
            requireAccountType(counterparty, NON_CREDIT, "Counter Party", type);
            return [applyDelta(counterparty, amount, latestBalances)];
        }
        case TransactionTypeEnum.TRANSFER: {
            const pay = requireAccount(transaction.getPayAccountId(), "Pay", type, accounts);
            const counterparty = requireAccount(
                transaction.getCounterpartyAccountId(),
                "Counter Party",
                type,
                accounts,
            );
            requireDifferentAccounts(pay, counterparty, type);
            requireAccountType(pay, NON_CREDIT, "Pay", type);
            requireAccountType(counterparty, NON_CREDIT, "Counter Party", type);
            return [
                applyDelta(pay, amount.negated(), latestBalances),
                applyDelta(counterparty, amount, latestBalances),
            ];
        }
        case TransactionTypeEnum.CREDIT_PAYMENT: {
            const pay = requireAccount(transaction.getPayAccountId(), "Pay", type, accounts);
            const counterparty = requireAccount(
                transaction.getCounterpartyAccountId(),
                "Counter Party",
                type,
                accounts,
            );
            requireDifferentAccounts(pay, counterparty, type);
            requireAccountType(pay, NON_CREDIT, "Pay", type);
            requireAccountType(counterparty, CREDIT_ONLY, "Counter Party", type);
            return [
                applyDelta(pay, amount.negated(), latestBalances),
                applyDelta(counterparty, amount.negated(), latestBalances),
            ];
        }
        case TransactionTypeEnum.REFUND: {
            // Refund eligibility and the original-account rule need the original
            // transaction and are enforced in R1-08.
            const counterparty = requireAccount(
                transaction.getCounterpartyAccountId(),
                "Counter Party",
                type,
                accounts,
            );
            const delta =
                counterparty.getAccountType() == AccountTypeEnum.CREDIT
                    ? grandTotal.negated()
                    : grandTotal;
            return [applyDelta(counterparty, delta, latestBalances)];
        }
        case TransactionTypeEnum.INIT_BALANCE: {
            const counterparty = requireAccount(
                transaction.getCounterpartyAccountId(),
                "Counter Party",
                type,
                accounts,
            );
            if (latestBalanceOf(counterparty, latestBalances) != null) {
                throw new PostingRuleError(
                    PostingErrorCode.BALANCE_ALREADY_INITIALIZED,
                    `Balance already exists for account [id=${counterparty.getId()}]`,
                );
            }
            return [{ accountId: counterparty.getId(), delta: amount, newBalance: amount }];
        }
        default:
            throw new PostingRuleError(
                PostingErrorCode.UNSUPPORTED_TRANSACTION_TYPE,
                `Transaction Type [${type}] is not supported`,
            );
    }
}

function requireAccount(
    accountId: number | null,
    role: string,
    type: TransactionTypeEnum,
    accounts: AccountsById,
): AccountJson {
    if (accountId == null) {
        throw new PostingRuleError(
            PostingErrorCode.ACCOUNT_REQUIRED,
            `${role} Account is required for a ${type} transaction`,
        );
    }
    const account = accounts.get(accountId);
    if (!account) {
        throw new PostingRuleError(
            PostingErrorCode.ACCOUNT_NOT_FOUND,
            `${role} Account [id=${accountId}] not found`,
        );
    }
    return account;
}

function requireAccountType(
    account: AccountJson,
    allowed: AccountTypeEnum[],
    role: string,
    type: TransactionTypeEnum,
): void {
    if (!allowed.includes(account.getAccountType())) {
        throw new PostingRuleError(
            PostingErrorCode.ACCOUNT_TYPE_NOT_ALLOWED,
            `${role} Account of a ${type} transaction must be ${allowed.join(", ")} but got [accountType=${account.getAccountType()}].`,
        );
    }
}

function requireDifferentAccounts(
    pay: AccountJson,
    counterparty: AccountJson,
    type: TransactionTypeEnum,
): void {
    if (pay.getId() == counterparty.getId()) {
        throw new PostingRuleError(
            PostingErrorCode.SAME_ACCOUNT,
            `Pay and Counter Party Accounts of a ${type} transaction must be different`,
        );
    }
}

function latestBalanceOf(
    account: AccountJson,
    latestBalances: LatestBalances,
): Prisma.Decimal | null {
    const latest = latestBalances.get(account.getId());
    if (latest === undefined) {
        // Programming error: the caller must load every id from postingAccountIds().
        throw new Error(`Latest balance for account [id=${account.getId()}] was not loaded`);
    }
    return latest;
}

function applyDelta(
    account: AccountJson,
    delta: Prisma.Decimal,
    latestBalances: LatestBalances,
): BalanceEffect {
    const latest = latestBalanceOf(account, latestBalances);
    if (latest == null) {
        throw new PostingRuleError(
            PostingErrorCode.BALANCE_NOT_INITIALIZED,
            `Balance for account with [id:${account.getId()}] not found, try to initialize it first`,
        );
    }
    return { accountId: account.getId(), delta, newBalance: Money.add(latest, delta) };
}
