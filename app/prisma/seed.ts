import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    // 1) Accounts
    await prisma.account.createMany({
        data: [
            { name: "RBC - Debit",  currentBalance: 0, accountType: "Debit" },
            { name: "RBC - Credit", currentBalance: 0, accountType: "Credit" },
            { name: "Pocket Money", currentBalance: 0, accountType: "Cash" },
            { name: "Saving Account Morocco", currentBalance: 0, accountType: "Debit" },
        ],
        skipDuplicates: true,
    });

    // 2) Parent categories
    const parentNames = [
        "Groceries", "Shopping", "Household", "Transport",
        "Health", "Dining & Leisure", "Other",
    ];
    await prisma.category.createMany({
        data: parentNames.map(name => ({ name })),
        skipDuplicates: true,
    });

    // map parent IDs
    const parents = await prisma.category.findMany({
        where: { name: { in: parentNames } },
        select: { id: true, name: true },
    });
    const byName = Object.fromEntries(parents.map(c => [c.name, c.id]));

    // 3) Children under parents
    const children: Array<{ name: string; parent: string }> = [
        { name: "Dairy", parent: "Groceries" },
        { name: "Vegetables", parent: "Groceries" },
        { name: "Fruits", parent: "Groceries" },
        { name: "Meat & Poultry", parent: "Groceries" },
        { name: "Fish & Seafood", parent: "Groceries" },
        { name: "Grains & Pasta", parent: "Groceries" },
        { name: "Bread & Bakery", parent: "Groceries" },
        { name: "Beverages", parent: "Groceries" },
        { name: "Snacks & Sweets", parent: "Groceries" },
        { name: "Condiments & Spices", parent: "Groceries" },
        { name: "Cleaning", parent: "Household" },
        { name: "Kitchen Supplies", parent: "Household" },
        { name: "Toiletries & Hygiene", parent: "Household" },
        { name: "Paper Goods", parent: "Household" },
        { name: "Baby Care", parent: "Household" },
        { name: "Public Transport", parent: "Transport" },
        { name: "Medicine", parent: "Health" },
        { name: "Vitamins & Supplements", parent: "Health" },
        { name: "Restaurants & Cafés", parent: "Dining & Leisure" },
        { name: "Entertainment", parent: "Dining & Leisure" },
        { name: "Clothing", parent: "Shopping" },
        { name: "Electronics", parent: "Shopping" },
        { name: "Miscellaneous", parent: "Other" },
    ];

    await prisma.category.createMany({
        data: children.map(c => ({
            name: c.name,
            parentCategoryId: byName[c.parent],
        })),
        skipDuplicates: true,
    });

    // 4) People
    await prisma.person.createMany({
        data: [
            { name: "Youssef" },
            { name: "Nour El Houda" },
            { name: "Aya" },
            { name: "Family" },
            { name: "Mehdi" },
        ],
        skipDuplicates: true,
    });

    // 5) Stores
    await prisma.store.createMany({
        data: [
            { name: "Dollarama" },
            { name: "SuperC" },
            { name: "Jean Coutu" },
            { name: "Costco" },         // fixed spelling
            { name: "Atlas" },
            { name: "Metro" },
            { name: "Depanneur" },      // fixed spelling
        ],
        skipDuplicates: true,
    });

    // 6) Products (look up category IDs you need)
    const leafs = await prisma.category.findMany({
        where: { name: { in: ["Dairy","Vegetables","Fruits","Meat & Poultry","Grains & Pasta","Bread & Bakery","Beverages","Condiments & Spices","Cleaning","Toiletries & Hygiene","Baby Care"] } },
        select: { id: true, name: true },
    });
    const cat = Object.fromEntries(leafs.map(c => [c.name, c.id]));

    await prisma.product.createMany({
        data: [
            { name: "Milk",              categoryId: cat["Dairy"] },
            { name: "Yogurt",            categoryId: cat["Dairy"] },
            { name: "Cheese",            categoryId: cat["Dairy"] },
            { name: "Potatoes",          categoryId: cat["Vegetables"] },
            { name: "Tomatoes",          categoryId: cat["Vegetables"] },
            { name: "Onions",            categoryId: cat["Vegetables"] },
            { name: "Carrots",           categoryId: cat["Vegetables"] },
            { name: "Bananas",           categoryId: cat["Fruits"] },
            { name: "Apples",            categoryId: cat["Fruits"] },
            { name: "Oranges",           categoryId: cat["Fruits"] },
            { name: "Chicken",           categoryId: cat["Meat & Poultry"] },
            { name: "Beef",              categoryId: cat["Meat & Poultry"] },
            { name: "Rice",              categoryId: cat["Grains & Pasta"] },
            { name: "Pasta",             categoryId: cat["Grains & Pasta"] },
            { name: "Baguette",          categoryId: cat["Bread & Bakery"] },
            { name: "Water",             categoryId: cat["Beverages"] },
            { name: "Coffee",            categoryId: cat["Beverages"] },
            { name: "Juice",             categoryId: cat["Beverages"] },
            { name: "Olive Oil",         categoryId: cat["Condiments & Spices"] },
            { name: "Salt",              categoryId: cat["Condiments & Spices"] },
            { name: "Sugar",             categoryId: cat["Condiments & Spices"] },
            { name: "Dish Soap",         categoryId: cat["Cleaning"] },
            { name: "Laundry Detergent", categoryId: cat["Cleaning"] },
            { name: "Surface Cleaner",   categoryId: cat["Cleaning"] }, // fixed category
            { name: "Shampoo",           categoryId: cat["Toiletries & Hygiene"] },
            { name: "Soap Bar",          categoryId: cat["Toiletries & Hygiene"] },
            { name: "Toothpaste",        categoryId: cat["Toiletries & Hygiene"] },
            { name: "Diapers",           categoryId: cat["Baby Care"] },
            { name: "Baby Wipes",        categoryId: cat["Baby Care"] },
        ],
        skipDuplicates: true,
    });
}

main()
    .then(() => console.log("Seeding completed successfully!"))
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
