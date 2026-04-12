import QRCode from "qrcode";

export interface QRError {
  code: "qr_data_too_large";
  message: string;
}

export async function generateQRDataUrl(data: string): Promise<string> {
  try {
    return await QRCode.toDataURL(data, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
      color: {
        dark: "#ffffff",
        light: "#00000000",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.toLowerCase().includes("too big") ||
      message.toLowerCase().includes("capacity") ||
      message.toLowerCase().includes("overflow")
    ) {
      const typed: QRError = {
        code: "qr_data_too_large",
        message: "Data exceeds QR code capacity",
      };
      throw typed;
    }
    throw error;
  }
}
