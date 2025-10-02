import {BalanceJson} from "../model/PersofiModels";
import {createContext, FC, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {deleteBalance, fetchBalances} from "../api/BalancesApi";

export interface BalanceContextValue {
    balances: BalanceJson[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
    removeBalance: (account: BalanceJson) => void;
}

const BalanceContext = createContext<BalanceContextValue | undefined>(undefined);

export const useBalanceContext = (): BalanceContextValue => {
    const context = useContext(BalanceContext);
    if (context === undefined) {
        throw new Error("useBalanceContext must be used within a BalanceProvider");
    }
    return context;
}

export const BalanceProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [balances, setBalances] = useState<BalanceJson[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const removeBalance = async (account: BalanceJson) => {
        setLoading(true);
        setError(null);

        try {
            await deleteBalance(account);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }

        await refresh();
    }

    const refresh = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchBalances();
            setBalances(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const value: BalanceContextValue = useMemo(() => ({
        balances,
        loading,
        error,
        refresh,
        removeBalance
    }), [balances, loading, error]);

    return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>;
}