import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteTeacherRequest {
  teacherId: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { teacherId }: DeleteTeacherRequest = await req.json()

    if (!teacherId) {
      throw new Error('Teacher ID is required')
    }

    // First, delete the teacher record (this will cascade due to foreign key)
    const { error: teacherError } = await supabaseAdmin
      .from('teachers')
      .delete()
      .eq('id', teacherId)

    if (teacherError) {
      console.error('Teacher delete error:', teacherError)
      throw new Error(`Failed to delete teacher record: ${teacherError.message}`)
    }

    // Then delete the auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(teacherId)

    if (authError) {
      console.error('Auth delete error:', authError)
      // Don't throw here as the teacher record is already deleted
      console.warn('Teacher record deleted but auth user deletion failed:', authError.message)
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Teacher deleted successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error deleting teacher:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to delete teacher'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})