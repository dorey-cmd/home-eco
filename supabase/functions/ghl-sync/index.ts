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
    const bodyText = await req.text();
    let body;
    try {
        body = JSON.parse(bodyText);
    } catch(e) {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { email, role, phone, firstName, lastName } = body;
    
    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');

    if (!GHL_API_TOKEN || !GHL_LOCATION_ID) {
         console.warn('GHL Credentials not configured inside Edge Function environment variables.');
         return new Response(JSON.stringify({ error: 'System CRM misconfigured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // GoHighLevel API V2 Endpoint for Upserting Contact
    const ghlResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GHL_API_TOKEN}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            first_name: firstName || 'User',
            last_name: lastName || '',
            email: email,
            phone: phone || '',
            locationId: GHL_LOCATION_ID,
            tags: ['rakbuy-user', role],
            source: 'RakBuy App'
        })
    });

    const responseData = await ghlResponse.json();

    if (!ghlResponse.ok) {
        console.error('GHL API Error:', responseData);
        return new Response(JSON.stringify({ error: 'Failed to sync to CRM', details: responseData }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const contactId = responseData.contact?.id;

    // Fire webhook to LeadConnector for new signup automation
    const webhookPayload = {
      email,
      phone: phone || '',
      firstName: firstName || 'User',
      lastName: lastName || '',
      role: role || 'PRIVATE',
      source: 'RakBuy App',
      contactId: contactId || null,
      signupTimestamp: new Date().toISOString()
    };

    fetch('https://services.leadconnectorhq.com/hooks/qRGdkRyGpmI5Lav8Kb1I/webhook-trigger/fa4e9232-91df-4079-800f-5f26fc94371a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    }).catch(err => console.error('Webhook fire error:', err));

    // Update Supabase profiles securely
    if (contactId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });

        // Find user by email from profiles and update
        await supabaseAdmin.from('profiles').update({ ghl_id: contactId }).eq('email', email);
    }


    return new Response(JSON.stringify({ success: true, contactId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
