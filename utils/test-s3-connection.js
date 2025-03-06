// Script to test the S3 connection
// Run with node utils/test-s3-connection.js

const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

// Log environment variables (without printing sensitive values)
console.log('Environment variables loaded:', {
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  S3_REGION: process.env.S3_REGION,
  S3_BUCKET_NAME: process.env.S3_BUCKET_NAME,
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ? '[SET]' : '[NOT SET]',
  S3_SECRET_KEY: process.env.S3_SECRET_KEY ? '[SET]' : '[NOT SET]',
});

// ArvanCloud S3 configuration
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'https://s3.ir-thr-at1.arvanstorage.ir';
const S3_REGION = process.env.S3_REGION || 'default';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'sellers-products';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || '';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || '';

// Create S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for ArvanCloud S3
});

// Test the connection
async function testConnection() {
  try {
    console.log('Testing S3 connection...');
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);
    console.log('Connection successful! Buckets:', response.Buckets);
    return true;
  } catch (error) {
    console.error('S3 connection failed:', error);
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('S3 connection test completed successfully.');
    } else {
      console.log('S3 connection test failed. Please check your credentials and network connection.');
    }
  })
  .catch(error => {
    console.error('Error running test:', error);
  }); 