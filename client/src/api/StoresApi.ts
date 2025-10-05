
import {StoreJson} from "../model/PersofiModels";

export const fetchStores = async (): Promise<StoreJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/stores`);
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to fetch stores');
    }
    return res.json();
}

export const createStore = async (storeJson: StoreJson): Promise<StoreJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/stores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to create store');
    }
    return res.json();
};

export const updateStore = async (storeJson: StoreJson): Promise<StoreJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/stores/${storeJson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(storeJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to update store');
    }
    return res.json();
};

export const deleteStore = async (storeJson: StoreJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/stores/${storeJson.id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to delete store');
    }
};
