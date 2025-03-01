# Address Migration Plan

This document outlines the step-by-step plan for migrating addresses from the User model to the Customer model.

## Pre-Migration Checklist

- [x] Schema updated to include CustomerAddress model
- [x] Frontend components updated to use CustomerAddress
- [x] API endpoints updated to use CustomerAddress
- [x] Migration scripts and endpoint created
- [x] Dependencies installed (`yarn add node-fetch@2 dotenv`)
- [x] Environment variables configured (`MIGRATION_SECRET_KEY`)

## Migration Process

The migration can be performed using one of two methods:

### Method 1: API Endpoint (Recommended)

This method uses the API endpoint to perform the migration, which is safer as it goes through all the application's validation logic.

1. Start the development server:
   ```bash
   yarn dev
   ```

2. Open a new terminal and run the migration script:
   ```bash
   node scripts/run-migration.js
   ```

3. Monitor the output for any errors or issues.

### Method 2: Direct Database Access

This method directly accesses the database through Prisma, which might be faster but bypasses application logic.

1. Run the direct migration script:
   ```bash
   node scripts/migrate-addresses.js
   ```

2. Monitor the output for any errors or issues.

## Post-Migration Verification

After running the migration, perform these verification steps:

1. **Check database records:**
   - Verify that CustomerAddress records were created correctly
   - Confirm that default address flags are maintained

2. **Test the application:**
   - Login as a customer and check if addresses are displayed correctly
   - Try to add, edit, and delete addresses
   - Complete a checkout process with an address

3. **Monitor logs:**
   - Check for any errors related to addresses or customers

## Rollback Plan (If Needed)

If significant issues are encountered:

1. Restore database from backup (if available)
2. Revert the code changes related to the migration
3. Apply schema migrations to revert back to the old schema

## Post-Migration Cleanup

Once the migration is confirmed successful:

1. Remove the migration endpoint: `app/api/migration/user-to-customer-addresses/route.ts`
2. Remove the migration scripts: `scripts/migrate-addresses.js` and `scripts/run-migration.js`
3. Remove the `MIGRATION_SECRET_KEY` from your `.env.local` file
4. Remove any legacy address-related code or database columns

## Contact

If you encounter any issues during the migration process, please contact the development team. 