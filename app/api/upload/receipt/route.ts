import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import authOptions from '@/lib/auth';

// Environment variables
const S3_RECEIPTS_BUCKET_NAME = process.env.S3_RECEIPTS_BUCKET_NAME || 'receipts';
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'https://s3.ir-thr-at1.arvanstorage.ir';
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY || '';
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_KEY || '';
const S3_REGION = process.env.S3_REGION || 'default';

// Create S3 client
const s3Client = new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

export async function POST(request: NextRequest) {
  try {
    // Get session to check authentication
    const session = await getServerSession(authOptions);
    
    // Only authenticated users can upload
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { fileName, contentType, fileData } = body;
    
    if (!fileName || !contentType || !fileData) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Decode base64 data to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    // Safety checks
    if (buffer.length > 5 * 1024 * 1024) { // 5MB max
      return NextResponse.json(
        { success: false, message: 'File too large (max 5MB)' },
        { status: 400 }
      );
    }
    
    // Valid image types
    const validContentTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validContentTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid file type' },
        { status: 400 }
      );
    }
    
    // Upload to S3
    const putCommand = new PutObjectCommand({
      Bucket: S3_RECEIPTS_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType
    });
    
    await s3Client.send(putCommand);
    
    // Generate a signed URL for viewing the uploaded file (valid for 12 hours)
    const getCommand = new GetObjectCommand({
      Bucket: S3_RECEIPTS_BUCKET_NAME,
      Key: fileName
    });
    
    const signedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 43200 });
    
    return NextResponse.json({
      success: true,
      key: fileName,
      url: signedUrl
    });
    
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown server error' 
      },
      { status: 500 }
    );
  }
} 