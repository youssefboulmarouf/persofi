import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBalances, deleteBalance } from "../api/BalancesApi";

export const useBalances = () => {
    return useQuery({
        queryKey: ["balances"],
        queryFn: fetchBalances,
    });
};

export const useDeleteBalance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBalance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["balances"] });
        },
    });
};
