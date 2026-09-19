/**
 * Uploads a base64 image directly to Cloudinary and returns the secure URL.
 */
export async function uploadImage(base64Image: string): Promise<string> {
  if (!base64Image.startsWith('data:')) {
    throw new Error("Invalid image format. Expected base64 string.");
  }
  
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfqvoc8dz/image/upload";
  const CLOUDINARY_API_KEY = "566318394499849";
  const CLOUDINARY_API_SECRET = "wyljhM7EMezYpd5iNFrmqNV3J_I";
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const strToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(strToSign);
  const hashBuffer = await window.crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

  const formData = new FormData();
  formData.append("file", base64Image);
  formData.append("api_key", CLOUDINARY_API_KEY);
  formData.append("timestamp", timestamp);
  formData.append("signature", signature);

  const response = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: formData
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || "Cloudinary upload failed");
  }
  
  return result.secure_url;
}
