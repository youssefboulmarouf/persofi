import { createContext, FC, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { BrandJson } from "../model/PersofiModels";
import { createBrand, deleteBrand, fetchBrands, updateBrand } from "../api/BrandsApi";

export interface BrandContextValue {
    brands: BrandJson[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
    addBrand: (brand: BrandJson) => Promise<BrandJson | undefined>;
    editBrand: (brand: BrandJson) => void;
    removeBrand: (brand: BrandJson) => void;
}

const BrandContext = createContext<BrandContextValue | undefined>(undefined);

export const useBrandContext = (): BrandContextValue => {
    const ctx = useContext(BrandContext);
    if (!ctx) {
        throw new Error("useBrandContext must be used within a BrandProvider");
    }
    return ctx;
};

export const BrandProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [brands, setBrands] = useState<BrandJson[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchBrands();
            setBrands(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const addBrand = async (brand: BrandJson): Promise<BrandJson | undefined> => {
        try {
            const created = await createBrand(brand);
            refresh();
            return created;
        } catch (err) {
            setError(err as Error);
            return undefined;
        }
    };

    const editBrand = async (brand: BrandJson) => {
        try {
            await updateBrand(brand);
          refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const removeBrand = async (brand: BrandJson) => {
        try {
            await deleteBrand(brand);
            refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const value: BrandContextValue = useMemo(
        () => ({
            brands,
            loading,
            error,
            refresh,
            addBrand,
            editBrand,
            removeBrand,
        }),
        [brands, loading, error]
    );

    return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
};
