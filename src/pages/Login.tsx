import React, { useState } from 'react';
import { supabase } from '../supabase';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
            setMsg({ text: 'הרשמה יוקרתית בוצעה בהצלחה! ברוך הבא.', type: 'success' });
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '16px', background: 'transparent', direction: 'rtl' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '32px 24px', borderRadius: '24px' }}>
        
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', marginBottom: '32px', color: '#fff', letterSpacing: '0.5px' }}>
          {isSignUp ? 'יצירת חשבון' : 'התחברות למערכת'}
        </h2>

        {msg && (
          <div style={{ marginBottom: '24px', padding: '12px', borderRadius: '12px', fontSize: '0.875rem', textAlign: 'center', fontWeight: 'bold', 
            background: msg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            color: msg.type === 'error' ? '#ef4444' : msg.type === 'success' ? '#10b981' : '#3b82f6',
            border: `1px solid ${msg.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : msg.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
          }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px', display: 'block', textAlign: 'right', fontWeight: 500 }}>כתובת אמייל</label>
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
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', transition: 'all 0.2s ease', cursor: 'pointer',
                           background: !isBusiness ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                           border: !isBusiness ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.2)',
                           color: !isBusiness ? 'var(--accent-color)' : 'var(--text-secondary)',
                           fontWeight: !isBusiness ? 'bold' : 'normal'
                         }}
                  onClick={() => setIsBusiness(false)}
                >
                  בייתי
                </button>
                <button 
                  type="button"
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', transition: 'all 0.2s ease', cursor: 'pointer',
                           background: isBusiness ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                           border: isBusiness ? '1px solid var(--accent-color)' : '1px solid rgba(255,255,255,0.2)',
                           color: isBusiness ? 'var(--accent-color)' : 'var(--text-secondary)',
                           fontWeight: isBusiness ? 'bold' : 'normal'
                         }}
                  onClick={() => setIsBusiness(true)}
                >
                  עסקי
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="glass-button"
            style={{ width: '100%', marginTop: '16px', justifyContent: 'center', padding: '16px', fontWeight: 'bold' }}
            disabled={loading}
          >
            {loading ? 'טוען...' : (isSignUp ? 'הרשמה למערכת' : 'התחברות')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <div 
            style={{ color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', display: 'inline-block' }}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMsg(null);
            }}
          >
            {isSignUp ? (
              <span>כבר רשום? <span style={{ color: 'var(--accent-color)' }}>התחבר כאן</span></span>
            ) : (
              <span>משתמש חדש? <span style={{ color: 'var(--accent-color)' }}>צור חשבון בחינם</span></span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
