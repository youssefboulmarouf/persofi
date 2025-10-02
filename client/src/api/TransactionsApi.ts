import {TransactionJson} from "../model/PersofiModels";


export const fetchTransactions = async (): Promise<TransactionJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions`);
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to fetch transactions');
    }
    return res.json();
}

export const createTransaction = async (transactionJson: TransactionJson): Promise<TransactionJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to create transaction');
    }
    return res.json();
};

export const updateTransaction = async (transactionJson: TransactionJson): Promise<TransactionJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions/${transactionJson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to update transaction');
    }
    return res.json();
};

export const deleteTransaction = async (transactionJson: TransactionJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions/${transactionJson.id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to delete transaction');
    }
};

export const processTransaction = async (transactionJson: TransactionJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions/${transactionJson.id}/process`, {
        method: "POST",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to process transaction');
    }
};