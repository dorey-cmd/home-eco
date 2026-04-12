import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// We wrap everything and always return 200 to prevent supabase-js from squashing our error messages under 'non-2xx'
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
        return new Response(JSON.stringify({ error: 'Server misconfiguration: missing env vars' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token: ' + (userError?.message || 'No user') }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || profile.role !== 'ADMIN') {
      return new Response(JSON.stringify({ error: `Forbidden. You are not an admin. Your role is: ${profile?.role || 'NONE'}` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const bodyText = await req.text();
    let body;
    try {
        body = JSON.parse(bodyText);
    } catch(e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, targetUserId, payload } = body;

    if (!action || !targetUserId) {
        return new Response(JSON.stringify({ error: 'Missing action or targetUserId parameter' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'deleteUser' && targetUserId === user.id) {
        return new Response(JSON.stringify({ error: 'Nice try, you cannot delete yourself.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'deleteUser') {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
      if (error) return new Response(JSON.stringify({ error: 'Failed to delete user: ' + error.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ success: true, message: 'המשתמש נמחק בהצלחה.' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } 
    
    if (action === 'changeRole') {
      const newRole = payload?.role;
      if (!newRole) return new Response(JSON.stringify({ error: 'Missing new role payload' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const { error } = await supabaseAdmin.from('profiles').update({ role: newRole }).eq('id', targetUserId);
      if (error) return new Response(JSON.stringify({ error: 'Failed to update profile: ' + error.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ success: true, message: `התפקיד שונה בהצלחה ל-${newRole}` }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action command' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Function Error: ' + error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
});
