import { v4 as uuidv4 } from "uuid";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

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
  
  // Create consistent paths
  const uploadDir = join(process.cwd(), "public", "uploads", entityType, directoryId);
  const filePath = join(uploadDir, fileName);
  const dbPath = `/uploads/${entityType}/${directoryId}/${fileName}`;
  
  // Ensure directory exists
  await mkdir(uploadDir, { recursive: true });
  
  // Save file
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);
  
  return dbPath;
}

export function getImageUrl(storedPath: string): string {
  // Check if file exists, return default if not
  const absolutePath = join(process.cwd(), "public", storedPath);
  if (existsSync(absolutePath)) {
    return storedPath;
  }
  
  return '/images/default-product-image.png'; // Fallback image
} 