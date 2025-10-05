import {ProductJson, ProductVariantJson} from "../model/PersofiModels";

export const fetchProducts = async (): Promise<ProductJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products`);
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to fetch products');
    }
    return res.json();
}

export const createProduct = async (product: ProductJson): Promise<ProductJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to create product');
    }
    return res.json();
};

export const updateProduct = async (product: ProductJson): Promise<ProductJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to update product');
    }
    return res.json();
};

export const deleteProduct = async (product: ProductJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/products/${product.id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to delete product');
    }
};

// Variants
export const fetchVariants = async (): Promise<ProductVariantJson[]> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/variants`);
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to fetch products');
    }
    return res.json();
}

export const createProductVariant = async (variant: ProductVariantJson): Promise<ProductVariantJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variant),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to create product variant');
    }
    return res.json();
};

export const updateProductVariant = async (variant: ProductVariantJson): Promise<ProductVariantJson> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/variants/${variant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variant),
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to update product variant');
    }
    return res.json();
};

export const deleteProductVariant = async (variant: ProductVariantJson): Promise<void> => {
    const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/variants/${variant.id}`, {
        method: "DELETE",
    });
    if (!res.ok) {
        console.log(res);
        throw new Error('Failed to delete product variant');
    }
};
