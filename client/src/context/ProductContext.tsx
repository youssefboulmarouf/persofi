import {ProductJson, ProductVariantJson} from "../model/PersofiModels";
import {createContext, FC, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {
    createProduct,
    createProductVariant,
    deleteProduct, deleteProductVariant,
    fetchProducts, fetchVariants,
    updateProduct,
    updateProductVariant
} from "../api/ProductsApi";

export interface ProductContextValue {
    products: ProductJson[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
    addProduct: (product: ProductJson) => Promise<ProductJson | undefined>;
    editProduct: (product: ProductJson) => void;
    removeProduct: (product: ProductJson) => void;
    addVariant: (variant: ProductVariantJson) => void;
    editVariant: (variant: ProductVariantJson) => void;
    removeVariant: (variant: ProductVariantJson) => void;
}

const ProductContext = createContext<ProductContextValue | undefined>(undefined);

export const useProductContext = (): ProductContextValue => {
    const ctx = useContext(ProductContext);
    if (!ctx) {
        throw new Error("useProductContext must be used within a ProductProvider");
    }
    return ctx;
};

export const ProductProvider: FC<{children: ReactNode}> = ({children}) => {
    const [products, setProducts] = useState<ProductJson[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const variants = await fetchVariants();
            const products = await fetchProducts();
            products.forEach(pr => {
                pr.variants = variants.filter(vr => vr.productId == pr.id)
            })
            setProducts(products);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const addProduct = async (product: ProductJson): Promise<ProductJson | undefined> => {
        try {
            const created = await createProduct(product);
            refresh();
            return created;
        } catch (err) {
            setError(err as Error);
            return undefined;
        }
    };

    const editProduct = async (product: ProductJson) => {
        try {
            await updateProduct(product);
            refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const removeProduct = async (product: ProductJson) => {
        try {
            await deleteProduct(product);
            refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const addVariant = async (variant: ProductVariantJson) => {
        try {
            await createProductVariant(variant);
            refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const editVariant = async (variant: ProductVariantJson) => {
        try {
            await updateProductVariant(variant);
            refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const removeVariant = async (variant: ProductVariantJson) => {
        try {
            await deleteProductVariant(variant);
            refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const value: ProductContextValue = useMemo(() => ({
        products,
        loading,
        error,
        refresh,
        addProduct,
        editProduct,
        removeProduct,
        addVariant,
        editVariant,
        removeVariant
    }), [products, loading, error]);

    return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}
