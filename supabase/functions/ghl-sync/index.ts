import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/qRGdkRyGpmI5Lav8Kb1I/webhook-trigger/fa4e9232-91df-4079-800f-5f26fc94371a';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const bodyText = await req.text();
    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const {
      email, role, phone,
      firstName, lastName, userId,
      marketingConsent,
      consentTimestamp,
      consentText,
      formVersion,
      privacyPolicyVersion,
      pageUrl,
      userAgent
    } = body;

    // Capture IP from request headers (X-Forwarded-For or CF-Connecting-IP)
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      'unknown';

    const signupTimestamp = new Date().toISOString();
    const requestId = crypto.randomUUID();

    // ═══════════════════════════════════════════
    // BUILD STRUCTURED WEBHOOK PAYLOAD
    // ═══════════════════════════════════════════
    const webhookPayload = {
      user: {
        email: email || '',
        phone: phone || '',
        firstName: firstName || '',
        lastName: lastName || '',
        userId: userId || null,
        accountType: role === 'BUSINESS' ? 'biz_user' : 'personal_user'
      },
      consent: {
        marketingConsent: !!marketingConsent,
        channels: marketingConsent ? ['email', 'sms', 'whatsapp'] : [],
        consentTimestamp: consentTimestamp || signupTimestamp,
        consentText: consentText || '',
        checkboxDefaultState: false,
        consentMethod: 'web_form_checkbox',
        formVersion: formVersion || 'signup-form-v1',
        pageUrl: pageUrl || '',
        privacyPolicyVersion: privacyPolicyVersion || '1.0'
      },
      context: {
        source: 'RakBuy App',
        signupTimestamp,
        ipAddress,
        userAgent: userAgent || ''
      },
      meta: {
        requestId,
        environment: 'production',
        integration: 'rakbuy-webhook-v1'
      }
    };

    // ═══ WEBHOOK — fires FIRST, await to guarantee delivery ═══
    try {
      const webhookRes = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload)
      });
      console.log(`Webhook fired [${requestId}] status=${webhookRes.status} for: ${email}`);
    } catch (err) {
      console.error(`Webhook fire error [${requestId}]:`, err);
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
            first_name: firstName || '',
            last_name: lastName || '',
            email,
            phone: phone || '',
            locationId: GHL_LOCATION_ID,
            tags: ['rakbuy-user', role || 'PRIVATE'],
            source: 'RakBuy App'
          })
        });

        const responseData = await ghlResponse.json();

        if (ghlResponse.ok) {
          contactId = responseData.contact?.id;

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
      console.warn('GHL credentials not configured — skipping CRM sync, webhook already fired.');
    }

    return new Response(
      JSON.stringify({ success: true, requestId, contactId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
