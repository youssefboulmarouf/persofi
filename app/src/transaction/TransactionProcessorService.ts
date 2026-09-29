import { Prisma } from "@prisma/client";
import { BaseService } from "../utilities/BaseService";
import { BalanceService } from "../balance/BalanceService";
import { TransactionJson } from "./TransactionJson";
import { AccountsById, computeBalanceEffects, postingAccountIds } from "./BalanceEffects";

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
    async process(transaction: TransactionJson, accounts: AccountsById): Promise<void> {
        const latestBalances = new Map<number, Prisma.Decimal | null>();
        for (const accountId of postingAccountIds(transaction)) {
            const latest = await this.balanceService.findLatestBalanceOfAccount(accountId);
            latestBalances.set(accountId, latest ? latest.getAmount() : null);
        }

        const effects = computeBalanceEffects(transaction, accounts, latestBalances);

        for (const effect of effects) {
            await this.balanceService.updateAccountBalance(
                effect.newBalance,
                transaction.getDate(),
                transaction.getId(),
                effect.accountId,
            );
        }
    }
}
