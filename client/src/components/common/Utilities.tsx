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

/*
export const formatDate = (date: Date) => {
    const newDate = new Date(date);
    const day = newDate.getUTCDate().toString().padStart(2, "0");
    const month = (newDate.getUTCMonth() + 1).toString().padStart(2, "0");
    const year = newDate.getUTCFullYear();

    return `${day}/${month}/${year}`;
};

export const getFirstDayOfCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
};

export const getCurrentMonthKey = (): string => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
}

export const  getPastMonthKey = (): string => {
    const now = new Date();
    let month = now.getMonth() - 1;
    let year = now.getFullYear();

    if (month < 0) {
        month = 11; // December
        year -= 1;
    }

    return `${String(month + 1).padStart(2, "0")}/${year}`;
}*/
