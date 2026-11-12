import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    processTransaction,
    fetchRefundableAmount,
} from "../api/TransactionsApi";

export const useTransactions = () => {
    return useQuery({
        queryKey: ["transactions"],
        queryFn: fetchTransactions,
    });
};

export const useRefundableAmount = (transactionId: number, enabled: boolean) => {
    return useQuery({
        queryKey: ["transactions", transactionId, "refundable"],
        queryFn: () => fetchRefundableAmount(transactionId),
        enabled,
    });
};

export const useAddTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
    });
};

export const useUpdateTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
    });
};

export const useDeleteTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
        },
    });
};

export const useProcessTransaction = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: processTransaction,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
            queryClient.invalidateQueries({ queryKey: ["balances"] });
        },
    });
};
