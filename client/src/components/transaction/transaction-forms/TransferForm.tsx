import React, {FC} from "react";
import FormLabel from "../../common/FormLabel";
import {Autocomplete, TextField} from "@mui/material";
import {AccountJson, ModalTypeEnum, TransactionJson} from "../../../model/PersofiModels";
import {AccountContextValue} from "../../../context/AccountContext";

interface TransferFormProps {
    selectedTransaction: TransactionJson,
    accountContext: AccountContextValue,
    payAccount: AccountJson | null,
    setPayAccount: (account: AccountJson | null) => void,
    counterPartyAccount: AccountJson | null,
    setCounterPartyAccount: (account: AccountJson | null) => void,
    amount: number,
    setAmount: (amount: number) => void,
    dialogType: ModalTypeEnum,
}

export const TransferForm: FC<TransferFormProps> = ({
    selectedTransaction,
    accountContext,
    payAccount,
    setPayAccount,
    counterPartyAccount,
    setCounterPartyAccount,
    amount,
    setAmount,
    dialogType
}) => {
    return (
        <>
            <FormLabel>Sending Account</FormLabel>
            <Autocomplete
                options={accountContext.accounts}
                getOptionLabel={(opt: AccountJson) => opt.name}
                getOptionKey={(opt: AccountJson) => opt.id}
                value={payAccount}
                onChange={(e, nv) => setPayAccount(nv)}
                renderInput={(params) => <TextField {...params} fullWidth/>}
                size="small"
                disabled={dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed}
            />

            <FormLabel>Receiving Account</FormLabel>
            <Autocomplete
                options={accountContext.accounts.filter(a => a.id !== payAccount?.id)}
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