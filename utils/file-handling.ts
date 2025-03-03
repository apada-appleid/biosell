import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Define base upload path that can be configured via env
const UPLOAD_BASE_PATH = process.env.UPLOAD_BASE_PATH || join(process.cwd(), "public");

// Log the upload path for debugging
console.log('Upload base path:', {
  UPLOAD_BASE_PATH,
  env_path: process.env.UPLOAD_BASE_PATH,
  default_path: join(process.cwd(), "public"),
  cwd: process.cwd()
});

export async function saveUploadedFile(
  file: File, 
  entityType: string, 
  parentId: string
): Promise<string> {
  // Generate consistent IDs
  const directoryId = parentId;
  const fileId = uuidv4();
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'png';
  const fileName = `${fileId}.${fileExtension}`;
  
  // Create consistent paths using configured base path
  const uploadDir = join(UPLOAD_BASE_PATH, "uploads", entityType, directoryId);
  const filePath = join(uploadDir, fileName);
  const dbPath = `/uploads/${entityType}/${directoryId}/${fileName}`;
  
  console.log('File paths:', {
    uploadDir,
    filePath,
    dbPath
  });
  
  // Ensure directory exists with proper permissions
  await mkdir(uploadDir, { recursive: true, mode: 0o755 });
  
  // Save file
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  
  return dbPath;
}

export function getImageUrl(storedPath: string): string {
  // Check if file exists, return default if not
  const absolutePath = join(UPLOAD_BASE_PATH, storedPath);
  if (existsSync(absolutePath)) {
    return storedPath;
  }
  
  return '/images/default-product-image.png'; // Fallback image
} 