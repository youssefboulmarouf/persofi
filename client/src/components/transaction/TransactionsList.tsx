import React, {Fragment, useState} from "react";
import Typography from "@mui/material/Typography";
import {Collapse, IconButton, Table, TableBody, TableCell, TableHead, TableRow} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import EditButton from "../common/buttons/EditButton";
import DeleteButton from "../common/buttons/DeleteButton";
import {usePaginationController} from "../common/usePaginationController";
import Pagination from "../common/Pagination";
import LoadingComponent from "../common/LoadingComponent";
import {
    AccountJson,
    ModalTypeEnum,
    ProductJson,
    TransactionItemJson,
    TransactionJson,
    TransactionTypeEnum
} from "../../model/PersofiModels";
import RefundExpenseButton from "../common/buttons/RefundExpenseButton";
import ProcessTransactionButton from "../common/buttons/ProcessTransactionButton";

interface TransactionsListProps {
    transactions: TransactionJson[];
    products: ProductJson[];
    accounts: AccountJson[];
    openTransactionDialogWithType: (type: ModalTypeEnum, transaction: TransactionJson) => void;
    openRefundTransactionDialog: (type: ModalTypeEnum, transaction: TransactionJson) => void;
    processTransaction: (tx: TransactionJson) => void;
    isLoading: boolean;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
    transactions,
    products,
    accounts,
    openTransactionDialogWithType,
    openRefundTransactionDialog,
    processTransaction,
    isLoading
}) => {
    const paginationController = usePaginationController<TransactionJson>(transactions);
    const [openRows, setOpenRows] = useState<Record<number, boolean>>({});

    if (isLoading) return <LoadingComponent message="Loading Transactions and Items" />;
    if (transactions.length === 0) return <Typography>No Transaction Found</Typography>;

    const toggleRow = (id: number) => setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));

    const buildItemName = (item: TransactionItemJson): string => {
        const variant = products.flatMap(pr => pr.variants).find(vr => vr.id === item.variantId);
        const product =  products.find(pr => pr.id === variant?.productId)
        return (product?.name + " (" + variant?.unitSize + " " + variant?.unitType + ")");
    }

    const onSync = (tx: TransactionJson) => {
        // As requested: just console.log for now
        processTransaction(tx);
        console.log("Process (sync) transaction (NOT SUPPORTED YET):", tx.id);
    };

    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell />
                    <TableCell><Typography variant="h6" fontSize="14px">Id</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Date</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Type</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Notes</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Source Account</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Destination Account</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Processed</Typography></TableCell>
                    <TableCell><Typography variant="h6" fontSize="14px">Total</Typography></TableCell>
                    <TableCell align="right"><Typography variant="h6" fontSize="14px">Actions</Typography></TableCell>
                </TableRow>
            </TableHead>

            <TableBody>
                {paginationController.data.map((tx) => (
                    <Fragment key={tx.id}>
                        <TableRow>
                            <TableCell>
                                <IconButton size="small" onClick={() => toggleRow(tx.id)}>
                                    {openRows[tx.id] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                </IconButton>
                            </TableCell>
                            <TableCell>{tx.id}</TableCell>
                            <TableCell>{new Date(tx.date).toLocaleDateString()}</TableCell>
                            <TableCell>{
                                tx.type === TransactionTypeEnum.REFUND
                                    ? `${tx.type} [${tx.refundOfId}]`
                                    : tx.type
                            }</TableCell>
                            <TableCell>{tx.notes}</TableCell>
                            <TableCell>{
                                tx.payAccountId != null
                                    ? accounts.find(a => a.id === tx.payAccountId)?.accountType
                                    : "-"
                            }</TableCell>
                            <TableCell>{
                                tx.counterpartyAccountId != null
                                    ? accounts.find(a => a.id === tx.counterpartyAccountId)?.accountType
                                    : "-"
                            }</TableCell>
                            <TableCell>
                                <IconButton color={tx.processed ? "success" : "error"}>
                                    {tx.processed ? (
                                        <CheckIcon width={22} />
                                    ) : (
                                        <ClearIcon width={22} />
                                    )}
                                </IconButton>
                            </TableCell>

                            <TableCell>{(tx.grandTotal === 0) ? tx.amount : tx.grandTotal}</TableCell>

                            <TableCell align="right">
                                {tx.type === TransactionTypeEnum.EXPENSE
                                    ? (
                                        <RefundExpenseButton
                                            tooltipText={"Refund Transaction"}
                                            openDialogWithType={() => openRefundTransactionDialog(ModalTypeEnum.ADD, tx)}
                                        />
                                    ) : ('')
                                }

                                {!tx.processed
                                    ? (
                                        <ProcessTransactionButton
                                            tooltipText={"Process transaction"}
                                            openDialogWithType={() => onSync(tx)}/>
                                    ) : ('')
                                }

                                <EditButton
                                    tooltipText={"Edit Transaction"}
                                    openDialogWithType={() => openTransactionDialogWithType(ModalTypeEnum.UPDATE, tx)}
                                />
                                <DeleteButton
                                    tooltipText={"Delete Transaction"}
                                    openDialogWithType={() => openTransactionDialogWithType(ModalTypeEnum.DELETE, tx)}
                                />
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                                <Collapse in={openRows[tx.id]} timeout="auto" unmountOnExit>
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
                                            {(tx.items ?? []).map((item) => (
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
                                </Collapse>
                            </TableCell>
                        </TableRow>
                    </Fragment>
                ))}
            </TableBody>

            <Pagination paginationController={paginationController} />
        </Table>
    );
};
