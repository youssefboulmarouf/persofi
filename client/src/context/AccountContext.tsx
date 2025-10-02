import {AccountJson} from "../model/PersofiModels";
import {createContext, FC, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {createAccount, deleteAccount, fetchAccounts, updateAccount} from "../api/AccountsApi";

export interface AccountContextValue {
    accounts: AccountJson[];
    loading: boolean;
    error: Error | null;
    refresh: () => void;
    addAccount: (account: AccountJson) => Promise<AccountJson | undefined>;
    editAccount: (account: AccountJson) => void;
    removeAccount: (account: AccountJson) => void;
}

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

export const useAccountContext = (): AccountContextValue => {
    const context = useContext(AccountContext);
    if (context === undefined) {
        throw new Error("useAccountContext must be used within a AccountProvider");
    }
    return context;
}

export const AccountProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [accounts, setAccounts] = useState<AccountJson[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null);

    const addAccount = async (account: AccountJson): Promise<AccountJson | undefined> => {
        setLoading(true);
        setError(null);

        let accountJson = undefined;
        try {
            accountJson = await createAccount(account);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }

        await refresh();

        return accountJson;
    }

    const editAccount = async (account: AccountJson) => {
        setLoading(true);
        setError(null);

        try {
            await updateAccount(account);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }

        await refresh();
    }

    const removeAccount = async (account: AccountJson) => {
        setLoading(true);
        setError(null);

        try {
            await deleteAccount(account);
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
            const data = await fetchAccounts();
            setAccounts(data);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
    }, []);

    const value: AccountContextValue = useMemo(() => ({
        accounts,
        loading,
        error,
        refresh,
        addAccount,
        editAccount,
        removeAccount
    }), [accounts, loading, error]);

    return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}