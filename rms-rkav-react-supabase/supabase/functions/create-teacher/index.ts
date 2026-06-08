import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateTeacherRequest {
  email: string
  password: string
  name: string
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

    const { email, password, name }: CreateTeacherRequest = await req.json()

    // Validate input
    if (!email || !password || !name) {
      throw new Error('Email, password, and name are required')
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Create auth user using admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role: 'teacher'
      }
    })

    if (authError) {
      console.error('Auth creation error:', authError)
      throw new Error(`Failed to create user account: ${authError.message}`)
    }

    if (!authData.user) {
      throw new Error('User creation failed - no user data returned')
    }

    // Insert teacher record with the auth user ID
    const { error: teacherError } = await supabaseAdmin
      .from('teachers')
      .insert([{
        id: authData.user.id,
        email: email,
        name: name
      }])

    if (teacherError) {
      console.error('Teacher insert error:', teacherError)
      
      // If teacher insert fails, clean up the auth user
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      
      throw new Error(`Failed to create teacher record: ${teacherError.message}`)
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Teacher created successfully',
      teacher: {
        id: authData.user.id,
        email: email,
        name: name
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error creating teacher:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to create teacher'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})