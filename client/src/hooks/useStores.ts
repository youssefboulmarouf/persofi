import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStores, createStore, updateStore, deleteStore } from "../api/StoresApi";

export const useStores = () => {
    return useQuery({
        queryKey: ["stores"],
        queryFn: fetchStores,
    });
};

export const useAddStore = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createStore,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stores"] });
        },
    });
};

export const useUpdateStore = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateStore,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stores"] });
        },
    });
};

export const useDeleteStore = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteStore,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["stores"] });
        },
    });
};
