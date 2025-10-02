import { useState } from "react";
import {ModalTypeEnum} from "../../model/PersofiModels";

export interface DialogController<T> {
    open: boolean;
    type: ModalTypeEnum;
    data: T;
    openDialog: (type: ModalTypeEnum, data: T) => void;
    closeDialog: () => void;
}

export const useDialogController = <T>(defaultData: T): DialogController<T> => {
    const [open, setOpen] = useState(false);
    const [type, setType] = useState<ModalTypeEnum>(ModalTypeEnum.ADD);
    const [data, setData] = useState<T>(defaultData);

    const openDialog = (type: ModalTypeEnum, data: T) => {
        setType(type);
        setData(data);
        setOpen(true);
    };

    const closeDialog = () => {
        setOpen(false);
    };

    return {
        open,
        type,
        data,
        openDialog,
        closeDialog,
    };
};
