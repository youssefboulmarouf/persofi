import React, {FC} from "react";
import {
    Autocomplete, Chip, Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow, TextField, Typography
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
import { useAccounts } from "../../../hooks/useAccounts";
import { useStores } from "../../../hooks/useStores";
import { usePersons } from "../../../hooks/usePersons";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ClearIcon from "@mui/icons-material/Clear";
import {uniqueId} from "lodash";

interface ExpenseFormProps {
    selectedTransaction: TransactionJson,
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
    const { data: accountsData } = useAccounts();
    const accounts = accountsData || [];

    const { data: storesData } = useStores();
    const stores = storesData || [];

    const { data: personsData } = usePersons();
    const persons = personsData || [];

    const isReadOnly = dialogType === ModalTypeEnum.DELETE || selectedTransaction.processed;

    return (
        <>
            {/* ── Account / Store / Person row ── */}
            <Stack direction="row" spacing={1} justifyContent="space-between">
                <Box sx={{ width: '100%' }}>
                    <FormLabel>Pay Account</FormLabel>
                    <Autocomplete
                        options={accounts}
                        getOptionLabel={(opt: AccountJson) => opt.name}
                        getOptionKey={(opt: AccountJson) => opt.id}
                        value={payAccount}
                        onChange={(e, nv) => setPayAccount(nv)}
                        renderInput={(params) => (
                            <TextField {...params} fullWidth placeholder="Select account..." />
                        )}
                        size="small"
                        disabled={isReadOnly}
                    />
                </Box>

                <Box sx={{ width: '100%' }}>
                    <FormLabel>Store <span style={{ fontWeight: 400, opacity: 0.55, fontSize: '0.8em' }}>(optional)</span></FormLabel>
                    <Autocomplete
                        options={stores}
                        getOptionLabel={(opt: StoreJson) => opt.name}
                        getOptionKey={(opt: StoreJson) => opt.id}
                        value={store}
                        onChange={(e, nv) => setStore(nv)}
                        renderInput={(params) => <TextField {...params} fullWidth placeholder="Search store..." />}
                        size="small"
                        disabled={isReadOnly}
                    />
                </Box>

                <Box sx={{ width: '100%' }}>
                    <FormLabel>Person <span style={{ fontWeight: 400, opacity: 0.55, fontSize: '0.8em' }}>(optional)</span></FormLabel>
                    <Autocomplete
                        options={persons}
                        getOptionLabel={(opt: PersonJson) => opt.name}
                        getOptionKey={(opt: PersonJson) => opt.id}
                        value={person}
                        onChange={(e, nv) => setPerson(nv)}
                        renderInput={(params) => <TextField {...params} fullWidth placeholder="Search person..." />}
                        size="small"
                        disabled={isReadOnly}
                    />
                </Box>
            </Stack>

            {/* ── Tax + totals row ── */}
            <Stack direction="row" spacing={1} alignItems="flex-end" mt={1}>
                <Box sx={{ width: '33%' }}>
                    <FormLabel>Tax Total</FormLabel>
                    <TextField
                        type="number"
                        fullWidth
                        size="small"
                        value={taxTotal}
                        onChange={(e) => setTaxTotal(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        helperText="Leave as 0 if no tax applies"
                        disabled={isReadOnly}
                        inputProps={{ min: 0, step: 0.01 }}
                    />
                </Box>
                <Box sx={{ flex: 1, display: 'flex', gap: 2, pb: '22px' }}>
                    <Chip
                        label={`Subtotal: ${subtotal.toFixed(2)}`}
                        variant="outlined"
                        sx={{ flex: 1, fontWeight: 600 }}
                    />
                    <Chip
                        label={`Grand Total: ${grandTotal.toFixed(2)}`}
                        color={grandTotal > 0 ? "primary" : "default"}
                        sx={{ flex: 1, fontWeight: 700 }}
                    />
                </Box>
            </Stack>

            {/* ── Add Item button with count ── */}
            <Box mt={1}>
                <TableCallToActionButton
                    fullwidth={true}
                    callToActionText={items.length > 0 ? `Add Item  (${items.length} added)` : "Add Item"}
                    callToActionFunction={() => openItemDialogWithType(ModalTypeEnum.ADD, emptyItem)}
                />
            </Box>

            {/* ── Items table ── */}
            <Box sx={{overflowX: "auto"}} mt={1}>
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
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center" sx={{ py: 3, opacity: 0.45 }}>
                                    <Typography variant="body2">No items yet — click Add Item above</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((it) => (
                                <TableRow key={uniqueId()}>
                                    <TableCell>{it.description}</TableCell>
                                    <TableCell>{it.quantity}</TableCell>
                                    <TableCell>{it.unitPrice}</TableCell>
                                    <TableCell>{it.lineTotal}</TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="error"
                                            onClick={() => handleRemoveItem(it)}
                                            disabled={isReadOnly}
                                        >
                                            <ClearIcon width={22}/>
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Box>
        </>
    );
}