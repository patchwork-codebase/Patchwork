import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables.')
    }

    // Create a Supabase client with the service role key to bypass RLS (since we will manually verify auth)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get the auth token from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Get the user from the token to ensure they are logged in
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Invalid or expired token')
    }

    // Parse the request body
    const body = await req.json()
    const { update_id } = body

    if (!update_id) {
      throw new Error('Missing update_id parameter')
    }

    // 1. Fetch the update to verify the user is the author and get the media_url
    const { data: updateData, error: fetchError } = await supabaseAdmin
      .from('updates')
      .select('author_id, media_url')
      .eq('id', update_id)
      .single()

    if (fetchError || !updateData) {
      throw new Error('Update not found or unable to fetch')
    }

    // Ensure only the author can delete their own update
    if (updateData.author_id !== user.id) {
      throw new Error('Unauthorized: You can only delete your own updates')
    }

    // 2. Delete the associated media from the bucket if it exists
    if (updateData.media_url) {
      try {
        const uri = new URL(updateData.media_url)
        const pathSegments = uri.pathname.split('/')
        
        // Typical structure: /storage/v1/object/public/updates_media/folder/file.jpg
        const bucketIndex = pathSegments.indexOf('updates_media')
        if (bucketIndex !== -1 && bucketIndex < pathSegments.length - 1) {
          const filePath = pathSegments.slice(bucketIndex + 1).join('/')
          
          // Use Admin client to securely delete the object without hitting RLS blockers
          const { error: storageError } = await supabaseAdmin.storage
            .from('updates_media')
            .remove([filePath])

          if (storageError) {
            console.error('Warning: Failed to delete storage object', storageError)
            // We intentionally don't throw here to allow the DB row to still be deleted even if storage cleanup fails
          }
        }
      } catch (err) {
        console.error('Warning: Failed to parse media_url or delete file', err)
      }
    }

    // 3. Delete the update from the database
    const { error: deleteError } = await supabaseAdmin
      .from('updates')
      .delete()
      .eq('id', update_id)

    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Update deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
