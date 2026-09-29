import { Prisma } from "@prisma/client";
import { TransactionJson } from "./TransactionJson";
import { TransactionItemJson } from "../transaction-item/TransactionItemJson";

export enum ItemizationStatus {
    NOT_ITEMIZED = "NOT_ITEMIZED",
    PARTIAL = "PARTIAL",
    NEEDS_REVIEW = "NEEDS_REVIEW",
    COMPLETE = "COMPLETE",
}

export interface Allocation {
    /** Amount the items should add up to: the pre-tax subtotal. */
    target: Prisma.Decimal;
    allocated: Prisma.Decimal;
    /** target − allocated; negative when items exceed the subtotal. */
    unallocated: Prisma.Decimal;
    status: ItemizationStatus;
}

/**
 * Derives how much of a transaction is covered by its items. Informational only:
 * items never affect validity or balance effects (docs/POSTING_MATRIX.md §9).
 */
export function computeAllocation(transaction: TransactionJson): Allocation {
    const target = transaction.getSubtotal();
    const items = transaction.getItems();
    const allocated = items.reduce(
        (sum, item) => sum.plus(item.getLineTotal()),
        new Prisma.Decimal(0),
    );
    const unallocated = target.minus(allocated);

    let status: ItemizationStatus;
    if (items.length === 0) {
        status = ItemizationStatus.NOT_ITEMIZED;
    } else if (unallocated.isNegative() || items.some(hasLineMismatch)) {
        status = ItemizationStatus.NEEDS_REVIEW;
    } else if (unallocated.isZero()) {
        status = ItemizationStatus.COMPLETE;
    } else {
        status = ItemizationStatus.PARTIAL;
    }

    return { target, allocated, unallocated, status };
}

function hasLineMismatch(item: TransactionItemJson): boolean {
    const expected = new Prisma.Decimal(item.getQuantity())
        .times(item.getUnitPrice())
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    return !expected.equals(item.getLineTotal());
}
