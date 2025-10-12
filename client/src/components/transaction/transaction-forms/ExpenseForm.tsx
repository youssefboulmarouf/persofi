import React, {FC} from "react";
import {
    Autocomplete, Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow, TextField
} from "@mui/material";
import FormLabel from "../../common/FormLabel";
import {
    AccountJson,
    ModalTypeEnum, PersonJson,
    StoreJson,
    TransactionItemJson,
    TransactionJson
} from "../../../model/PersofiModels";
import TableCallToActionButton from "../../common/TableCallToActionButton";
import {AccountContextValue} from "../../../context/AccountContext";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";
import {uniqueId} from "lodash";
import {StoreContextValue} from "../../../context/StoreContext";
import {PersonContextValue} from "../../../context/PersonContext";

interface ExpenseFormProps {
    selectedTransaction: TransactionJson,
    accountContext: AccountContextValue,
    storeContext: StoreContextValue,
    personContext: PersonContextValue,
    payAccount: AccountJson | null,
    setPayAccount: (account: AccountJson | null) => void,
    store: StoreJson | null,
    setStore: (store: StoreJson | null) => void,
    person: PersonJson | null,
    setPerson: (person: PersonJson | null) => void,
    items: TransactionItemJson[],
    subtotal: number,
    taxTotal: number,
    grandTotal: number,
    setTaxTotal: (tax: number) => void,
    handleRemoveItem: (itemToRemove: TransactionItemJson) => void,
    openItemDialogWithType: (type: ModalTypeEnum, item: TransactionItemJson) => void,
    dialogType: ModalTypeEnum,
}

const emptyItem: TransactionItemJson = {
    id: 0,
    description: "",
    quantity: 0,
    unitPrice: 0,
    lineTotal: 0,
    transactionId: 0,
    variantId: null,
    categoryId: null,
    brandId: null,
};

export const ExpenseForm: FC<ExpenseFormProps> = ({
    selectedTransaction,
    accountContext,
    storeContext,
    personContext,
    payAccount,
    setPayAccount,
    store,
    setStore,
    person,
    setPerson,
    items,
    handleRemoveItem,
    openItemDialogWithType,
    dialogType,
    subtotal,
    taxTotal,
    setTaxTotal,
    grandTotal
}) => {
    return (
        <>
            <Stack direction="row" spacing={1} justifyContent="space-between">
                <Box sx={{ width: '100%' }} >
                    <FormLabel>Pay Account</FormLabel>
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
                </Box>

                <Box sx={{ width: '100%' }} >
                    <FormLabel>Store</FormLabel>
                    <Autocomplete
                        options={storeContext.stores}
                        getOptionLabel={(opt: StoreJson) => opt.name}
                        getOptionKey={(opt: StoreJson) => opt.id}
                        value={store}
                        onChange={(e, nv) => setStore(nv)}
                        renderInput={(params) => <TextField {...params} fullWidth/>}
                        size="small"
                        disabled={dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed}
                    />
                </Box>

                <Box sx={{ width: '100%' }} >
                    <FormLabel>Person</FormLabel>
                    <Autocomplete
                        options={personContext.persons}
                        getOptionLabel={(opt: PersonJson) => opt.name}
                        getOptionKey={(opt: PersonJson) => opt.id}
                        value={person}
                        onChange={(e, nv) => setPerson(nv)}
                        renderInput={(params) => <TextField {...params} fullWidth/>}
                        size="small"
                        disabled={dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed}
                    />
                </Box>
            </Stack>

            <Stack direction="row" spacing={1} justifyContent="space-between">
                <Box sx={{ width: '100%' }} >
                    <FormLabel>Subtotal</FormLabel>
                    <TextField fullWidth value={subtotal} disabled/>
                </Box>

                <Box sx={{ width: '100%' }} >
                    <FormLabel>Tax Total</FormLabel>
                    <TextField
                        type="number"
                        fullWidth
                        value={taxTotal}
                        onChange={(e) => setTaxTotal(parseFloat(e.target.value))}
                        disabled={dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed}
                    />
                </Box>

                <Box sx={{ width: '100%' }} >
                    <FormLabel>Grand Total</FormLabel>
                    <TextField fullWidth value={grandTotal} disabled/>
                </Box>
            </Stack>

            <Box mt={2}>
                <TableCallToActionButton
                    fullwidth={true}
                    callToActionText="Add Item"
                    callToActionFunction={() => openItemDialogWithType(ModalTypeEnum.ADD, emptyItem)}
                />
            </Box>

            <Box sx={{overflowX: "auto"}} mt={3}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell>Qty</TableCell>
                            <TableCell>Unit Price</TableCell>
                            <TableCell>Line Total</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((it) => (
                            <TableRow key={uniqueId()}>
                                <TableCell>{it.description}</TableCell>
                                <TableCell>{it.quantity}</TableCell>
                                <TableCell>{it.unitPrice}</TableCell>
                                <TableCell>{it.lineTotal}</TableCell>
                                <TableCell align="right">
                                    <IconButton
                                        color="error"
                                        onClick={() => handleRemoveItem(it)}
                                        disabled={dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed}
                                    >
                                        <ClearIcon width={22}/>
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>



        </>
    );
}