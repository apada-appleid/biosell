/*
  Warnings:

  - You are about to drop the column `phone` on the `customers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[mobile]` on the table `customers` will be added. If there are existing duplicate values, this will fail.

*/
-- حذف ستون phone و اضافه کردن mobile
-- ابتدا ایمیل‌های تکراری را مدیریت می‌کنیم
UPDATE "customers"
SET email = NULL
WHERE email IS NOT NULL;

-- تغییر ستون full_name برای پذیرش NULL
ALTER TABLE "customers" ALTER COLUMN "full_name" DROP NOT NULL;

-- تغییر نام ستون phone به mobile
ALTER TABLE "customers" RENAME COLUMN "phone" TO "mobile";

-- ایجاد جدول OTP
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- ایندکس‌های جدید
CREATE UNIQUE INDEX "otps_mobile_key" ON "otps"("mobile");
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email") WHERE email IS NOT NULL;
CREATE UNIQUE INDEX "customers_mobile_key" ON "customers"("mobile") WHERE mobile IS NOT NULL;
