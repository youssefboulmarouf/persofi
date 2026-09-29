import { Prisma } from "@prisma/client";
import { TransactionJson } from "../src/transaction/TransactionJson";
import { TransactionTypeEnum } from "../src/transaction/TransactionType";
import { AccountJson } from "../src/account/AccountJson";
import { AccountTypeEnum } from "../src/account/AccountType";
import {
    BalanceEffect,
    computeBalanceEffects,
    postingAccountIds,
} from "../src/transaction/BalanceEffects";
import PostingRuleError, { PostingErrorCode } from "../src/utilities/errors/PostingRuleError";

// Table-driven tests for docs/POSTING_MATRIX.md §3 and §5.

const { DEBIT, CREDIT, CASH, SAVING } = AccountTypeEnum;
const ALL_TYPES = [DEBIT, CREDIT, CASH, SAVING];
const NON_CREDIT = [DEBIT, CASH, SAVING];

const PAY_ID = 1;
const COUNTERPARTY_ID = 2;
const START_BALANCE = "100.00";

function account(id: number, type: AccountTypeEnum): AccountJson {
    return new AccountJson(id, `Account ${id}`, type, "CAD", true);
}

function tx(
    type: TransactionTypeEnum,
    fields: Partial<{
        payAccountId: number | null;
        counterpartyAccountId: number | null;
        refundOfId: number | null;
        subtotal: string;
        taxTotal: string;
        grandTotal: string;
        amount: string;
    }> = {},
): TransactionJson {
    const withTotals = type == TransactionTypeEnum.EXPENSE || type == TransactionTypeEnum.REFUND;
    const d = {
        payAccountId: null,
        counterpartyAccountId: null,
        refundOfId: null,
        subtotal: withTotals ? "10.00" : "0",
        taxTotal: withTotals ? "1.50" : "0",
        grandTotal: withTotals ? "11.50" : "0",
        amount: withTotals ? "0" : "25.00",
        ...fields,
    };
    return new TransactionJson(
        7,
        new Date("2026-09-28T00:00:00Z"),
        type,
        "",
        false,
        [],
        d.payAccountId,
        d.counterpartyAccountId,
        null,
        d.refundOfId,
        null,
        d.subtotal,
        d.taxTotal,
        d.grandTotal,
        d.amount,
    );
}

function accounts(...list: AccountJson[]): Map<number, AccountJson> {
    return new Map(list.map((a) => [a.getId(), a]));
}

function balances(entries: [number, string | null][]): Map<number, Prisma.Decimal | null> {
    return new Map(
        entries.map(([id, amount]) => [id, amount == null ? null : new Prisma.Decimal(amount)]),
    );
}

function simplify(effects: BalanceEffect[]) {
    return effects.map((e) => ({
        accountId: e.accountId,
        delta: e.delta.toFixed(2),
        newBalance: e.newBalance.toFixed(2),
    }));
}

function expectPostingError(fn: () => unknown, code: PostingErrorCode) {
    try {
        fn();
    } catch (e) {
        expect(e).toBeInstanceOf(PostingRuleError);
        expect((e as PostingRuleError).code).toBe(code);
        expect((e as PostingRuleError).status).toBe(400);
        return;
    }
    throw new Error(`Expected PostingRuleError ${code}`);
}

const bothStarted = balances([
    [PAY_ID, START_BALANCE],
    [COUNTERPARTY_ID, START_BALANCE],
]);

// ─── Single-account types ───────────────────────────────────────────────────

describe("Expense", () => {
    test.each([
        [DEBIT, "-11.50", "88.50"],
        [CASH, "-11.50", "88.50"],
        [SAVING, "-11.50", "88.50"],
        [CREDIT, "11.50", "111.50"],
    ])("pay account %s → delta %s", (type, delta, newBalance) => {
        const effects = computeBalanceEffects(
            tx(TransactionTypeEnum.EXPENSE, { payAccountId: PAY_ID }),
            accounts(account(PAY_ID, type)),
            bothStarted,
        );
        expect(simplify(effects)).toEqual([{ accountId: PAY_ID, delta, newBalance }]);
    });
});

describe("Income", () => {
    test.each(NON_CREDIT)("counterparty %s → +amount", (type) => {
        const effects = computeBalanceEffects(
            tx(TransactionTypeEnum.INCOME, { counterpartyAccountId: COUNTERPARTY_ID }),
            accounts(account(COUNTERPARTY_ID, type)),
            bothStarted,
        );
        expect(simplify(effects)).toEqual([
            { accountId: COUNTERPARTY_ID, delta: "25.00", newBalance: "125.00" },
        ]);
    });

    it("rejects a Credit counterparty", () => {
        expectPostingError(
            () =>
                computeBalanceEffects(
                    tx(TransactionTypeEnum.INCOME, { counterpartyAccountId: COUNTERPARTY_ID }),
                    accounts(account(COUNTERPARTY_ID, CREDIT)),
                    bothStarted,
                ),
            PostingErrorCode.ACCOUNT_TYPE_NOT_ALLOWED,
        );
    });
});

describe("Refund", () => {
    test.each([
        [DEBIT, "11.50", "111.50"],
        [CASH, "11.50", "111.50"],
        [SAVING, "11.50", "111.50"],
        [CREDIT, "-11.50", "88.50"],
    ])("counterparty %s → delta %s", (type, delta, newBalance) => {
        const effects = computeBalanceEffects(
            tx(TransactionTypeEnum.REFUND, {
                counterpartyAccountId: COUNTERPARTY_ID,
                refundOfId: 99,
            }),
            accounts(account(COUNTERPARTY_ID, type)),
            bothStarted,
        );
        expect(simplify(effects)).toEqual([{ accountId: COUNTERPARTY_ID, delta, newBalance }]);
    });
});

describe("Init_Balance", () => {
    test.each(ALL_TYPES)("counterparty %s with no balance → first row equals amount", (type) => {
        const effects = computeBalanceEffects(
            tx(TransactionTypeEnum.INIT_BALANCE, {
                counterpartyAccountId: COUNTERPARTY_ID,
                amount: "300.00",
            }),
            accounts(account(COUNTERPARTY_ID, type)),
            balances([[COUNTERPARTY_ID, null]]),
        );
        expect(simplify(effects)).toEqual([
            { accountId: COUNTERPARTY_ID, delta: "300.00", newBalance: "300.00" },
        ]);
    });

    it("allows a zero starting balance", () => {
        const effects = computeBalanceEffects(
            tx(TransactionTypeEnum.INIT_BALANCE, {
                counterpartyAccountId: COUNTERPARTY_ID,
                amount: "0",
            }),
            accounts(account(COUNTERPARTY_ID, CREDIT)),
            balances([[COUNTERPARTY_ID, null]]),
        );
        expect(simplify(effects)).toEqual([
            { accountId: COUNTERPARTY_ID, delta: "0.00", newBalance: "0.00" },
        ]);
    });

    test.each(ALL_TYPES)("rejects counterparty %s that already has a balance", (type) => {
        expectPostingError(
            () =>
                computeBalanceEffects(
                    tx(TransactionTypeEnum.INIT_BALANCE, {
                        counterpartyAccountId: COUNTERPARTY_ID,
                    }),
                    accounts(account(COUNTERPARTY_ID, type)),
                    balances([[COUNTERPARTY_ID, "0.00"]]),
                ),
            PostingErrorCode.BALANCE_ALREADY_INITIALIZED,
        );
    });
});

// ─── Two-account types: every pay × counterparty combination ────────────────

const pairs = ALL_TYPES.flatMap((pay) => ALL_TYPES.map((counterparty) => [pay, counterparty]));

describe("Transfer", () => {
    test.each(pairs)("%s → %s", (payType, counterpartyType) => {
        const run = () =>
            computeBalanceEffects(
                tx(TransactionTypeEnum.TRANSFER, {
                    payAccountId: PAY_ID,
                    counterpartyAccountId: COUNTERPARTY_ID,
                }),
                accounts(account(PAY_ID, payType), account(COUNTERPARTY_ID, counterpartyType)),
                bothStarted,
            );

        if (NON_CREDIT.includes(payType) && NON_CREDIT.includes(counterpartyType)) {
            expect(simplify(run())).toEqual([
                { accountId: PAY_ID, delta: "-25.00", newBalance: "75.00" },
                { accountId: COUNTERPARTY_ID, delta: "25.00", newBalance: "125.00" },
            ]);
        } else {
            expectPostingError(run, PostingErrorCode.ACCOUNT_TYPE_NOT_ALLOWED);
        }
    });

    it("rejects the same account on both sides", () => {
        expectPostingError(
            () =>
                computeBalanceEffects(
                    tx(TransactionTypeEnum.TRANSFER, {
                        payAccountId: PAY_ID,
                        counterpartyAccountId: PAY_ID,
                    }),
                    accounts(account(PAY_ID, DEBIT)),
                    bothStarted,
                ),
            PostingErrorCode.SAME_ACCOUNT,
        );
    });
});

describe("Credit_Payment", () => {
    test.each(pairs)("%s → %s", (payType, counterpartyType) => {
        const run = () =>
            computeBalanceEffects(
                tx(TransactionTypeEnum.CREDIT_PAYMENT, {
                    payAccountId: PAY_ID,
                    counterpartyAccountId: COUNTERPARTY_ID,
                }),
                accounts(account(PAY_ID, payType), account(COUNTERPARTY_ID, counterpartyType)),
                bothStarted,
            );

        if (NON_CREDIT.includes(payType) && counterpartyType == CREDIT) {
            expect(simplify(run())).toEqual([
                { accountId: PAY_ID, delta: "-25.00", newBalance: "75.00" },
                { accountId: COUNTERPARTY_ID, delta: "-25.00", newBalance: "75.00" },
            ]);
        } else {
            expectPostingError(run, PostingErrorCode.ACCOUNT_TYPE_NOT_ALLOWED);
        }
    });

    it("rejects the same account on both sides", () => {
        expectPostingError(
            () =>
                computeBalanceEffects(
                    tx(TransactionTypeEnum.CREDIT_PAYMENT, {
                        payAccountId: PAY_ID,
                        counterpartyAccountId: PAY_ID,
                    }),
                    accounts(account(PAY_ID, CREDIT)),
                    bothStarted,
                ),
            PostingErrorCode.SAME_ACCOUNT,
        );
    });
});

// ─── Cross-cutting rules ────────────────────────────────────────────────────

describe("Shared rules", () => {
    it("rejects a missing required account", () => {
        expectPostingError(
            () =>
                computeBalanceEffects(
                    tx(TransactionTypeEnum.EXPENSE, { payAccountId: null }),
                    accounts(),
                    bothStarted,
                ),
            PostingErrorCode.ACCOUNT_REQUIRED,
        );
    });

    it("rejects an account that was not loaded", () => {
        expectPostingError(
            () =>
                computeBalanceEffects(
                    tx(TransactionTypeEnum.EXPENSE, { payAccountId: PAY_ID }),
                    accounts(),
                    bothStarted,
                ),
            PostingErrorCode.ACCOUNT_NOT_FOUND,
        );
    });

    it("rejects posting to an account with no balance yet", () => {
        expectPostingError(
            () =>
                computeBalanceEffects(
                    tx(TransactionTypeEnum.EXPENSE, { payAccountId: PAY_ID }),
                    accounts(account(PAY_ID, DEBIT)),
                    balances([[PAY_ID, null]]),
                ),
            PostingErrorCode.BALANCE_NOT_INITIALIZED,
        );
    });

    it("rejects an unsupported transaction type", () => {
        expectPostingError(
            () =>
                computeBalanceEffects(
                    tx("Loan" as TransactionTypeEnum, { payAccountId: PAY_ID }),
                    accounts(account(PAY_ID, DEBIT)),
                    bothStarted,
                ),
            PostingErrorCode.UNSUPPORTED_TRANSACTION_TYPE,
        );
    });

    it("fails loudly when a latest balance was not loaded", () => {
        expect(() =>
            computeBalanceEffects(
                tx(TransactionTypeEnum.EXPENSE, { payAccountId: PAY_ID }),
                accounts(account(PAY_ID, DEBIT)),
                balances([]),
            ),
        ).toThrow(/was not loaded/);
    });

    it("uses exact decimal arithmetic", () => {
        const effects = computeBalanceEffects(
            tx(TransactionTypeEnum.EXPENSE, {
                payAccountId: PAY_ID,
                subtotal: "0.10",
                taxTotal: "0.20",
                grandTotal: "0.30",
            }),
            accounts(account(PAY_ID, DEBIT)),
            balances([[PAY_ID, "0.30"]]),
        );
        expect(effects[0].newBalance.isZero()).toBe(true);
    });

    it("lists each posting account once", () => {
        expect(
            postingAccountIds(
                tx(TransactionTypeEnum.TRANSFER, {
                    payAccountId: PAY_ID,
                    counterpartyAccountId: PAY_ID,
                }),
            ),
        ).toEqual([PAY_ID]);
        expect(
            postingAccountIds(
                tx(TransactionTypeEnum.INCOME, { counterpartyAccountId: COUNTERPARTY_ID }),
            ),
        ).toEqual([COUNTERPARTY_ID]);
    });
});
