# Address Migration Guide

This guide explains how to migrate addresses from the User model to the Customer model.

## Migration Overview

The application is transitioning from storing addresses in the User model to storing them in the Customer model. This change requires:

1. Schema updates (already done)
2. Data migration from the old schema to the new schema
3. Code updates to use the new schema (already done)

## Migration Options

There are two ways to run the migration:

### Option 1: Using the Migration Script (Direct Database Access)

This option uses a Node.js script that directly interacts with the database through Prisma:

```bash
# Ensure you are in the project root directory
cd /root/biosell

# Run the migration script
node scripts/migrate-addresses.js
```

### Option 2: Using the Migration API Endpoint (Recommended)

This option uses an API endpoint that can be called while the application is running:

```bash
# Ensure you are in the project root directory
cd /root/biosell

# First, make sure the MIGRATION_SECRET_KEY is set in your .env.local file:
# MIGRATION_SECRET_KEY="your-secret-key"

# Start your development server if it's not already running
yarn dev

# In a separate terminal, run the migration trigger script
node scripts/run-migration.js
```

## Verification Steps

After running the migration, verify that:

- Customers have the correct addresses
- No data was lost during migration
- The application functions correctly with the new schema

## API Endpoint Changes

The following API endpoints have been updated:

| Old Endpoint | New Endpoint |
|--------------|--------------|
| `/api/user/addresses` | `/api/customer/addresses` |

## Troubleshooting

If you encounter issues during migration:

1. Check the migration script output for error messages
2. Restore from your backup if necessary
3. Ensure all related code is updated to use the new CustomerAddress model instead of the old Address model
4. Verify that the Prisma schema has been properly migrated

## Technical Details

### Schema Changes

The key schema changes involved:

1. Removing the Address model associated with User
2. Adding the CustomerAddress model associated with Customer
3. Making legacy address fields optional in the Customer model

### Frontend Changes

Frontend components have been updated to:

1. Use the new `/api/customer/addresses` API endpoint
2. Update forms and data fetching logic
3. Ensure smooth user experience during the transition

## Post-Migration Cleanup

After verifying that the migration was successful, you may want to:

1. Remove the migration endpoint: `app/api/migration/user-to-customer-addresses/route.ts`
2. Remove the migration scripts: `scripts/migrate-addresses.js` and `scripts/run-migration.js`
3. Remove the `MIGRATION_SECRET_KEY` from your `.env.local` file

For further assistance, please contact the development team. 