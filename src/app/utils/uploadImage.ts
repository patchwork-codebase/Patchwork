import { supabase } from '../components/auth/AuthContext';

/**
 * Uploads a base64 image to the Supabase edge function and returns the secure URL.
 */
export async function uploadImage(base64Image: string): Promise<string> {
  if (!base64Image.startsWith('data:')) {
    throw new Error("Invalid image format. Expected base64 string.");
  }
  
  const res = await fetch(`${supabase.supabaseUrl}/functions/v1/upload-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ image: base64Image })
  });
  
  if (!res.ok) {
    throw new Error('Failed to upload image to edge function');
  }
  
  const data = await res.json();
  if (!data?.secure_url) {
    throw new Error('No secure URL returned from upload');
  }
  
  return data.secure_url;
}
