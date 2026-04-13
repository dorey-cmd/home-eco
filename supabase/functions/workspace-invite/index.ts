import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { email, workspaceId, role } = await req.json();

    if (!email || !workspaceId) {
      return new Response(JSON.stringify({ error: 'Missing email or workspaceId payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Authenticate the calling user strictly via their JWT
    // (This works dynamically even if bypassing verify-jwt at gateway)
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth session: ' + userError?.message }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify calling user owns the workspace
    const { data: wsData } = await supabaseAdmin.from('workspaces').select('owner_id').eq('id', workspaceId).single();
    if (!wsData || wsData.owner_id !== user.id) {
       return new Response(JSON.stringify({ error: 'You do not have permission to invite users to this workspace.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (email === user.email) {
       return new Response(JSON.stringify({ error: 'You cannot invite yourself.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check if target user exists in auth.users by query using service param
    // Notice: admin.listUsers cannot be searched cleanly by email easily, but we can query profiles.
    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('id, email').eq('email', email).single();
    
    if (!targetProfile) {
       return new Response(JSON.stringify({ error: `User ${email} is not registered yet. Ask them to sign up to the system first.` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Insert to workspace_members
    const { error: insertError } = await supabaseAdmin.from('workspace_members').insert({
        workspace_id: workspaceId,
        user_id: targetProfile.id,
        role: role || 'MEMBER'
    });

    if (insertError) {
        if (insertError.code === '23505') {
            return new Response(JSON.stringify({ error: 'User is already a member of this workspace.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ error: 'Failed to add member: ' + insertError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, message: `המשתמש ${email} צורף בהצלחה למרחב העבודה.` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Function Error: ' + error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
