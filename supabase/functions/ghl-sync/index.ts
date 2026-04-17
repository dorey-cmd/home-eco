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

    const { email, role, phone, firstName, lastName, marketingConsent } = body;

    // ═══ WEBHOOK — fires FIRST, independently of GHL CRM ═══
    const webhookPayload = {
      email,
      phone: phone || '',
      firstName: firstName || '',
      lastName: lastName || '',
      role: role || 'PRIVATE',
      marketingConsent: marketingConsent || false,
      source: 'RakBuy App',
      signupTimestamp: new Date().toISOString()
    };

    try {
      await fetch('https://services.leadconnectorhq.com/hooks/qRGdkRyGpmI5Lav8Kb1I/webhook-trigger/fa4e9232-91df-4079-800f-5f26fc94371a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      console.log('Webhook fired successfully for:', email);
    } catch (err) {
      console.error('Webhook fire error:', err);
    }

    // ═══ GHL CRM SYNC — optional, depends on env vars ═══
    const GHL_API_TOKEN = Deno.env.get('GHL_API_TOKEN');
    const GHL_LOCATION_ID = Deno.env.get('GHL_LOCATION_ID');
    let contactId = null;

    if (GHL_API_TOKEN && GHL_LOCATION_ID) {
      try {
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

        if (ghlResponse.ok) {
          contactId = responseData.contact?.id;

          // Update Supabase profiles securely
          if (contactId) {
              const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
              const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
              const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
                  auth: { autoRefreshToken: false, persistSession: false }
              });
              await supabaseAdmin.from('profiles').update({ ghl_id: contactId }).eq('email', email);
          }
        } else {
          console.error('GHL API Error:', responseData);
        }
      } catch (ghlErr) {
        console.error('GHL sync failed:', ghlErr);
      }
    } else {
      console.warn('GHL Credentials not configured — skipping CRM sync, webhook already fired.');
    }

    return new Response(JSON.stringify({ success: true, contactId }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
