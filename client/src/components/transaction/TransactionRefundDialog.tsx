import {
    AccountJson,
    ModalTypeEnum,
    ProductJson,
    TransactionItemJson,
    TransactionJson,
    TransactionTypeEnum
} from "../../model/PersofiModels";
import {AccountContextValue} from "../../context/AccountContext";
import React, {FC, useEffect, useState} from "react";
import {
    Autocomplete,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField
} from "@mui/material";
import Typography from "@mui/material/Typography";
import FormLabel from "../common/FormLabel";
import Box from "@mui/material/Box";
import LoadingComponent from "../common/LoadingComponent";
import {getActionButton} from "../common/Utilities";
import Button from "@mui/material/Button";
import {TransactionContextValue} from "../../context/TransactionContext";

interface TransactionRefundDialogProps {
    transactionToRefund: TransactionJson;
    openDialog: boolean;
    closeDialog: () => void;
    accountContext: AccountContextValue;
    transactionContext: TransactionContextValue;
    products: ProductJson[];
}

export const TransactionRefundDialog: FC<TransactionRefundDialogProps> = ({
    transactionToRefund, 
    openDialog, 
    closeDialog, 
    accountContext,
    transactionContext,
    products
}) => {
    const [dateStr, setDateStr] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [counterPartyAccount, setCounterPartyAccount] = useState<AccountJson | null>(null);
    const [subtotal, setSubtotal] = useState<number>(0);
    const [taxTotal, setTaxTotal] = useState<number>(0);
    const [grandTotal, setGrandTotal] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const buildItemName = (item: TransactionItemJson): string => {
        const variant = products.flatMap(pr => pr.variants).find(vr => vr.id === item.variantId);
        const product =  products.find(pr => pr.id === variant?.productId)
        return (product?.name + " (" + variant?.unitSize + " " + variant?.unitType + ")");
    }

    useEffect(() => {
        setDateStr(new Date().toISOString().slice(0, 10));
        setCounterPartyAccount(accountContext.accounts.find(a => a.id === transactionToRefund.payAccountId) ?? null);
    }, [openDialog, transactionToRefund]);

    const emptyForm = () => {
        setDateStr(new Date().toISOString().slice(0, 10));
        setCounterPartyAccount(null);
        setNotes("");
        setSubtotal(0);
        setTaxTotal(0);
        setGrandTotal(0);

        closeDialog();
    }

    const processRefund = async () => {
        if (subtotal > transactionToRefund.subtotal
            || taxTotal > transactionToRefund.taxTotal
            || grandTotal > transactionToRefund.grandTotal
            || counterPartyAccount === null) return;

        setIsLoading(true);
        const refundTx = await transactionContext.addTransaction({
            id: 0,
            date: new Date(dateStr),
            type: TransactionTypeEnum.REFUND,
            notes: notes.trim(),
            processed: false,
            items: [],
            payAccountId: null,
            counterpartyAccountId: counterPartyAccount.id,
            storeId: transactionToRefund.storeId,
            personId: transactionToRefund.personId,
            refundOfId: transactionToRefund.id,
            subtotal,
            taxTotal,
            grandTotal,
            amount: 0
        });

        if (!refundTx) {
            console.log("Error processing refund transaction");
            return;
        }

        await transactionContext.transactionProcessing(refundTx);

        setIsLoading(false);
        emptyForm();
    }

    useEffect(() => {
        const newGrand = (subtotal || 0) + (taxTotal || 0);
        setGrandTotal(parseFloat(newGrand.toFixed(2)));
    }, [subtotal, taxTotal]);

    return (
        <Dialog open={openDialog} onClose={() => emptyForm()} PaperProps={{sx: {width: '900px', maxWidth: '900px'}}}>
            <DialogTitle sx={{ mt: 2 }}>Refund Transaction:</DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <LoadingComponent message={"Processing..."} />
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>

                        <Stack direction="row" spacing={1} justifyContent="space-between">
                            <Box sx={{ width: '100%' }} >
                                <FormLabel>Subtotal</FormLabel>
                                <TextField fullWidth value={transactionToRefund.subtotal} disabled/>
                            </Box>

                            <Box sx={{ width: '100%' }} >
                                <FormLabel>Tax Total</FormLabel>
                                <TextField
                                    type="number"
                                    fullWidth
                                    value={transactionToRefund.taxTotal}
                                    disabled
                                    onChange={(e) => setTaxTotal(parseFloat(e.target.value))}
                                />
                            </Box>

                            <Box sx={{ width: '100%' }} >
                                <FormLabel>Grand Total</FormLabel>
                                <TextField fullWidth value={transactionToRefund.grandTotal} disabled/>
                            </Box>
                        </Stack>

                        <Table size="small" sx={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell><Typography variant="subtitle2">Variation</Typography></TableCell>
                                    <TableCell><Typography variant="subtitle2">Description</Typography></TableCell>
                                    <TableCell><Typography variant="subtitle2">Qty</Typography></TableCell>
                                    <TableCell><Typography variant="subtitle2">Unit Price</Typography></TableCell>
                                    <TableCell><Typography variant="subtitle2">Line Total</Typography></TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {transactionToRefund.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{buildItemName(item)}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{item.unitPrice}</TableCell>
                                        <TableCell>{item.lineTotal}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        <FormLabel>Refund Date</FormLabel>
                        <TextField
                            fullWidth
                            type="date"
                            value={dateStr}
                            onChange={(e) => setDateStr(e.target.value)}
                        />

                        <FormLabel>Notes</FormLabel>
                        <TextField
                            fullWidth
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={"Optional notes"}
                        />

                        <FormLabel>Deposit Account</FormLabel>
                        <Autocomplete
                            options={accountContext.accounts}
                            getOptionLabel={(opt: AccountJson) => opt.name}
                            getOptionKey={(opt: AccountJson) => opt.id}
                            value={counterPartyAccount}
                            onChange={(e, nv) => setCounterPartyAccount(nv)}
                            renderInput={(params) => <TextField {...params} fullWidth/>}
                            size="small"
                        />

                        <Stack direction="row" spacing={1} justifyContent="space-between">
                            <Box sx={{ width: '100%' }} >
                                <FormLabel>Refund Subtotal</FormLabel>
                                <TextField
                                    type={"number"}
                                    fullWidth
                                    value={subtotal}
                                    onChange={(e) => setSubtotal(parseFloat(e.target.value))}/>
                            </Box>

                            <Box sx={{ width: '100%' }} >
                                <FormLabel>Refund Tax Total</FormLabel>
                                <TextField
                                    type="number"
                                    fullWidth
                                    value={taxTotal}
                                    onChange={(e) => setTaxTotal(parseFloat(e.target.value))}
                                />
                            </Box>

                            <Box sx={{ width: '100%' }} >
                                <FormLabel>Refund Grand Total</FormLabel>
                                <TextField fullWidth value={grandTotal} disabled/>
                            </Box>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>{
                getActionButton(
                    ModalTypeEnum.ADD, // the modal type is driving the color of the button
                    processRefund,
                    `Refund Transaction`
                    )
                }
                <Button variant="outlined" onClick={emptyForm}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
}