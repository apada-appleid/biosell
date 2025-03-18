import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// ArvanCloud S3 configuration
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'https://s3.ir-thr-at1.arvanstorage.ir';
const S3_REGION = process.env.S3_REGION || 'default'; // ArvanCloud doesn't use regions like AWS
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'sellers-products';
const S3_RECEIPTS_BUCKET_NAME = process.env.S3_RECEIPTS_BUCKET_NAME || 'receipts';
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

// Base URL for public access to the products bucket
const PRODUCTS_BUCKET_PUBLIC_URL = `https://${S3_BUCKET_NAME}.s3.ir-thr-at1.arvanstorage.ir`;

/**
 * Upload a file to ArvanCloud S3 products bucket
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
    return `${PRODUCTS_BUCKET_PUBLIC_URL}/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error(`Failed to upload file to S3: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Update the uploadReceiptToS3 function
export const uploadReceiptToS3 = async (file: File, path: string): Promise<any> => {
  try {
    // Convert file to base64 for server-side upload
    const base64Data = await fileToBase64(file);
    const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;
    const fullPath = `${path}/${fileName}`;
    
    // Use a server-side API endpoint to handle the upload
    const response = await fetch('/api/upload/receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: fullPath,
        contentType: file.type,
        fileData: base64Data,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server upload failed: ${errorData.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return {
      key: fullPath,
      url: data.url,
      bucket: 'receipts'
    };
  } catch (error) {
    console.error('Error uploading receipt to S3:', error);
    throw new Error(`Failed to upload receipt to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Generate a signed URL for a private receipt
 * @param key The S3 object key
 * @param expiresIn Number of seconds the URL will be valid (default: 43200 seconds = 12 hours)
 * @returns Signed URL with temporary access
 */
export async function getSignedReceiptUrl(key: string, expiresIn = 43200): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_RECEIPTS_BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if a URL is an S3 URL
 * @param url The URL to check
 * @returns True if the URL is an S3 URL
 */
export function isS3Url(url: string): boolean {
  return url.includes('s3.') || url.includes('arvanstorage.ir');
}

/**
 * Ensure a valid image URL is returned, with a fallback
 * @param url The image URL to validate
 * @returns A valid image URL or a fallback
 */
export function ensureValidImageUrl(url: string | null | undefined): string {
  return url && (url.startsWith('http') || url.startsWith('/'))
    ? url
    : '/images/placeholder.jpg';
} 