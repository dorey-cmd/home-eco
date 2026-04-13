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
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 bg-transparent" dir="rtl">
      <div className="w-full max-w-sm glass-panel p-8" style={{ borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
        
        <h2 className="text-2xl font-bold text-center mb-8 text-white tracking-wide">
          {isSignUp ? 'יצירת חשבון' : 'התחברות למערכת'}
        </h2>

        {msg && (
          <div className={`mb-6 p-4 rounded-xl text-sm text-center font-bold ${
            msg.type === 'error' ? 'bg-danger/20 text-[#ff6b6b] border border-danger/30' : 
            msg.type === 'success' ? 'bg-success/20 text-[#4ade80] border border-success/30' : 
            'bg-accent/20 text-accent border border-accent/30'
          }`} style={{ animation: 'fadeIn 0.3s ease' }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          <div>
            <label className="text-secondary text-sm mb-2 block font-medium">כתובת אימייל</label>
            <input 
              type="email" 
              className="glass-input w-full p-3 font-sans text-right" 
              dir="rtl"
              placeholder="כתובת דוא״ל..."
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="text-secondary text-sm mb-2 block font-medium">סיסמה</label>
            <input 
              type="password" 
              className="glass-input w-full p-3 font-sans text-right" 
              dir="rtl"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div className="mt-2">
              <label className="text-secondary text-sm mb-2 block font-medium">סוג משתמש</label>
              <div className="flex gap-3">
                <button 
                  type="button"
                  className={`flex-1 rounded-xl py-2 transition-colors border ${!isBusiness ? 'bg-accent/20 border-accent text-accent' : 'bg-transparent border-[rgba(255,255,255,0.2)] text-secondary'}`}
                  style={{ fontWeight: !isBusiness ? 'bold' : 'normal' }}
                  onClick={() => setIsBusiness(false)}
                >
                  בייתי
                </button>
                <button 
                  type="button"
                  className={`flex-1 rounded-xl py-2 transition-colors border ${isBusiness ? 'bg-accent/20 border-accent text-accent' : 'bg-transparent border-[rgba(255,255,255,0.2)] text-secondary'}`}
                  style={{ fontWeight: isBusiness ? 'bold' : 'normal' }}
                  onClick={() => setIsBusiness(true)}
                >
                  עסקי
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="w-full mt-4 justify-center py-3.5 font-bold rounded-xl bg-accent text-white hover:opacity-90 transition-opacity border-none shadow-[0_4px_15px_rgba(99,102,241,0.3)]"
            disabled={loading}
          >
            {loading ? 'טוען...' : (isSignUp ? 'הרשמה למערכת' : 'התחברות')}
          </button>
        </form>

        <div className="text-center mt-6">
          <div 
            className="text-secondary cursor-pointer hover:text-white transition-colors block text-sm"
            style={{ display: 'inline-block' }}
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMsg(null);
            }}
          >
            {isSignUp ? (
              <span>כבר רשום? <span className="text-accent underline decoration-accent underline-offset-4">התחבר כאן</span></span>
            ) : (
              <span>משתמש חדש? <span className="text-accent underline decoration-accent underline-offset-4">צור חשבון בחינם</span></span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
