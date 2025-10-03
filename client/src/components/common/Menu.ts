import {uniqueId} from "lodash";

export interface Menu {
    id: string;
    title: string;
    href: string;
}

export const appMenuItems: Menu[] = [
    {
        id: uniqueId(),
        title: "Dashboard",
        href: "/",
    }
];

export const transactionMenuItems: Menu[] = [
    {
        id: uniqueId(),
        title: "Transactions",
        href: "/transactions"
    }
];

export const financeMenuItems: Menu[] = [
    {
        id: uniqueId(),
        title: "Accounts",
        href: "/accounts"
    }
];

export const peopleMenuItems: Menu[] = [
    {
        id: uniqueId(),
        title: "Persons",
        href: "/persons"
    }
];

export const catalogMenuItems: Menu[] = [
    {
        id: uniqueId(),
        title: "Categories",
        href: "/categories"
    },{
        id: uniqueId(),
        title: "Products",
        href: "/products"
    },{
        id: uniqueId(),
        title: "Brands",
        href: "/brands"
    }
];

export const storeMenuItems: Menu[] = [
    {
        id: uniqueId(),
        title: "Stores",
        href: "/stores"
    }
];

export interface ProfileType {
    href: string;
    title: string;
    subtitle: string;
    icon: string;
}

export const profileMenuItem: ProfileType[] = [
    {
        href: "/",
        title: "My Profile",
        subtitle: "Account Settings",
        icon: ""
    }
];