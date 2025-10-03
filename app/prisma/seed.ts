import { PrismaClient, Prisma } from "@prisma/client";
const prisma = new PrismaClient();

async function ensureOpeningForAllAccounts() {
    const accounts = await prisma.account.findMany({ select: { id: true, name: true } });

    for (const acc of accounts) {
        await prisma.$transaction(async (tx) => {
            // If this account already has any Balance row, assume opening rows exist
            const existing = await tx.balance.findFirst({
                where: { accountId: acc.id },
                select: { id: true },
            });
            if (existing) return;

            const trx = await tx.transaction.create({
                data: {
                    date: new Date(),
                    type: "Init_Balance",
                    processed: true,
                    counterpartyAccountId: acc.id, // link the "opening" transaction to the account
                    subtotal: new Prisma.Decimal(0),
                    taxTotal: new Prisma.Decimal(0),
                    grandTotal: new Prisma.Decimal(0),
                    amount: new Prisma.Decimal(0),
                    notes: "Opening Balance",
                },
            });

            await tx.balance.create({
                data: {
                    amount: new Prisma.Decimal(0),
                    date: new Date(),
                    accountId: acc.id,
                    transactionId: trx.id,
                },
            });
        });
    }
}

async function main() {
    // 1) Accounts
    await prisma.account.createMany({
        data: [
            { name: "RBC - Debit", accountType: "Debit", currency: "CAD", active: true },
            { name: "RBC - Credit", accountType: "Credit", currency: "CAD", active: true },
            { name: "Pocket Money (Canada)", accountType: "Cash", currency: "CAD", active: true },
            { name: "Pocket Money (Morocco)", accountType: "Cash", currency: "CAD", active: true },
            { name: "Saving Account Morocco", accountType: "Debit", currency: "MAD", active: true },
        ],
        skipDuplicates: true,
    });

    // 2) Ensure an opening Transaction + Balance exists per account (idempotent)
    await ensureOpeningForAllAccounts();

    // 3) Parent categories
    const parentNames = [
        "Groceries", "Shopping", "Household", "Transport",
        "Health", "Dining & Leisure", "Other",
    ];
    await prisma.category.createMany({
        data: parentNames.map(name => ({ name, active: true })),
        skipDuplicates: true,
    });

    // map parent IDs
    const parents = await prisma.category.findMany({
        where: { name: { in: parentNames } },
        select: { id: true, name: true },
    });
    const byName = Object.fromEntries(parents.map(c => [c.name, c.id]));

    // 4) Children under parents
    const children: Array<{ name: string; parent: string, active: boolean }> = [
        { name: "Dairy", parent: "Groceries", active: true },
        { name: "Vegetables", parent: "Groceries", active: true },
        { name: "Fruits", parent: "Groceries", active: true },
        { name: "Meat & Poultry", parent: "Groceries", active: true },
        { name: "Fish & Seafood", parent: "Groceries", active: true },
        { name: "Grains & Pasta", parent: "Groceries", active: true },
        { name: "Bread & Bakery", parent: "Groceries", active: true },
        { name: "Beverages", parent: "Groceries", active: true },
        { name: "Snacks & Sweets", parent: "Groceries", active: true },
        { name: "Condiments & Spices", parent: "Groceries", active: true },
        { name: "Cleaning", parent: "Household", active: true },
        { name: "Kitchen Supplies", parent: "Household", active: true },
        { name: "Toiletries & Hygiene", parent: "Household", active: true },
        { name: "Paper Goods", parent: "Household", active: true },
        { name: "Baby Care", parent: "Household", active: true },
        { name: "Public Transport", parent: "Transport", active: true },
        { name: "Medicine", parent: "Health", active: true },
        { name: "Vitamins & Supplements", parent: "Health", active: true },
        { name: "Restaurants & Cafés", parent: "Dining & Leisure", active: true },
        { name: "Entertainment", parent: "Dining & Leisure", active: true },
        { name: "Clothing", parent: "Shopping", active: true },
        { name: "Electronics", parent: "Shopping", active: true },
        { name: "Miscellaneous", parent: "Other", active: true },
    ];

    await prisma.category.createMany({
        data: children.map(c => ({
            name: c.name,
            parentCategoryId: byName[c.parent],
            active: c.active
        })),
        skipDuplicates: true,
    });

    // 5) People
    await prisma.person.createMany({
        data: [
            { name: "Youssef", active: true },
            { name: "Nour El Houda", active: true },
            { name: "Aya", active: true },
            { name: "Family", active: true },
            { name: "Mehdi", active: true },
            { name: "Maroc", active: true },
        ],
        skipDuplicates: true,
    });

    // 6) Stores
    await prisma.store.createMany({
        data: [
            { name: "Dollarama", active: true },
            { name: "SuperC", active: true },
            { name: "Jean Coutu", active: true },
            { name: "Costco", active: true },
            { name: "Atlas", active: true },
            { name: "Metro", active: true },
            { name: "Depanneur", active: true },
        ],
        skipDuplicates: true,
    });

    // 7) Products (look up category IDs you need)
    const leafs = await prisma.category.findMany({
        where: { name: { in: ["Dairy","Vegetables","Fruits","Meat & Poultry","Grains & Pasta","Bread & Bakery","Beverages","Condiments & Spices","Cleaning","Toiletries & Hygiene","Baby Care"] } },
        select: { id: true, name: true },
    });
    const cat = Object.fromEntries(leafs.map(c => [c.name, c.id]));

    await prisma.product.createMany({
        data: [
            { name: "Milk",              categoryId: cat["Dairy"],                  active: true },
            { name: "Yogurt",            categoryId: cat["Dairy"],                  active: true },
            { name: "Cheese",            categoryId: cat["Dairy"],                  active: true },
            { name: "Potatoes",          categoryId: cat["Vegetables"],             active: true },
            { name: "Tomatoes",          categoryId: cat["Vegetables"],             active: true },
            { name: "Onions",            categoryId: cat["Vegetables"],             active: true },
            { name: "Carrots",           categoryId: cat["Vegetables"],             active: true },
            { name: "Bananas",           categoryId: cat["Fruits"],                 active: true },
            { name: "Apples",            categoryId: cat["Fruits"],                 active: true },
            { name: "Oranges",           categoryId: cat["Fruits"],                 active: true },
            { name: "Chicken",           categoryId: cat["Meat & Poultry"],         active: true },
            { name: "Beef",              categoryId: cat["Meat & Poultry"],         active: true },
            { name: "Rice",              categoryId: cat["Grains & Pasta"],         active: true },
            { name: "Pasta",             categoryId: cat["Grains & Pasta"],         active: true },
            { name: "Baguette",          categoryId: cat["Bread & Bakery"],         active: true },
            { name: "Water",             categoryId: cat["Beverages"],              active: true },
            { name: "Coffee",            categoryId: cat["Beverages"],              active: true },
            { name: "Juice",             categoryId: cat["Beverages"],              active: true },
            { name: "Olive Oil",         categoryId: cat["Condiments & Spices"],    active: true },
            { name: "Salt",              categoryId: cat["Condiments & Spices"],    active: true },
            { name: "Sugar",             categoryId: cat["Condiments & Spices"],    active: true },
            { name: "Dish Soap",         categoryId: cat["Cleaning"],               active: true },
            { name: "Laundry Detergent", categoryId: cat["Cleaning"],               active: true },
            { name: "Surface Cleaner",   categoryId: cat["Cleaning"],               active: true },
            { name: "Shampoo",           categoryId: cat["Toiletries & Hygiene"],   active: true },
            { name: "Soap Bar",          categoryId: cat["Toiletries & Hygiene"],   active: true },
            { name: "Toothpaste",        categoryId: cat["Toiletries & Hygiene"],   active: true },
            { name: "Diapers",           categoryId: cat["Baby Care"],              active: true },
            { name: "Baby Wipes",        categoryId: cat["Baby Care"],              active: true },
        ],
        skipDuplicates: true,
    });
}

main()
    .then(() => console.log("Seeding completed successfully!"))
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
