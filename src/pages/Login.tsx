import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, UserPlus, Home, Briefcase } from 'lucide-react';

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
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="glass-panel w-full max-w-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-accent">
          {isSignUp ? 'יצירת חשבון' : 'התחברות למערכת'}
        </h1>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center font-bold ${
            msg.type === 'error' ? 'bg-danger text-white' : 
            msg.type === 'success' ? 'bg-success text-white' : 
            'bg-accent text-white'
          }`} style={{ animation: 'fadeIn 0.3s ease' }}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div>
            <label className="text-secondary text-sm mb-1 block">אימייל</label>
            <input 
              type="email" 
              className="glass-input w-full p-3 font-sans" 
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-secondary text-sm mb-1 block">סיסמה</label>
            <input 
              type="password" 
              className="glass-input w-full p-3 font-sans" 
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {isSignUp && (
            <div className="mt-2">
              <label className="text-secondary text-sm mb-2 block">סוג חשבון</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  className={`flex-1 glass-button ${!isBusiness ? 'border-accent' : 'secondary opacity-70'}`}
                  onClick={() => setIsBusiness(false)}
                >
                  <Home size={18} /> ביתי
                </button>
                <button 
                  type="button"
                  className={`flex-1 glass-button ${isBusiness ? 'border-accent' : 'secondary opacity-70'}`}
                  onClick={() => setIsBusiness(true)}
                >
                  <Briefcase size={18} /> עסקי
                </button>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="glass-button w-full mt-4 justify-center"
            disabled={loading}
          >
            {loading ? 'טוען...' : (isSignUp ? <><UserPlus size={18} /> הירשם</> : <><LogIn size={18} /> התחבר</>)}
          </button>
        </form>

        <div className="text-center mt-6">
          <button 
            className="text-secondary text-sm"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'כבר יש לך חשבון? התחבר כאן' : 'אין לך חשבון? צור חשבון חדש'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
