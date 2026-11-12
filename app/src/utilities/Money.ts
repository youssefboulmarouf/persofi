import { Prisma } from "@prisma/client";
import BadRequestError from "./errors/BadRequestError";

export type MoneyInput = Prisma.Decimal | number | string;

const MAX_MONEY = new Prisma.Decimal("99999999.99");

export class Money {
    private static invalid(message: string, field?: string): never {
        return BadRequestError.reject(message, field);
    }

    static parse(value: MoneyInput, field?: string): Prisma.Decimal {
        const label = field ?? "Money value";
        let amount: Prisma.Decimal;
        try {
            amount = new Prisma.Decimal(value);
        } catch {
            return this.invalid(`${label} must be a valid number`, field);
        }

        BadRequestError.throwIf(!amount.isFinite(), `${label} must be a finite number`, field);
        BadRequestError.throwIf(
            amount.decimalPlaces() > 2,
            `${label} must have at most 2 decimal places`,
            field,
        );
        BadRequestError.throwIf(
            amount.abs().greaterThan(MAX_MONEY),
            `${label} exceeds the maximum value`,
            field,
        );
        return amount;
    }

    static add(left: MoneyInput, right: MoneyInput): Prisma.Decimal {
        return this.parse(this.parse(left).plus(this.parse(right)));
    }

    static subtract(left: MoneyInput, right: MoneyInput): Prisma.Decimal {
        return this.parse(this.parse(left).minus(this.parse(right)));
    }

    static compare(left: MoneyInput, right: MoneyInput): number {
        return this.parse(left).comparedTo(this.parse(right));
    }

    static round(value: MoneyInput): Prisma.Decimal {
        let amount: Prisma.Decimal;
        try {
            amount = new Prisma.Decimal(value);
        } catch {
            return this.invalid("Money value must be a valid number");
        }

        BadRequestError.throwIf(!amount.isFinite(), "Money value must be a finite number");
        return this.parse(amount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP));
    }

    static serialize(value: MoneyInput): number {
        return this.round(value).toNumber();
    }
}
