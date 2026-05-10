import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAccounts, createAccount, updateAccount, deleteAccount } from "../api/AccountsApi";
import { AccountJson } from "../model/PersofiModels";

export const useAccounts = () => {
    return useQuery({
        queryKey: ["accounts"],
        queryFn: fetchAccounts,
    });
};

export const useAddAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });
};

export const useUpdateAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });
};

export const useDeleteAccount = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] });
        },
    });
};
