import AppError from "../utilities/errors/AppError";

export enum UnitTypeEnum {
    L = "L",
    KG = "Kg",
    PIECE = "Piece",
    PACK = "Pack",
}

export function unitTypeFromString(type: string): UnitTypeEnum {
    if (Object.values(UnitTypeEnum).includes(type as UnitTypeEnum)) {
        return type as UnitTypeEnum;
    }
    throw new AppError(
        "Runtime Error",
        500,
        `Invalid UnitTypeEnum value: ${type}. Expected 'L', 'Kg', 'Piece', 'Pack'.`
    );
}