/**
 * storage.ts
 * 
 * Pluggable storage utility for handling file uploads.
 * Currently implements a simulator that mimics cloud storage.
 * Replace the implementation of uploadFile with a real S3/Cloudinary/etc. call when ready.
 */

export interface UploadResult {
  url: string;
  thumbnail?: string;
}

/**
 * Simulates a cloud storage upload.
 * In production, this would use a service like Cloudinary, AWS S3, or Uploadthing.
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

  // Determine type
  const isImage = file.type.startsWith("image/");
  
  // Create a blob URL as a placeholder (simulating the public URL)
  // Note: In a real app, this would be a URL from S3/Cloudinary etc.
  const simulatedUrl = URL.createObjectURL(file);

  // Return simulated result
  return {
    url: simulatedUrl,
    thumbnail: isImage ? simulatedUrl : undefined,
  };
}

/**
 * Specialized avatar upload Helper
 */
export async function uploadAvatar(file: File): Promise<string> {
  const result = await uploadFile(file);
  return result.url;
}
