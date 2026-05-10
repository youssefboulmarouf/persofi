import React, {FC} from "react";
import FormLabel from "../../common/FormLabel";
import {Autocomplete, TextField} from "@mui/material";
import {AccountJson, AccountTypeEnum, ModalTypeEnum, TransactionJson} from "../../../model/PersofiModels";
import { useAccounts } from "../../../hooks/useAccounts";

interface IncomeFormProps {
    selectedTransaction: TransactionJson,
    counterPartyAccount: AccountJson | null,
    setCounterPartyAccount: (account: AccountJson | null) => void,
    amount: number,
    setAmount: (amount: number) => void,
    dialogType: ModalTypeEnum,
}

export const IncomeForm: FC<IncomeFormProps> = ({
    selectedTransaction,
    counterPartyAccount,
    setCounterPartyAccount,
    amount,
    setAmount,
    dialogType
}) => {
    const { data: accountsData } = useAccounts();
    const accounts = accountsData || [];

    // Credit accounts cannot receive income (backend rejects them)
    const depositableAccounts = accounts.filter(
        a => a.accountType !== AccountTypeEnum.CREDIT
    );

    const isReadOnly = dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed;

    return (
        <>
            <FormLabel>Deposit Account</FormLabel>
            <Autocomplete
                options={depositableAccounts}
                getOptionLabel={(opt: AccountJson) => `${opt.name} (${opt.accountType})`}
                getOptionKey={(opt: AccountJson) => opt.id}
                value={counterPartyAccount}
                onChange={(e, nv) => setCounterPartyAccount(nv)}
                renderInput={(params) => (
                    <TextField {...params} fullWidth placeholder="Search Debit / Cash / Saving account..." />
                )}
                size="small"
                disabled={isReadOnly}
            />

            <FormLabel>Amount</FormLabel>
            <TextField
                type="number"
                fullWidth
                size="small"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter received amount (e.g. 1500.00)"
                disabled={isReadOnly}
                inputProps={{ min: 0.01, step: 0.01 }}
            />
        </>
    );
}