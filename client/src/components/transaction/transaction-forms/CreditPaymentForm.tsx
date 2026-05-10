import React, {FC} from "react";
import {AccountJson, AccountTypeEnum, ModalTypeEnum, TransactionJson} from "../../../model/PersofiModels";
import FormLabel from "../../common/FormLabel";
import {Autocomplete, TextField} from "@mui/material";
import { useAccounts } from "../../../hooks/useAccounts";

interface CreditPaymentFormProps {
    selectedTransaction: TransactionJson,
    payAccount: AccountJson | null,
    setPayAccount: (account: AccountJson | null) => void,
    counterPartyAccount: AccountJson | null,
    setCounterPartyAccount: (account: AccountJson | null) => void,
    amount: number,
    setAmount: (amount: number) => void,
    dialogType: ModalTypeEnum,
}

export const CreditPaymentForm: FC<CreditPaymentFormProps> = ({
    selectedTransaction,
    payAccount,
    setPayAccount,
    counterPartyAccount,
    setCounterPartyAccount,
    amount,
    setAmount,
    dialogType
}) => {
    const { data: accountsData } = useAccounts();
    const accounts = accountsData || [];

    const isReadOnly = dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed;

    return (
        <>
            <FormLabel>Paying with (Debit / Cash / Saving)</FormLabel>
            <Autocomplete
                options={accounts.filter(acc => acc.accountType !== AccountTypeEnum.CREDIT)}
                getOptionLabel={(opt: AccountJson) => `${opt.name} (${opt.accountType})`}
                getOptionKey={(opt: AccountJson) => opt.id}
                value={payAccount}
                onChange={(e, nv) => setPayAccount(nv)}
                renderInput={(params) => (
                    <TextField {...params} fullWidth placeholder="Select paying account..." />
                )}
                size="small"
                disabled={isReadOnly}
            />

            <FormLabel>Credit card to pay off</FormLabel>
            <Autocomplete
                options={accounts.filter(acc => acc.accountType === AccountTypeEnum.CREDIT)}
                getOptionLabel={(opt: AccountJson) => opt.name}
                getOptionKey={(opt: AccountJson) => opt.id}
                value={counterPartyAccount}
                onChange={(e, nv) => setCounterPartyAccount(nv)}
                renderInput={(params) => (
                    <TextField {...params} fullWidth placeholder="Select credit card..." />
                )}
                size="small"
                disabled={isReadOnly}
            />

            <FormLabel>Payment Amount</FormLabel>
            <TextField
                type="number"
                fullWidth
                size="small"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter payment amount (e.g. 500.00)"
                disabled={isReadOnly}
                inputProps={{ min: 0.01, step: 0.01 }}
            />
        </>
    );
}