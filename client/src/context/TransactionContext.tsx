import {TransactionJson} from "../model/PersofiModels";
import {createContext, useContext, useEffect, useMemo, useState} from "react";
import {createTransaction, deleteTransaction, fetchTransactions, updateTransaction} from "../api/TransactionsApi";

export interface TransactionContextValue {
    transactions: TransactionJson[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
    addTransaction: (transaction: TransactionJson) => Promise<TransactionJson | undefined>;
    editTransaction: (transaction: TransactionJson) => void;
    removeTransaction: (transaction: TransactionJson) => void;
    processTransaction: (transaction: TransactionJson) => void;
}

const TransactionContext = createContext<TransactionContextValue | undefined>(undefined);

export const useTransactionContext = (): TransactionContextValue => {
    const context = useContext(TransactionContext);
    if (context === undefined) {
        throw new Error("useTransactionContext must be used within a TransactionProvider");
    }
    return context;
}

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [transactions, setTransactions] = useState<TransactionJson[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const processTransaction = async (transaction: TransactionJson) => {
        setLoading(true);
        setError(null);

        try {
            await processTransaction(transaction);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }

        await refresh();
    }

    const addTransaction = async (transaction: TransactionJson): Promise<TransactionJson | undefined> => {
        setLoading(true);
        setError(null);

        let transactionJson = undefined;
        try {
            transactionJson = await createTransaction(transaction);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }

        await refresh();

        return transactionJson;
    }

    const editTransaction = async (transaction: TransactionJson) => {
        setLoading(true);
        setError(null);

        try {
            await updateTransaction(transaction);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }

        await refresh();
    }

    const removeTransaction = async (transaction: TransactionJson) => {
        setLoading(true);
        setError(null);

        try {
            await deleteTransaction(transaction);
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
            const data = await fetchTransactions();
            setTransactions(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
    }, []);

    const value: TransactionContextValue = useMemo(() => ({
        transactions,
        loading,
        error,
        refresh,
        addTransaction,
        editTransaction,
        removeTransaction,
        processTransaction
    }), [transactions, loading, error]);

    return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>;
}
