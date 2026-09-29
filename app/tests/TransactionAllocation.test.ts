import { TransactionJson } from "../src/transaction/TransactionJson";
import { TransactionTypeEnum } from "../src/transaction/TransactionType";
import { TransactionItemJson } from "../src/transaction-item/TransactionItemJson";
import { computeAllocation, ItemizationStatus } from "../src/transaction/TransactionAllocation";
import { Prisma } from "@prisma/client";

function item(quantity: number, unitPrice: string, lineTotal: string): TransactionItemJson {
    return new TransactionItemJson(
        0,
        7,
        "item",
        quantity,
        new Prisma.Decimal(unitPrice),
        new Prisma.Decimal(lineTotal),
        null,
        null,
        null,
    );
}

function expense(subtotal: string, items: TransactionItemJson[]): TransactionJson {
    const tax = "1.00";
    const grand = new Prisma.Decimal(subtotal).plus(tax).toFixed(2);
    return new TransactionJson(
        7,
        new Date(),
        TransactionTypeEnum.EXPENSE,
        "",
        false,
        items,
        1,
        null,
        null,
        null,
        null,
        subtotal,
        tax,
        grand,
        "0",
    );
}

function summary(t: TransactionJson) {
    const a = computeAllocation(t);
    return {
        target: a.target.toFixed(2),
        allocated: a.allocated.toFixed(2),
        unallocated: a.unallocated.toFixed(2),
        status: a.status,
    };
}

describe("computeAllocation", () => {
    it("is NOT_ITEMIZED without items", () => {
        expect(summary(expense("20.00", []))).toEqual({
            target: "20.00",
            allocated: "0.00",
            unallocated: "20.00",
            status: ItemizationStatus.NOT_ITEMIZED,
        });
    });

    it("is PARTIAL when items cover part of the subtotal", () => {
        expect(summary(expense("20.00", [item(2, "3.25", "6.50")]))).toEqual({
            target: "20.00",
            allocated: "6.50",
            unallocated: "13.50",
            status: ItemizationStatus.PARTIAL,
        });
    });

    it("is COMPLETE when items add up to the subtotal exactly", () => {
        const t = expense("0.30", [item(1, "0.10", "0.10"), item(1, "0.20", "0.20")]);
        expect(summary(t).status).toBe(ItemizationStatus.COMPLETE);
        expect(summary(t).unallocated).toBe("0.00");
    });

    it("accepts weighted quantities rounded half-up", () => {
        // 0.455 kg × 2.99 = 1.36045 → 1.36
        expect(summary(expense("1.36", [item(0.455, "2.99", "1.36")])).status).toBe(
            ItemizationStatus.COMPLETE,
        );
    });

    it("is NEEDS_REVIEW when items exceed the subtotal", () => {
        expect(summary(expense("5.00", [item(1, "6.00", "6.00")]))).toEqual({
            target: "5.00",
            allocated: "6.00",
            unallocated: "-1.00",
            status: ItemizationStatus.NEEDS_REVIEW,
        });
    });

    it("is NEEDS_REVIEW when a line total disagrees with quantity × unit price", () => {
        expect(summary(expense("20.00", [item(2, "3.00", "5.00")])).status).toBe(
            ItemizationStatus.NEEDS_REVIEW,
        );
    });
});
