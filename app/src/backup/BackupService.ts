import {BaseService} from "../utilities/BaseService";
import BadRequestError from "../utilities/errors/BadRequestError";

export interface BackupData {
    exportedAt: string;
    version: number;
    accounts: any[];
    balances: any[];
    stores: any[];
    persons: any[];
    brands: any[];
    categories: any[];
    products: any[];
    variants: any[];
    productVariantBrands: any[];
    transactions: any[];
    transactionItems: any[];
}

export class BackupService extends BaseService {

    constructor() {
        super(BackupService.name);
    }

    async exportAll(): Promise<BackupData> {
        this.logger.log("Exporting full database backup");

        const [
            accounts,
            balances,
            stores,
            persons,
            brands,
            categories,
            products,
            variants,
            productVariantBrands,
            transactions,
            transactionItems,
        ] = await Promise.all([
            this.prisma.account.findMany(),
            this.prisma.balance.findMany(),
            this.prisma.store.findMany(),
            this.prisma.person.findMany(),
            this.prisma.brand.findMany(),
            this.prisma.category.findMany(),
            this.prisma.product.findMany(),
            this.prisma.productVariant.findMany(),
            this.prisma.productVariantBrand.findMany(),
            this.prisma.transaction.findMany({ include: { items: false } }),
            this.prisma.transactionItem.findMany(),
        ]);

        return {
            exportedAt: new Date().toISOString(),
            version: 1,
            accounts,
            balances,
            stores,
            persons,
            brands,
            categories,
            products,
            variants,
            productVariantBrands,
            transactions,
            transactionItems,
        };
    }

    async importAll(data: BackupData): Promise<void> {
        BadRequestError.throwIf(!data || data.version !== 1, "Invalid backup format: missing or unsupported version.");

        this.logger.log("Starting full database restore — deleting existing data");

        // Delete in child-first order (FK constraints)
        await this.prisma.transactionItem.deleteMany();
        await this.prisma.balance.deleteMany();
        await this.prisma.transaction.deleteMany();
        await this.prisma.productVariantBrand.deleteMany();
        await this.prisma.productVariant.deleteMany();
        await this.prisma.product.deleteMany();
        await this.prisma.account.deleteMany();
        await this.prisma.store.deleteMany();
        await this.prisma.person.deleteMany();
        await this.prisma.brand.deleteMany();
        await this.prisma.category.deleteMany();

        this.logger.log("Inserting backup data");

        // Insert in parent-first order
        if (data.categories?.length)         await this.prisma.category.createMany({ data: data.categories });
        if (data.brands?.length)             await this.prisma.brand.createMany({ data: data.brands });
        if (data.persons?.length)            await this.prisma.person.createMany({ data: data.persons });
        if (data.stores?.length)             await this.prisma.store.createMany({ data: data.stores });
        if (data.accounts?.length)           await this.prisma.account.createMany({ data: data.accounts });
        if (data.products?.length)           await this.prisma.product.createMany({ data: data.products });
        if (data.variants?.length)           await this.prisma.productVariant.createMany({ data: data.variants });
        if (data.productVariantBrands?.length) await this.prisma.productVariantBrand.createMany({ data: data.productVariantBrands });
        if (data.transactions?.length)       await this.prisma.transaction.createMany({ data: data.transactions });
        if (data.transactionItems?.length)   await this.prisma.transactionItem.createMany({ data: data.transactionItems });
        if (data.balances?.length)           await this.prisma.balance.createMany({ data: data.balances });

        this.logger.log("Restore complete");
    }
}
