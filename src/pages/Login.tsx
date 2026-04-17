import React, { useState } from 'react';
import { supabase } from '../supabase';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isBusiness, setIsBusiness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { phone }
          }
        });

        if (error) throw error;
        
        if (data.user && isBusiness) {
          // Trigger creates it as PRIVATE by default, update to BUSINESS if needed
          await supabase.from('profiles').update({ role: 'BUSINESS' }).eq('id', data.user.id);
        }

        // Check if email confirmation is required
        if (data.user?.identities?.length === 0 || !data.session) {
            setMsg({ text: 'הרשמה בוצעה בהצלחה! שלחנו לך הודעת אימות למייל. לחץ עליה כדי להיכנס.', type: 'info' });
        } else {
            setMsg({ text: 'ברוך הבא ל-RakBuy! ההרשמה בוצעה בהצלחה.', type: 'success' });
        }

        // Background trigger: Send to CRM (Altrubiz/GHL)
        if (data.user) {
          supabase.functions.invoke('ghl-sync', {
            body: { 
               email: email, 
               role: isBusiness ? 'BUSINESS' : 'PRIVATE',
               phone: phone,
               firstName: email.split('@')[0]
            }
          }).catch(err => console.error('CRM sync error:', err));
        }

        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      console.error('Auth error', error.message);
      
      let errorText = error.message;
      if (error.message.includes('Invalid login credentials')) errorText = 'פרטי התחברות שגויים או שטרם אישרת את המייל.';
      if (error.message.includes('User already registered')) errorText = 'האימייל הזה כבר תפסנו!';
      
      setMsg({ text: errorText, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <img src="/rakbuy-logo.png" alt="RakBuy" className="login-logo" />
      
      <div className="glass-panel login-card">
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '28px', color: 'var(--rakbuy-navy)' }}>
          {isSignUp ? 'יצירת חשבון חדש' : 'התחברות'}
        </h2>

        {msg && (
          <div style={{ marginBottom: '24px', padding: '12px 16px', borderRadius: '12px', fontSize: '0.875rem', textAlign: 'center', fontWeight: 600, 
            background: msg.type === 'error' ? 'rgba(231, 76, 60, 0.08)' : msg.type === 'success' ? 'rgba(46, 204, 113, 0.08)' : 'rgba(26, 43, 94, 0.06)',
            color: msg.type === 'error' ? '#e74c3c' : msg.type === 'success' ? '#27ae60' : '#1a2b5e',
            border: `1px solid ${msg.type === 'error' ? 'rgba(231, 76, 60, 0.2)' : msg.type === 'success' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(26, 43, 94, 0.12)'}`
          }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px', display: 'block', textAlign: 'right', fontWeight: 500 }}>כתובת אימייל</label>
            <input 
              type="email" 
              className="glass-input" 
              style={{ padding: '16px', textAlign: 'right', direction: 'rtl' }}
              placeholder="כתובת דוא״ל..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {isSignUp && (
            <div>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px', display: 'block', textAlign: 'right', fontWeight: 500 }}>מספר טלפון</label>
              <input 
                type="tel" 
                className="glass-input" 
                style={{ padding: '16px', textAlign: 'right', direction: 'rtl' }}
                placeholder="05X-XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          )}
          
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px', display: 'block', textAlign: 'right', fontWeight: 500 }}>סיסמה</label>
            <input 
              type="password" 
              className="glass-input" 
              style={{ padding: '16px', textAlign: 'right', direction: 'rtl' }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div style={{ marginTop: '8px', textAlign: 'right' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px', display: 'block', fontWeight: 500 }}>סוג חשבון</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', transition: 'all 0.25s ease', cursor: 'pointer',
                           background: !isBusiness ? 'var(--rakbuy-green-light)' : '#f8faff',
                           border: !isBusiness ? '2px solid var(--rakbuy-green)' : '1.5px solid rgba(26, 43, 94, 0.12)',
                           color: !isBusiness ? 'var(--rakbuy-green-dark)' : 'var(--text-secondary)',
                           fontWeight: !isBusiness ? 700 : 400
                         }}
                  onClick={() => setIsBusiness(false)}
                >
                  🏠 בייתי
                </button>
                <button 
                  type="button"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', transition: 'all 0.25s ease', cursor: 'pointer',
                           background: isBusiness ? 'rgba(26, 43, 94, 0.06)' : '#f8faff',
                           border: isBusiness ? '2px solid var(--rakbuy-navy)' : '1.5px solid rgba(26, 43, 94, 0.12)',
                           color: isBusiness ? 'var(--rakbuy-navy)' : 'var(--text-secondary)',
                           fontWeight: isBusiness ? 700 : 400
                         }}
                  onClick={() => setIsBusiness(true)}
                >
                  🏢 עסקי
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="glass-button"
            style={{ width: '100%', marginTop: '16px', justifyContent: 'center', padding: '16px', fontWeight: 700, fontSize: '1.05rem', borderRadius: '14px' }}
            disabled={loading}
          >
            {loading ? 'טוען...' : (isSignUp ? 'הרשמה ל-RakBuy' : 'כניסה')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <div 
            style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', display: 'inline-block' }}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMsg(null);
            }}
          >
            {isSignUp ? (
              <span>כבר רשום? <span style={{ color: 'var(--rakbuy-green-dark)', fontWeight: 600 }}>התחבר כאן</span></span>
            ) : (
              <span>משתמש חדש? <span style={{ color: 'var(--rakbuy-green-dark)', fontWeight: 600 }}>צור חשבון בחינם</span></span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
