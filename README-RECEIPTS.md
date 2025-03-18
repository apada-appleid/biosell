# Payment Receipt Feature Documentation

## Overview
This feature enhances the BioSell platform by adding support for storing and displaying payment receipt images in both customer and seller order panels. When customers upload receipt images during checkout, the images are stored in a private S3 bucket and securely displayed to both the customer and seller.

## Database Changes
The following database change has been made:
- Added `receipt_info` column to the `orders` table to store receipt metadata (as a JSON string)

### Applying Database Changes
The database change has been applied using:
```bash
npx prisma db push
```

If you need to apply this change manually to a production database, you can run:
```sql
ALTER TABLE `orders` ADD COLUMN `receipt_info` TEXT NULL AFTER `shipping_provider`;
```

## Components Modified
1. **API Endpoints**:
   - `/api/upload/receipt` - Handles uploading receipt images to S3
   - `/api/customer/orders/[id]` - Generates fresh signed URLs for viewing receipts
   - `/api/seller/orders/[id]` - Generates fresh signed URLs for viewing receipts

2. **UI Components**:
   - `CustomerOrderDetailsClient.tsx` - Displays receipt images to customers
   - `SellerOrderDetailsClient.tsx` - Displays receipt images to sellers

3. **Utilities**:
   - `s3-storage.ts` - Added support for longer-lived signed URLs for receipt viewing

## How It Works
1. During checkout, when a customer uploads a receipt image, it's uploaded to the private S3 bucket.
2. The receipt metadata (key, URL, bucket) is stored in the order record as a JSON string.
3. When viewing order details, the system generates a fresh signed URL with a 12-hour expiration.
4. The receipt image is displayed securely to both customers and sellers.

## Security Considerations
- Receipt images are stored in a private S3 bucket that requires authentication.
- Signed URLs are generated with a 12-hour expiration to balance security and usability.
- URLs are regenerated on each page view to ensure they don't expire during use.

## Troubleshooting
If receipt images are not displaying:
1. Check the browser console for errors.
2. Verify that the S3 bucket configuration is correct.
3. Check that the receipt metadata was properly saved in the database.
4. Ensure proper CORS configuration on the S3 bucket.

## Future Improvements
- Add support for multiple receipt images per order
- Implement receipt verification workflow
- Add receipt image compression to reduce storage costs 