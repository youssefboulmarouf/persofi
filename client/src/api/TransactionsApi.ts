import { TransactionJson } from "../model/PersofiModels";

// Prefer the server's explanation (e.g. a refund over the remaining amount) to a generic message.
const apiError = async (res: Response, fallback: string): Promise<Error> => {
    const body = await res.json().catch(() => null);
    return new Error(body?.message ?? fallback);
};

export const fetchTransactions = async (): Promise<TransactionJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions`);
    if (!res.ok) {
        console.log(res);
        throw new Error("Failed to fetch transactions");
    }
    return res.json();
};

export const createTransaction = async (
    transactionJson: TransactionJson,
): Promise<TransactionJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionJson),
    });
    if (!res.ok) {
        console.log(res);
        throw await apiError(res, "Failed to create transaction");
    }
    return res.json();
};

export const updateTransaction = async (transactionJson: TransactionJson): Promise<void> => {
    const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/transactions/${transactionJson.id}`,
        {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transactionJson),
        },
    );
    if (!res.ok) {
        console.log(res);
        throw await apiError(res, "Failed to update transaction");
    }
};

export const deleteTransaction = async (transactionJson: TransactionJson): Promise<void> => {
    const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/transactions/${transactionJson.id}`,
        {
            method: "DELETE",
        },
    );
    if (!res.ok) {
        console.log(res);
        throw new Error("Failed to delete transaction");
    }
};

export const processTransaction = async (transactionJson: TransactionJson): Promise<void> => {
    const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/transactions/${transactionJson.id}/process`,
        {
            method: "POST",
        },
    );
    if (!res.ok) {
        console.log(res);
        throw await apiError(res, "Failed to process transaction");
    }
};

export interface RefundableAmountJson {
    transactionId: number;
    grandTotal: number;
    refunded: number;
    remaining: number;
}

export const fetchRefundableAmount = async (
    transactionId: number,
): Promise<RefundableAmountJson> => {
    const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/transactions/${transactionId}/refundable`,
    );
    if (!res.ok) {
        console.log(res);
        throw await apiError(res, "Failed to fetch refundable amount");
    }
    return res.json();
};
