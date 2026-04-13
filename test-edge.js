import { createClient } from '@supabase/supabase-js';

const P = '1231231231';
const M = 'dorey@gor-ziv.com';
const URL = 'https://xvorwesnodzqaagobmaa.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2b3J3ZXNub2R6cWFhZ29ibWFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTkxMjAsImV4cCI6MjA5MTU3NTEyMH0.djfmbfNEZ-ob2P_JaXIpUyjAa8j_7kd8yT5ESJjbmbY';

const sup = createClient(URL, ANON);
sup.auth.signInWithPassword({ email: M, password: P }).then(res => {
    if (res.error) {
        console.error('Login Fail:', res.error);
        process.exit(1);
    }
    const token = res.data.session.access_token;
    console.log("Logged in. Testing Edge Function...");
    
    fetch('https://xvorwesnodzqaagobmaa.supabase.co/functions/v1/admin-users', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: "changeRole", targetUserId: res.data.user.id, payload: { role: 'ADMIN' } })
    })
    .then(r => r.json().then(j => ({s: r.status, j})))
    .then(r => console.log('Edge Status:', r.s, 'Res:', r.j))
    .catch(e => console.error('Edge Fail:', e));
});
