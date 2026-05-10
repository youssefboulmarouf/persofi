import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBrands, createBrand, updateBrand, deleteBrand } from "../api/BrandsApi";

export const useBrands = () => {
    return useQuery({
        queryKey: ["brands"],
        queryFn: fetchBrands,
    });
};

export const useAddBrand = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
    });
};

export const useUpdateBrand = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
    });
};

export const useDeleteBrand = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteBrand,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["brands"] });
        },
    });
};
