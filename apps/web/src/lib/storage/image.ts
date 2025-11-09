/**
 * Image Processing Utilities
 * Using Sharp for image optimization and manipulation
 */

import sharp from "sharp";

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: "jpeg" | "png" | "webp" | "avif";
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  background?: string;
}

export interface ThumbnailOptions {
  sizes?: Array<{ width: number; height: number; name: string }>;
  quality?: number;
  format?: "jpeg" | "png" | "webp";
}

/**
 * Optimize image for web
 */
export async function optimizeImage(
  input: Buffer,
  options: ImageProcessingOptions = {}
): Promise<{
  buffer: Buffer;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}> {
  const {
    width,
    height,
    quality = 80,
    format = "webp",
    fit = "cover",
    background = "#ffffff",
  } = options;

  let pipeline = sharp(input);

  // Resize if dimensions specified
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit,
      background,
      withoutEnlargement: true,
    });
  }

  // Convert format and optimize
  switch (format) {
    case "jpeg":
      pipeline = pipeline.jpeg({
        quality,
        progressive: true,
        mozjpeg: true,
      });
      break;
    case "png":
      pipeline = pipeline.png({
        quality,
        progressive: true,
        compressionLevel: 9,
      });
      break;
    case "webp":
      pipeline = pipeline.webp({
        quality,
      });
      break;
    case "avif":
      pipeline = pipeline.avif({
        quality,
      });
      break;
  }

  // Generate optimized image
  const buffer = await pipeline.toBuffer();
  const metadata = await sharp(buffer).metadata();

  return {
    buffer,
    metadata: {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || format,
      size: buffer.length,
    },
  };
}

/**
 * Generate multiple thumbnail sizes
 */
export async function generateThumbnails(
  input: Buffer,
  options: ThumbnailOptions = {}
): Promise<
  Array<{
    name: string;
    buffer: Buffer;
    width: number;
    height: number;
    size: number;
  }>
> {
  const {
    sizes = [
      { width: 150, height: 150, name: "thumb" },
      { width: 300, height: 300, name: "small" },
      { width: 600, height: 600, name: "medium" },
      { width: 1200, height: 1200, name: "large" },
    ],
    quality = 80,
    format = "webp",
  } = options;

  const thumbnails = await Promise.all(
    sizes.map(async ({ width, height, name }) => {
      const result = await optimizeImage(input, {
        width,
        height,
        quality,
        format,
        fit: "cover",
      });

      return {
        name,
        buffer: result.buffer,
        width: result.metadata.width,
        height: result.metadata.height,
        size: result.metadata.size,
      };
    })
  );

  return thumbnails;
}

/**
 * Extract image metadata
 */
export async function getImageMetadata(input: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  space: string;
  channels: number;
  hasAlpha: boolean;
  orientation?: number;
  exif?: Record<string, any>;
}> {
  const metadata = await sharp(input).metadata();

  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || "unknown",
    space: metadata.space || "unknown",
    channels: metadata.channels || 0,
    hasAlpha: metadata.hasAlpha || false,
    orientation: metadata.orientation,
    exif: metadata.exif,
  };
}

/**
 * Rotate image based on EXIF orientation
 */
export async function autoOrient(input: Buffer): Promise<Buffer> {
  return sharp(input).rotate().toBuffer();
}

/**
 * Remove EXIF data for privacy
 */
export async function removeExif(input: Buffer): Promise<Buffer> {
  return sharp(input).withMetadata({ orientation: undefined }).toBuffer();
}

/**
 * Create circular avatar/profile image
 */
export async function createCircularAvatar(
  input: Buffer,
  size: number = 200
): Promise<Buffer> {
  // Create circular mask
  const mask = Buffer.from(
    `<svg><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" /></svg>`
  );

  return sharp(input)
    .resize(size, size, {
      fit: "cover",
      position: "center",
    })
    .composite([
      {
        input: mask,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();
}

/**
 * Add watermark to image
 */
export async function addWatermark(
  input: Buffer,
  watermarkText: string,
  position: "top" | "bottom" | "center" = "bottom"
): Promise<Buffer> {
  const metadata = await sharp(input).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Create SVG watermark
  const fontSize = Math.floor(width / 30);
  const padding = 20;

  let y;
  switch (position) {
    case "top":
      y = fontSize + padding;
      break;
    case "center":
      y = height / 2;
      break;
    case "bottom":
    default:
      y = height - padding;
      break;
  }

  const watermark = Buffer.from(`
    <svg width="${width}" height="${height}">
      <text
        x="${width / 2}"
        y="${y}"
        font-family="Arial"
        font-size="${fontSize}"
        fill="white"
        fill-opacity="0.5"
        text-anchor="middle"
      >
        ${watermarkText}
      </text>
    </svg>
  `);

  return sharp(input)
    .composite([
      {
        input: watermark,
        gravity: "southeast",
      },
    ])
    .toBuffer();
}

/**
 * Blur image
 */
export async function blurImage(
  input: Buffer,
  sigma: number = 10
): Promise<Buffer> {
  return sharp(input).blur(sigma).toBuffer();
}

/**
 * Convert image to grayscale
 */
export async function grayscale(input: Buffer): Promise<Buffer> {
  return sharp(input).grayscale().toBuffer();
}

/**
 * Sharpen image
 */
export async function sharpen(input: Buffer, sigma?: number): Promise<Buffer> {
  return sharp(input).sharpen(sigma).toBuffer();
}

/**
 * Crop image
 */
export async function cropImage(
  input: Buffer,
  options: {
    left: number;
    top: number;
    width: number;
    height: number;
  }
): Promise<Buffer> {
  return sharp(input).extract(options).toBuffer();
}

/**
 * Validate if buffer is a valid image
 */
export async function isValidImage(input: Buffer): Promise<boolean> {
  try {
    await sharp(input).metadata();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get dominant color from image
 */
export async function getDominantColor(
  input: Buffer
): Promise<{ r: number; g: number; b: number; hex: string }> {
  const { dominant } = await sharp(input).stats();

  const r = Math.round(dominant.r);
  const g = Math.round(dominant.g);
  const b = Math.round(dominant.b);
  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

  return { r, g, b, hex };
}

/**
 * Create placeholder blur image (for lazy loading)
 */
export async function createBlurPlaceholder(input: Buffer): Promise<{
  base64: string;
  width: number;
  height: number;
}> {
  const placeholder = await sharp(input)
    .resize(20, 20, {
      fit: "inside",
    })
    .blur(10)
    .webp({ quality: 20 })
    .toBuffer();

  const metadata = await sharp(placeholder).metadata();

  return {
    base64: `data:image/webp;base64,${placeholder.toString("base64")}`,
    width: metadata.width || 20,
    height: metadata.height || 20,
  };
}
