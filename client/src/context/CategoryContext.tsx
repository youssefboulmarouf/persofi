
import {CategoryJson} from "../model/PersofiModels";
import {createContext, FC, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {createCategory, deleteCategory, fetchCategories, updateCategory} from "../api/CategoriesApi";

export interface CategoryContextValue {
    categories: CategoryJson[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
    addCategory: (category: CategoryJson) => Promise<CategoryJson | undefined>;
    editCategory: (category: CategoryJson) => void;
    removeCategory: (category: CategoryJson) => void;
}

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined);

export const useCategoryContext = (): CategoryContextValue => {
    const ctx = useContext(CategoryContext);
    if (!ctx) {
        throw new Error("useCategoryContext must be used within a CategoryProvider");
    }
    return ctx;
};

export const CategoryProvider: FC<{children: ReactNode}> = ({children}) => {
    const [categories, setCategories] = useState<CategoryJson[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchCategories();
            setCategories(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const addCategory = async (category: CategoryJson): Promise<CategoryJson | undefined> => {
        try {
            const created = await createCategory(category);
            await refresh();
            return created;
        } catch (err) {
            setError(err as Error);
            return undefined;
        }
    };

    const editCategory = async (category: CategoryJson) => {
        try {
            await updateCategory(category);
            await refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const removeCategory = async (category: CategoryJson) => {
        try {
            await deleteCategory(category);
            await refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const value: CategoryContextValue = useMemo(() => ({
        categories,
        loading,
        error,
        refresh,
        addCategory,
        editCategory,
        removeCategory
    }), [categories, loading, error]);

    return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}
