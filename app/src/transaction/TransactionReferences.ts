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
        [
            { id: transaction.getPayAccountId(), field: "payAccountId" },
            { id: transaction.getCounterpartyAccountId(), field: "counterpartyAccountId" },
        ],
        async (ids) => db.account.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist("Store", [{ id: transaction.getStoreId(), field: "storeId" }], async (ids) =>
        db.store.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist(
        "Person",
        [{ id: transaction.getPersonId(), field: "personId" }],
        async (ids) => db.person.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist(
        "Refunded Transaction",
        [{ id: transaction.getRefundOfId(), field: "refundOfId" }],
        async (ids) =>
            db.transaction.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist(
        "Product Variant",
        items.map((item, index) => ({
            id: item.getVariantId(),
            field: `items[${index}].variantId`,
        })),
        async (ids) =>
            db.productVariant.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist(
        "Brand",
        items.map((item, index) => ({ id: item.getBrandId(), field: `items[${index}].brandId` })),
        async (ids) => db.brand.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
    await assertExist(
        "Category",
        items.map((item, index) => ({
            id: item.getCategoryId(),
            field: `items[${index}].categoryId`,
        })),
        async (ids) => db.category.findMany({ where: { id: { in: ids } }, select: { id: true } }),
    );
}

async function assertExist(
    entity: string,
    candidates: { id: number | null; field: string }[],
    findExisting: (ids: number[]) => Promise<{ id: number }[]>,
): Promise<void> {
    const present = candidates.filter((candidate) => candidate.id != null);
    const invalid = present.find((candidate) => !Number.isInteger(candidate.id));
    BadRequestError.throwIf(!!invalid, `${entity} id must be an integer`, invalid?.field);
    const ids = [...new Set(present.map((candidate) => candidate.id as number))];
    if (ids.length === 0) {
        return;
    }

    const existing = new Set((await findExisting(ids)).map((row) => row.id));
    const missing = present.filter((candidate) => !existing.has(candidate.id as number));
    BadRequestError.throwIf(
        missing.length > 0,
        `${entity} with [id=${missing.map(({ id }) => id).join(", ")}] does not exist`,
        missing[0]?.field,
    );
}
