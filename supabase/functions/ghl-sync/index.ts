import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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
            tags: ['home-eco-user', role],
            source: 'Home-Eco Full-App'
        })
    });

    const responseData = await ghlResponse.json();

    if (!ghlResponse.ok) {
        console.error('GHL API Error:', responseData);
        return new Response(JSON.stringify({ error: 'Failed to sync to CRM', details: responseData }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true, contactId: responseData.contact?.id }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
