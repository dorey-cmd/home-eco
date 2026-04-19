import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';

const CONSENT_TEXT = 'אני מאשר/ת קבלת עדכונים, טיפים ומבצעים מ-RakBuy';
const CONSENT_DISCLAIMER = 'אנחנו שומרים על פרטיותך. ניתן להסיר את עצמך מרשימת הדיוור בכל עת.';
const FORM_VERSION = 'signup-form-v1';
const PRIVACY_POLICY_VERSION = '1.0';

const Login = () => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isBusiness, setIsBusiness] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [showConsentHint, setShowConsentHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string, type: 'error' | 'success' | 'info' } | null>(null);
  const consentTimestampRef = useRef<string | null>(null);

  const handleConsentToggle = () => {
    const newVal = !marketingConsent;
    setMarketingConsent(newVal);
    setShowConsentHint(false);
    if (newVal) {
      consentTimestampRef.current = new Date().toISOString();
    } else {
      consentTimestampRef.current = null;
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setShowConsentHint(false);

    try {
      if (isSignUp) {
        // Check marketing consent before proceeding
        if (!marketingConsent) {
          setShowConsentHint(true);
          setLoading(false);
          return;
        }

        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { phone, full_name: fullName, first_name: firstName, last_name: lastName }
          }
        });

        if (error) throw error;
        
        if (data.user && isBusiness) {
          await supabase.from('profiles').update({ role: 'BUSINESS' }).eq('id', data.user.id);
        }

        // Check if email confirmation is required
        if (data.user?.identities?.length === 0 || !data.session) {
            setMsg({ text: 'הרשמה בוצעה בהצלחה! שלחנו לך הודעת אימות למייל. לחץ עליה כדי להיכנס.', type: 'info' });
        } else {
            setMsg({ text: 'ברוך הבא ל-RakBuy! ההרשמה בוצעה בהצלחה.', type: 'success' });
            navigate('/');
        }

        // Background trigger: Send to CRM + Webhook with full context
        if (data.user) {
          supabase.functions.invoke('ghl-sync', {
            body: { 
               email,
               role: isBusiness ? 'BUSINESS' : 'PRIVATE',
               phone,
               firstName,
               lastName,
               userId: data.user.id,
               marketingConsent: true,
               consentTimestamp: consentTimestampRef.current || new Date().toISOString(),
               consentText: CONSENT_TEXT + ' — ' + CONSENT_DISCLAIMER,
               formVersion: FORM_VERSION,
               privacyPolicyVersion: PRIVACY_POLICY_VERSION,
               pageUrl: window.location.href,
               userAgent: navigator.userAgent
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
        navigate('/');
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

  const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '8px', display: 'block' as const, textAlign: 'right' as const, fontWeight: 500 };
  const inputStyle = { padding: '16px', textAlign: 'right' as const, direction: 'rtl' as const };

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
          
          {isSignUp && (
            <div>
              <label style={labelStyle}>שם מלא</label>
              <input 
                type="text" 
                className="glass-input" 
                style={inputStyle}
                placeholder="שם פרטי ומשפחה"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>כתובת אימייל</label>
            <input 
              type="email" 
              className="glass-input" 
              style={inputStyle}
              placeholder="כתובת דוא״ל..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          {isSignUp && (
            <div>
              <label style={labelStyle}>מספר טלפון</label>
              <input 
                type="tel" 
                className="glass-input" 
                style={inputStyle}
                placeholder="05X-XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
          )}
          
          <div>
            <label style={labelStyle}>סיסמה</label>
            <input 
              type="password" 
              className="glass-input" 
              style={inputStyle}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {isSignUp && (
            <>
              <div style={{ marginTop: '8px', textAlign: 'right' }}>
                <label style={labelStyle}>סוג חשבון</label>
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

              {/* Marketing consent */}
              <div style={{ marginTop: '4px' }}>
                <label 
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', textAlign: 'right' }}
                  onClick={handleConsentToggle}
                >
                  <div style={{ 
                    width: '22px', height: '22px', minWidth: '22px', borderRadius: '6px', marginTop: '2px',
                    border: showConsentHint ? '2px solid #e8871e' : marketingConsent ? '2px solid var(--rakbuy-green)' : '1.5px solid rgba(26, 43, 94, 0.2)',
                    background: marketingConsent ? 'var(--rakbuy-green)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s ease', flexShrink: 0
                  }}>
                    {marketingConsent && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                      {CONSENT_TEXT}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                      {CONSENT_DISCLAIMER}
                    </div>
                  </div>
                </label>

                {showConsentHint && (
                  <div style={{ 
                    marginTop: '8px', padding: '8px 12px', borderRadius: '8px', 
                    fontSize: '0.8rem', color: '#b37116', 
                    background: 'rgba(232, 135, 30, 0.08)', 
                    border: '1px solid rgba(232, 135, 30, 0.2)',
                    textAlign: 'right'
                  }}>
                    כדי להמשיך בהרשמה, יש לאשר את קבלת הדיוור 🙏
                  </div>
                )}
              </div>
            </>
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
              setShowConsentHint(false);
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
