import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfqvoc8dz/image/upload";
const CLOUDINARY_API_KEY = Deno.env.get("CLOUDINARY_API_KEY") || "566318394499849";
const CLOUDINARY_API_SECRET = Deno.env.get("CLOUDINARY_API_SECRET") || "wyljhM7EMezYpd5iNFrmqNV3J_I";

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      throw new Error("No image data provided");
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const strToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    
    const encoder = new TextEncoder();
    const data = encoder.encode(strToSign);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const formData = new FormData();
    formData.append("file", image);
    formData.append("api_key", CLOUDINARY_API_KEY);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || "Cloudinary upload failed");
    }

    return new Response(JSON.stringify({ secure_url: result.secure_url }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
