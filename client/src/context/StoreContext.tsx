
import {StoreJson} from "../model/PersofiModels";
import {createContext, FC, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {createStore, deleteStore, fetchStores, updateStore} from "../api/StoresApi";

export interface StoreContextValue {
    stores: StoreJson[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
    addStore: (store: StoreJson) => Promise<StoreJson | undefined>;
    editStore: (store: StoreJson) => void;
    removeStore: (store: StoreJson) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const useStoreContext = (): StoreContextValue => {
    const ctx = useContext(StoreContext);
    if (!ctx) {
        throw new Error("useStoreContext must be used within a StoreProvider");
    }
    return ctx;
};

export const StoreProvider: FC<{children: ReactNode}> = ({children}) => {
    const [stores, setStores] = useState<StoreJson[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchStores();
            setStores(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const addStore = async (store: StoreJson): Promise<StoreJson | undefined> => {
        try {
            const created = await createStore(store);
            await refresh();
            return created;
        } catch (err) {
            setError(err as Error);
            return undefined;
        }
    };

    const editStore = async (store: StoreJson) => {
        try {
            await updateStore(store);
            await refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const removeStore = async (store: StoreJson) => {
        try {
            await deleteStore(store);
            await refresh();
        } catch (err) {
            setError(err as Error);
        }
    };

    const value: StoreContextValue = useMemo(() => ({
        stores,
        loading,
        error,
        refresh,
        addStore,
        editStore,
        removeStore
    }), [stores, loading, error]);

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
