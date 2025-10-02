import {BalanceJson} from "../model/PersofiModels";

export const fetchBalances = async (): Promise<BalanceJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/balances`);
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to fetch balances');
    }
    return res.json();
}

export const deleteBalance = async (balanceJson: BalanceJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/balances/${balanceJson.id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to delete balance');
    }
};