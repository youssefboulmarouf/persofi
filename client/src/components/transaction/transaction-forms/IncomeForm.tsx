import React, {FC} from "react";
import FormLabel from "../../common/FormLabel";
import {Autocomplete, TextField} from "@mui/material";
import {AccountJson, ModalTypeEnum, TransactionJson} from "../../../model/PersofiModels";
import {AccountContextValue} from "../../../context/AccountContext";

interface IncomeFormProps {
    selectedTransaction: TransactionJson,
    accountContext: AccountContextValue,
    counterPartyAccount: AccountJson | null,
    setCounterPartyAccount: (account: AccountJson | null) => void,
    amount: number,
    setAmount: (amount: number) => void,
    dialogType: ModalTypeEnum,
}

export const IncomeForm: FC<IncomeFormProps> = ({
    selectedTransaction,
    accountContext,
    counterPartyAccount,
    setCounterPartyAccount,
    amount,
    setAmount,
    dialogType
}) => {
    return (
        <>
            <FormLabel>Deposit Account</FormLabel>
            <Autocomplete
                options={accountContext.accounts}
                getOptionLabel={(opt: AccountJson) => opt.name}
                getOptionKey={(opt: AccountJson) => opt.id}
                value={counterPartyAccount}
                onChange={(e, nv) => setCounterPartyAccount(nv)}
                renderInput={(params) => <TextField {...params} fullWidth/>}
                size="small"
                disabled={dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed}
            />

            <FormLabel>Amount</FormLabel>
            <TextField
                type="number"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value))}
                disabled={dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed}
            />
        </>
    );
}