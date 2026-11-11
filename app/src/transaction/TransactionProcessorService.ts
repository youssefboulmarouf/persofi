import { Prisma } from "@prisma/client";
import { BaseService, DbClient } from "../utilities/BaseService";
import { BalanceService } from "../balance/BalanceService";
import { TransactionJson } from "./TransactionJson";
import {
    AccountsById,
    assertNotBackdated,
    computeBalanceEffects,
    postingAccountIds,
} from "./BalanceEffects";

export class TransactionProcessorService extends BaseService {
    private readonly balanceService: BalanceService;

    constructor() {
        super(TransactionProcessorService.name);
        this.balanceService = new BalanceService();
    }

    /**
     * Applies the transaction's balance effects as computed by the posting matrix.
     * `accounts` must contain every id returned by postingAccountIds(transaction).
     */
    async process(
        transaction: TransactionJson,
        accounts: AccountsById,
        tx: DbClient,
    ): Promise<void> {
        const latestBalances = new Map<number, Prisma.Decimal | null>();
        const latestBalanceDates = new Map<number, Date>();
        for (const accountId of postingAccountIds(transaction)) {
            const latest = await this.balanceService.findLatestBalanceOfAccount(accountId, tx);
            latestBalances.set(accountId, latest ? latest.getAmount() : null);
            if (latest) {
                latestBalanceDates.set(accountId, latest.getDate());
            }
        }

        const effects = computeBalanceEffects(transaction, accounts, latestBalances);
        for (const [accountId, latestDate] of latestBalanceDates) {
            assertNotBackdated(transaction.getDate(), accountId, latestDate);
        }

        for (const effect of effects) {
            await this.balanceService.updateAccountBalance(
                effect.newBalance,
                transaction.getDate(),
                transaction.getId(),
                effect.accountId,
                tx,
            );
        }
    }
}
