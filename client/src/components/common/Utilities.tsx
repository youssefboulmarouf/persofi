import Button from "@mui/material/Button";
import {ModalTypeEnum} from "../../model/PersofiModels";

export const getActionButton = (
    type: ModalTypeEnum,
    onClick: () => void,
    label?: string,
    disabled?: boolean
) => {
    const colorMap = {
        [ModalTypeEnum.ADD]: "primary",
        [ModalTypeEnum.UPDATE]: "warning",
        [ModalTypeEnum.DELETE]: "error",
    } as const;

    return (
        <Button variant="contained" color={colorMap[type]} onClick={onClick} disabled={disabled ?? false}>{label}</Button>
    );
};

export const getFirstDayOfCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

/** "MM/YYYY" for the current month (local time) */
export const  getCurrentMonthKey = (): string => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

/** "MM/YYYY" for the previous calendar month (local time) */
export const getPastMonthKey = (): string => {
    const now = new Date();
    let m = now.getMonth() - 1;
    let y = now.getFullYear();
    if (m < 0) { m = 11; y -= 1; }
    return `${String(m + 1).padStart(2, "0")}/${y}`;
}

// ---- Date range helpers ----
export type DateRange = { start?: Date | null; end?: Date | null };

// Normalize to day bounds (inclusive) and fill with dataset min/max if absent.
export const normalizeRange = (range: DateRange | undefined, datasetDates: Date[]): { start?: number; end?: number } => {
    if (!datasetDates.length) return { start: undefined, end: undefined };

    const min = Math.min(...datasetDates.map((d) => d.getTime()));
    const max = Math.max(...datasetDates.map((d) => d.getTime()));

    const startTime =
        range?.start != null
            ? new Date(range.start).setHours(0, 0, 0, 0)
            : new Date(min).setHours(0, 0, 0, 0);

    const endTime =
        range?.end != null
            ? new Date(range.end).setHours(23, 59, 59, 999)
            : new Date(max).setHours(23, 59, 59, 999);

    return { start: startTime, end: endTime };
}

export const inRangeInclusive = (ts: number, start?: number, end?: number) => {
    if (start != null && ts < start) return false;
    if (end != null && ts > end) return false;
    return true;
}

export const round2 = (x: number) => {
    return Math.round((x + Number.EPSILON) * 100) / 100;
}