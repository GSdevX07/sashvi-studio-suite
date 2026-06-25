import { config as dotenvConfig } from "dotenv";

dotenvConfig();

let imagekitInstance: import("imagekit").default | null = null;

async function getImageKit() {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error("Missing ImageKit configuration in environment variables.");
  }

  if (!imagekitInstance) {
    const ImageKit = (await import("imagekit")).default;
    imagekitInstance = new ImageKit({ publicKey, privateKey, urlEndpoint });
  }

  return imagekitInstance;
}

export async function uploadImageToImageKit(file: Buffer, fileName: string) {
  const imagekit = await getImageKit();
  const response = await imagekit.upload({
    file: file.toString("base64"),
    fileName,
    folder: "/sashvi-studio",
  });
  return response;
}
