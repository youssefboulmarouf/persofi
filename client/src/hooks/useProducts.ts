import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchProducts, fetchVariants, createProduct, updateProduct, deleteProduct, createProductVariant, updateProductVariant, deleteProductVariant } from "../api/ProductsApi";
import { ProductJson } from "../model/PersofiModels";

export const useProducts = () => {
    return useQuery({
        queryKey: ["products"],
        queryFn: async () => {
            const [products, variants] = await Promise.all([
                fetchProducts(),
                fetchVariants()
            ]);
            
            return products.map(pr => ({
                ...pr,
                variants: variants.filter(vr => vr.productId === pr.id)
            })) as ProductJson[];
        },
    });
};

export const useAddProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
};

export const useUpdateProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
};

export const useDeleteProduct = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
};

export const useAddVariant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createProductVariant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
};

export const useUpdateVariant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateProductVariant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
};

export const useDeleteVariant = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteProductVariant,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
        },
    });
};
