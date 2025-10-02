import {AccountJson} from "../model/PersofiModels";

export const fetchAccounts = async (): Promise<AccountJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/accounts`);
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to fetch account');
    }
    return res.json();
}

export const createAccount = async (accountJson: AccountJson): Promise<AccountJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to create account');
    }
    return res.json();
};

export const updateAccount = async (accountJson: AccountJson): Promise<AccountJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/accounts/${accountJson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(accountJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to update account');
    }
    return res.json();
};

export const deleteAccount = async (accountJson: AccountJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/accounts/${accountJson.id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to delete account');
    }
};