"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unitTypeFromString = exports.UnitTypeEnum = void 0;
const AppError_1 = __importDefault(require("../utilities/errors/AppError"));
var UnitTypeEnum;
(function (UnitTypeEnum) {
    UnitTypeEnum["L"] = "L";
    UnitTypeEnum["KG"] = "Kg";
    UnitTypeEnum["PIECE"] = "Piece";
    UnitTypeEnum["PACK"] = "Pack";
})(UnitTypeEnum || (exports.UnitTypeEnum = UnitTypeEnum = {}));
function unitTypeFromString(type) {
    if (Object.values(UnitTypeEnum).includes(type)) {
        return type;
    }
    throw new AppError_1.default("Runtime Error", 500, `Invalid UnitTypeEnum value: ${type}. Expected 'L', 'Kg', 'Piece', 'Pack'.`);
}
exports.unitTypeFromString = unitTypeFromString;
