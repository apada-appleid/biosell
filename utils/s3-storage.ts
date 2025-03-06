import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';

// ArvanCloud S3 configuration
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'https://s3.ir-thr-at1.arvanstorage.ir';
const S3_REGION = process.env.S3_REGION || 'default'; // ArvanCloud doesn't use regions like AWS
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'sellers-products';
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || '';
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || '';

// S3 client instance
const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
  forcePathStyle: true, // Required for ArvanCloud S3
});

// Base URL for public access to the bucket
const BUCKET_PUBLIC_URL = `https://${S3_BUCKET_NAME}.s3.ir-thr-at1.arvanstorage.ir`;

/**
 * Upload a file to ArvanCloud S3
 * @param file The file to upload
 * @param path Optional path prefix within the bucket
 * @returns The URL of the uploaded file
 */
export async function uploadFileToS3(file: File | Buffer, path = 'products'): Promise<string> {
  try {
    // Generate a unique key for the file
    const fileExtension = typeof file === 'object' && 'name' in file 
      ? file.name.split('.').pop()?.toLowerCase() || 'png'
      : 'png';
      
    const fileName = `${uuidv4()}.${fileExtension}`;
    const key = `${path}/${fileName}`;

    // Get the file content as a buffer
    let buffer: Buffer;
    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error('Invalid file type');
    }

    // Upload to S3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file instanceof File ? file.type : 'application/octet-stream',
        ACL: 'public-read', // Make it publicly accessible
      }
    });

    await upload.done();

    // Return the public URL
    return `${BUCKET_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if a URL is from our S3 bucket
 */
export function isS3Url(url: string): boolean {
  return url.includes('arvanstorage.ir');
}

/**
 * Ensure an image URL is valid
 */
export function ensureValidImageUrl(url: string | null | undefined): string {
  if (!url) {
    return '/images/default-product-image.png';
  }
  
  // Already an S3 URL or external URL
  if (url.startsWith('http')) {
    return url;
  }
  
  // Local URL (for backward compatibility)
  return url;
} 