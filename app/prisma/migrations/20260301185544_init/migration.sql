-- CreateTable
CREATE TABLE `Account` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL,
    `currency` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL,

    INDEX `Account_accountType_idx`(`accountType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Balance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `date` DATETIME(3) NOT NULL,
    `accountId` INTEGER NOT NULL,
    `transactionId` INTEGER NOT NULL,

    INDEX `Balance_accountId_idx`(`accountId`),
    INDEX `Balance_transactionId_idx`(`transactionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Store` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL,

    UNIQUE INDEX `Store_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Person` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Category` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL,
    `parentCategoryId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL,
    `categoryId` INTEGER NOT NULL,

    INDEX `Product_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVariant` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `unitSize` DECIMAL(10, 2) NOT NULL,
    `unitType` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL,

    INDEX `ProductVariant_productId_idx`(`productId`),
    UNIQUE INDEX `ProductVariant_productId_unitSize_unitType_key`(`productId`, `unitSize`, `unitType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Brand` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL,

    UNIQUE INDEX `Brand_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProductVariantBrand` (
    `variantId` INTEGER NOT NULL,
    `brandId` INTEGER NOT NULL,

    INDEX `ProductVariantBrand_brandId_idx`(`brandId`),
    PRIMARY KEY (`variantId`, `brandId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `processed` BOOLEAN NOT NULL,
    `payAccountId` INTEGER NULL,
    `counterpartyAccountId` INTEGER NULL,
    `storeId` INTEGER NULL,
    `personId` INTEGER NULL,
    `subtotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `taxTotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `grandTotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `notes` VARCHAR(191) NULL,
    `refundOfId` INTEGER NULL,

    INDEX `Transaction_date_idx`(`date`),
    INDEX `Transaction_storeId_idx`(`storeId`),
    INDEX `Transaction_personId_idx`(`personId`),
    INDEX `Transaction_payAccountId_idx`(`payAccountId`),
    INDEX `Transaction_counterpartyAccountId_idx`(`counterpartyAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransactionItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` VARCHAR(191) NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unitPrice` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `lineTotal` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `transactionId` INTEGER NOT NULL,
    `variantId` INTEGER NULL,
    `categoryId` INTEGER NULL,
    `brandId` INTEGER NULL,

    INDEX `TransactionItem_transactionId_idx`(`transactionId`),
    INDEX `TransactionItem_variantId_idx`(`variantId`),
    INDEX `TransactionItem_categoryId_idx`(`categoryId`),
    INDEX `TransactionItem_brandId_idx`(`brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Balance` ADD CONSTRAINT `Balance_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Balance` ADD CONSTRAINT `Balance_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentCategoryId_fkey` FOREIGN KEY (`parentCategoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariant` ADD CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariantBrand` ADD CONSTRAINT `ProductVariantBrand_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProductVariantBrand` ADD CONSTRAINT `ProductVariantBrand_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_payAccountId_fkey` FOREIGN KEY (`payAccountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_counterpartyAccountId_fkey` FOREIGN KEY (`counterpartyAccountId`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_storeId_fkey` FOREIGN KEY (`storeId`) REFERENCES `Store`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_personId_fkey` FOREIGN KEY (`personId`) REFERENCES `Person`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_refundOfId_fkey` FOREIGN KEY (`refundOfId`) REFERENCES `Transaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionItem` ADD CONSTRAINT `TransactionItem_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `Transaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionItem` ADD CONSTRAINT `TransactionItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionItem` ADD CONSTRAINT `TransactionItem_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionItem` ADD CONSTRAINT `TransactionItem_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
