import { BrandJson } from "../model/PersofiModels";

export const fetchBrands = async (): Promise<BrandJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/brands`);
    if (!res.ok) {
        console.log(res);
        throw new Error("Failed to fetch brands");
    }
    return res.json();
};

export const createBrand = async (brand: BrandJson): Promise<BrandJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/brands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error("Failed to create brand");
    }
    return res.json();
};

export const updateBrand = async (brand: BrandJson): Promise<BrandJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/brands/${brand.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brand),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error("Failed to update brand");
    }
    return res.json();
};

export const deleteBrand = async (brand: BrandJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/brands/${brand.id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error("Failed to delete brand");
    }
};
