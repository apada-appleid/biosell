// Script to trigger the address migration endpoint
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
  console.log('Starting address migration...');
  
  try {
    // Get the migration secret key from environment variables
    const migrationSecretKey = process.env.MIGRATION_SECRET_KEY;
    
    if (!migrationSecretKey) {
      throw new Error('MIGRATION_SECRET_KEY is not defined in .env.local');
    }
    
    // Define the migration endpoint
    const migrationEndpoint = 'http://localhost:3000/api/migration/user-to-customer-addresses';
    
    console.log(`Calling migration endpoint: ${migrationEndpoint}`);
    
    // Call the migration endpoint
    const response = await fetch(migrationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${migrationSecretKey}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Migration failed with status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    // Display the migration summary
    console.log('\nMigration Summary:');
    console.log('=================');
    console.log(`Users processed: ${result.summary.usersProcessed}`);
    console.log(`Customers created: ${result.summary.customersCreated}`);
    console.log(`Addresses migrated: ${result.summary.addressesMigrated}`);
    
    if (result.summary.errors && result.summary.errors.length > 0) {
      console.log(`\nErrors encountered (${result.summary.errors.length}):`);
      console.log('=====================================');
      result.summary.errors.forEach((error, index) => {
        console.log(`${index + 1}. User ID: ${error.userId}`);
        console.log(`   Error: ${error.error}`);
      });
    } else {
      console.log('\nNo errors encountered during migration.');
    }
    
    console.log('\nMigration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 