import { DbClient } from "../utilities/BaseService";
import BadRequestError from "../utilities/errors/BadRequestError";
import { TransactionJson } from "./TransactionJson";

/**
 * Rejects a transaction whose referenced records don't exist, with a 400 naming the missing
 * ids instead of a raw foreign-key error. Run it inside the same database transaction as the write.
 */
export async function assertTransactionReferencesExist(
    db: DbClient,
    transaction: TransactionJson,
): Promise<void> {
    const items = transaction.getItems();

    await assertExist(
        "Account",
        [transaction.getPayAccountId(), transaction.getCounterpartyAccountId()],
        async (ids) => db.account.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist("Store", [transaction.getStoreId()], async (ids) =>
        db.store.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist("Person", [transaction.getPersonId()], async (ids) =>
        db.person.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist("Refunded Transaction", [transaction.getRefundOfId()], async (ids) =>
        db.transaction.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist(
        "Product Variant",
        items.map((item) => item.getVariantId()),
        async (ids) =>
            db.productVariant.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist(
        "Brand",
        items.map((item) => item.getBrandId()),
        async (ids) => db.brand.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist(
        "Category",
        items.map((item) => item.getCategoryId()),
        async (ids) => db.category.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
}

async function assertExist(
    entity: string,
    candidateIds: (number | null)[],
    findExisting: (ids: number[]) => Promise<{ id: number }[]>,
): Promise<void> {
    const ids = [...new Set(candidateIds.filter((id): id is number => id != null))];
    const invalid = ids.filter((id) => !Number.isInteger(id));
    BadRequestError.throwIf(invalid.length > 0, `${entity} id must be an integer`);
    if (ids.length === 0) {
        return;
    }

    const existing = new Set((await findExisting(ids)).map((row) => row.id));
    const missing = ids.filter((id) => !existing.has(id));
    BadRequestError.throwIf(
        missing.length > 0,
        `${entity} with [id=${missing.join(", ")}] does not exist`,
    );
}
