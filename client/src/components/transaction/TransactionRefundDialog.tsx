import {
    AccountJson,
    ModalTypeEnum,
    ProductJson,
    TransactionItemJson,
    TransactionJson,
    TransactionTypeEnum,
} from "../../model/PersofiModels";
import {
    useAddTransaction,
    useProcessTransaction,
    useRefundableAmount,
    useUpdateTransaction,
} from "../../hooks/useTransactions";
import React, { FC, useEffect, useState } from "react";
import {
    Alert,
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
    TextField,
} from "@mui/material";
import Typography from "@mui/material/Typography";
import FormLabel from "../common/FormLabel";
import Box from "@mui/material/Box";
import LoadingComponent from "../common/LoadingComponent";
import { getActionButton } from "../common/Utilities";
import Button from "@mui/material/Button";

interface TransactionRefundDialogProps {
    transactionToRefund: TransactionJson;
    openDialog: boolean;
    closeDialog: () => void;
    accounts: AccountJson[];
    products: ProductJson[];
}

export const TransactionRefundDialog: FC<TransactionRefundDialogProps> = ({
    transactionToRefund,
    openDialog,
    closeDialog,
    accounts,
    products,
}) => {
    const { mutateAsync: addTransaction } = useAddTransaction();
    const { mutateAsync: processTx } = useProcessTransaction();
    const { mutateAsync: updateTx } = useUpdateTransaction();
    const [dateStr, setDateStr] = useState<string>("");
    const [notes, setNotes] = useState<string>("");
    const [counterPartyAccount, setCounterPartyAccount] = useState<AccountJson | null>(null);
    const [subtotal, setSubtotal] = useState<number>(0);
    const [taxTotal, setTaxTotal] = useState<number>(0);
    const [grandTotal, setGrandTotal] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // A draft saved by an earlier attempt whose processing failed; retries update it instead
    // of creating another draft.
    const [savedDraftId, setSavedDraftId] = useState<number | null>(null);
    // The backend is authoritative; this only caps the input for fast feedback.
    const {
        data: refundable,
        error: refundableError,
        isFetching: refundableFetching,
        refetch: refetchRefundable,
    } = useRefundableAmount(transactionToRefund.id, openDialog && transactionToRefund.processed);
    const exceedsRemaining = refundable !== undefined && grandTotal > refundable.remaining;

    // Why the refund can't be submitted yet; shown next to the disabled button.
    const blockedReason = (): string | null => {
        if (!transactionToRefund.processed) return "Only a processed expense can be refunded.";
        if (refundableError) return null; // reported separately, with a retry
        if (refundable === undefined) return "Loading the remaining refundable amount…";
        if (counterPartyAccount === null)
            return "The account this expense was paid from is not available.";
        if (!(grandTotal > 0)) return "Enter a refund amount greater than 0.";
        if (subtotal > transactionToRefund.subtotal)
            return "The refund subtotal can't exceed the original subtotal.";
        if (taxTotal > transactionToRefund.taxTotal)
            return "The refund tax can't exceed the original tax.";
        if (exceedsRemaining)
            return `The refund exceeds the remaining refundable amount (${refundable.remaining}).`;
        return null;
    };
    const blocked = refundableError !== null || blockedReason() !== null;

    const buildItemName = (item: TransactionItemJson): string => {
        if (!item.variantId) return "—";
        const variant = products
            .flatMap((pr) => pr.variants || [])
            .find((vr) => vr.id === item.variantId);
        if (!variant) return "—";
        const product = products.find((pr) => pr.id === variant.productId);
        if (!product) return "—";
        return `${product.name} (${variant.unitSize} ${variant.unitType})`;
    };

    useEffect(() => {
        setDateStr(new Date().toISOString().slice(0, 10));
        setCounterPartyAccount(
            accounts.find((a) => a.id === transactionToRefund.payAccountId) ?? null,
        );
    }, [openDialog, transactionToRefund, accounts]);

    const emptyForm = () => {
        setDateStr(new Date().toISOString().slice(0, 10));
        setCounterPartyAccount(null);
        setNotes("");
        setSubtotal(0);
        setTaxTotal(0);
        setGrandTotal(0);
        setErrorMessage(null);
        setSavedDraftId(null);

        closeDialog();
    };

    const processRefund = async () => {
        if (blocked || counterPartyAccount === null) return;

        setIsLoading(true);
        setErrorMessage(null);
        let draftId = savedDraftId;
        try {
            const refundTx: TransactionJson = {
                id: draftId ?? 0,
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
                amount: 0,
            };
            if (draftId === null) {
                draftId = (await addTransaction(refundTx)).id;
                setSavedDraftId(draftId);
            } else {
                await updateTx(refundTx);
            }
            await processTx({ ...refundTx, id: draftId });
            emptyForm();
        } catch (error) {
            const reason = error instanceof Error ? error.message : String(error);
            setErrorMessage(
                draftId === null
                    ? `Refund not saved: ${reason}`
                    : `Refund draft #${draftId} was saved but not processed: ${reason}. ` +
                          `Retrying updates that draft; you can also process or delete it ` +
                          `from the transactions list.`,
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const newGrand = (subtotal || 0) + (taxTotal || 0);
        setGrandTotal(parseFloat(newGrand.toFixed(2)));
    }, [subtotal, taxTotal]);

    return (
        <Dialog
            open={openDialog}
            onClose={() => emptyForm()}
            PaperProps={{ sx: { width: "900px", maxWidth: "900px" } }}
        >
            <DialogTitle sx={{ mt: 2 }}>Refund Transaction:</DialogTitle>

            <DialogContent>
                {isLoading ? (
                    <LoadingComponent message={"Processing..."} />
                ) : (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
                        {refundableError && (
                            <Alert
                                severity="error"
                                action={
                                    <Button
                                        color="inherit"
                                        size="small"
                                        disabled={refundableFetching}
                                        onClick={() => refetchRefundable()}
                                    >
                                        Retry
                                    </Button>
                                }
                            >
                                Couldn't load the remaining refundable amount:{" "}
                                {refundableError.message}
                            </Alert>
                        )}
                        <Stack direction="row" spacing={1} justifyContent="space-between">
                            <Box sx={{ width: "100%" }}>
                                <FormLabel>Subtotal</FormLabel>
                                <TextField
                                    fullWidth
                                    value={transactionToRefund.subtotal}
                                    disabled
                                />
                            </Box>

                            <Box sx={{ width: "100%" }}>
                                <FormLabel>Tax Total</FormLabel>
                                <TextField
                                    type="number"
                                    fullWidth
                                    value={transactionToRefund.taxTotal}
                                    disabled
                                    onChange={(e) => setTaxTotal(parseFloat(e.target.value))}
                                />
                            </Box>

                            <Box sx={{ width: "100%" }}>
                                <FormLabel>Grand Total</FormLabel>
                                <TextField
                                    fullWidth
                                    value={transactionToRefund.grandTotal}
                                    disabled
                                />
                            </Box>
                        </Stack>

                        <Table size="small" sx={{ backgroundColor: "rgba(0,0,0,0.02)" }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <Typography variant="subtitle2">Variation</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">Description</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">Qty</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">Unit Price</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2">Line Total</Typography>
                                    </TableCell>
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
                        {/* A refund always goes back to the account that was charged. */}
                        <Autocomplete
                            disabled
                            options={accounts}
                            getOptionLabel={(opt: AccountJson) => opt.name}
                            getOptionKey={(opt: AccountJson) => opt.id}
                            value={counterPartyAccount}
                            onChange={(e, nv) => setCounterPartyAccount(nv)}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                            size="small"
                        />

                        <Stack direction="row" spacing={1} justifyContent="space-between">
                            <Box sx={{ width: "100%" }}>
                                <FormLabel>Refund Subtotal</FormLabel>
                                <TextField
                                    type={"number"}
                                    fullWidth
                                    value={subtotal}
                                    onChange={(e) => setSubtotal(parseFloat(e.target.value))}
                                />
                            </Box>

                            <Box sx={{ width: "100%" }}>
                                <FormLabel>Refund Tax Total</FormLabel>
                                <TextField
                                    type="number"
                                    fullWidth
                                    value={taxTotal}
                                    onChange={(e) => setTaxTotal(parseFloat(e.target.value))}
                                />
                            </Box>

                            <Box sx={{ width: "100%" }}>
                                <FormLabel>Refund Grand Total</FormLabel>
                                <TextField
                                    fullWidth
                                    value={grandTotal}
                                    disabled
                                    error={exceedsRemaining}
                                    helperText={
                                        refundable
                                            ? `Remaining refundable: ${refundable.remaining} of ${refundable.grandTotal}`
                                            : " "
                                    }
                                />
                            </Box>
                        </Stack>
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                {!isLoading && blockedReason() && (
                    <Typography variant="body2" color="text.secondary" sx={{ mr: "auto", ml: 2 }}>
                        {blockedReason()}
                    </Typography>
                )}
                {getActionButton(
                    ModalTypeEnum.ADD, // the modal type is driving the color of the button
                    processRefund,
                    `Refund Transaction`,
                    blocked || isLoading,
                )}
                <Button variant="outlined" onClick={emptyForm}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};
