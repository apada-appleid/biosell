/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mobile]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "unique_customer_email" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "unique_customer_mobile" ON "customers"("mobile");

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
