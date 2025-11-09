/**
 * AWS S3 Storage Utilities
 * Handle file uploads, downloads, and management with S3
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { nanoid } from "nanoid";
import mime from "mime-types";

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const DEFAULT_BUCKET = process.env.AWS_S3_BUCKET || "hakouna-matata-uploads";
const CDN_URL = process.env.CDN_URL; // Optional CloudFront URL

/**
 * Upload file to S3
 */
export async function uploadToS3(params: {
  file: Buffer | Uint8Array;
  fileName: string;
  mimeType: string;
  folder?: string;
  isPublic?: boolean;
  metadata?: Record<string, string>;
}): Promise<{
  url: string;
  key: string;
  bucket: string;
}> {
  const { file, fileName, mimeType, folder, isPublic = false, metadata } = params;

  // Generate unique key
  const extension = mime.extension(mimeType);
  const uniqueId = nanoid(16);
  const key = folder
    ? `${folder}/${uniqueId}-${fileName}`
    : `${uniqueId}-${fileName}`;

  // Upload to S3
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: DEFAULT_BUCKET,
      Key: key,
      Body: file,
      ContentType: mimeType,
      ACL: isPublic ? "public-read" : "private",
      Metadata: metadata,
    },
  });

  await upload.done();

  // Generate URL
  const url = CDN_URL
    ? `${CDN_URL}/${key}`
    : `https://${DEFAULT_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return {
    url,
    key,
    bucket: DEFAULT_BUCKET,
  };
}

/**
 * Get signed URL for private file access
 */
export async function getSignedDownloadUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: DEFAULT_BUCKET,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Get signed URL for file upload
 */
export async function getSignedUploadUrl(params: {
  fileName: string;
  mimeType: string;
  folder?: string;
  expiresIn?: number;
}): Promise<{
  url: string;
  key: string;
  fields: Record<string, string>;
}> {
  const { fileName, mimeType, folder, expiresIn = 3600 } = params;

  const extension = mime.extension(mimeType);
  const uniqueId = nanoid(16);
  const key = folder
    ? `${folder}/${uniqueId}-${fileName}`
    : `${uniqueId}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: DEFAULT_BUCKET,
    Key: key,
    ContentType: mimeType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    url,
    key,
    fields: {
      "Content-Type": mimeType,
    },
  };
}

/**
 * Delete file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: DEFAULT_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Check if file exists in S3
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: DEFAULT_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === "NotFound") {
      return false;
    }
    throw error;
  }
}

/**
 * Get file metadata from S3
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  lastModified: Date;
  contentType: string;
  metadata?: Record<string, string>;
}> {
  const command = new HeadObjectCommand({
    Bucket: DEFAULT_BUCKET,
    Key: key,
  });

  const response = await s3Client.send(command);

  return {
    size: response.ContentLength || 0,
    lastModified: response.LastModified || new Date(),
    contentType: response.ContentType || "application/octet-stream",
    metadata: response.Metadata,
  };
}

/**
 * List files in folder
 */
export async function listFiles(params: {
  folder?: string;
  maxResults?: number;
  continuationToken?: string;
}): Promise<{
  files: Array<{ key: string; size: number; lastModified: Date }>;
  nextToken?: string;
}> {
  const { folder, maxResults = 1000, continuationToken } = params;

  const command = new ListObjectsV2Command({
    Bucket: DEFAULT_BUCKET,
    Prefix: folder ? `${folder}/` : undefined,
    MaxKeys: maxResults,
    ContinuationToken: continuationToken,
  });

  const response = await s3Client.send(command);

  const files =
    response.Contents?.map((item) => ({
      key: item.Key || "",
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
    })) || [];

  return {
    files,
    nextToken: response.NextContinuationToken,
  };
}

/**
 * Copy file within S3
 */
export async function copyFile(
  sourceKey: string,
  destinationKey: string
): Promise<void> {
  const { CopyObjectCommand } = await import("@aws-sdk/client-s3");

  const command = new CopyObjectCommand({
    Bucket: DEFAULT_BUCKET,
    CopySource: `${DEFAULT_BUCKET}/${sourceKey}`,
    Key: destinationKey,
  });

  await s3Client.send(command);
}

/**
 * Get file size limits based on file type
 */
export function getFileSizeLimit(mimeType: string): number {
  // Return size in bytes
  if (mimeType.startsWith("image/")) {
    return 10 * 1024 * 1024; // 10MB for images
  } else if (mimeType.startsWith("video/")) {
    return 100 * 1024 * 1024; // 100MB for videos
  } else if (mimeType === "application/pdf") {
    return 20 * 1024 * 1024; // 20MB for PDFs
  } else {
    return 50 * 1024 * 1024; // 50MB for other files
  }
}

/**
 * Validate file type
 */
export function isAllowedFileType(mimeType: string): boolean {
  const allowedTypes = [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    // Text
    "text/plain",
    "text/csv",
    "text/html",
    "text/css",
    "text/javascript",
    "application/json",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    // Audio
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
  ];

  return allowedTypes.includes(mimeType);
}

/**
 * Get file category from MIME type
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "document";
  if (
    mimeType.includes("word") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation")
  ) {
    return "document";
  }
  if (mimeType.startsWith("text/")) return "text";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType.includes("archive")
  ) {
    return "archive";
  }
  return "other";
}
