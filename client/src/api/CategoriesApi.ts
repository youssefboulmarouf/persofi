
import {CategoryJson} from "../model/PersofiModels";

export const fetchCategories = async (): Promise<CategoryJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/categories`);
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to fetch category');
    }
    return res.json();
}

export const createCategory = async (categoryJson: CategoryJson): Promise<CategoryJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to create category');
    }
    return res.json();
};

export const updateCategory = async (categoryJson: CategoryJson): Promise<CategoryJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/categories/${categoryJson.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryJson),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to update category');
    }
    return res.json();
};

export const deleteCategory = async (categoryJson: CategoryJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/categories/${categoryJson.id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to delete category');
    }
};
