/**
 * QR Code Generation for TOTP Setup
 * Generates QR codes for authenticator apps to scan
 */

import QRCode from "qrcode";

/**
 * Generate QR code data URL for TOTP URI
 * @param uri The TOTP URI (otpauth://totp/...)
 * @param options QR code generation options
 */
export async function generateTOTPQRCode(
  uri: string,
  options?: {
    width?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }
): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(uri, {
      width: options?.width || 300,
      margin: options?.margin || 2,
      color: {
        dark: options?.color?.dark || "#000000",
        light: options?.color?.light || "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    return dataUrl;
  } catch (error) {
    console.error("QR code generation error:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateTOTPQRCodeSVG(uri: string): Promise<string> {
  try {
    const svg = await QRCode.toString(uri, {
      type: "svg",
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return svg;
  } catch (error) {
    console.error("QR code SVG generation error:", error);
    throw new Error("Failed to generate QR code SVG");
  }
}

/**
 * Generate QR code as buffer (for server-side image generation)
 */
export async function generateTOTPQRCodeBuffer(uri: string): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(uri, {
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return buffer;
  } catch (error) {
    console.error("QR code buffer generation error:", error);
    throw new Error("Failed to generate QR code buffer");
  }
}
