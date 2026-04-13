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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" 
         style={{ 
           background: 'radial-gradient(circle at top right, #1a1b26 0%, #0d0f17 100%)',
           direction: 'rtl'
         }}>
      
      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: 'rgba(99, 102, 241, 0.15)' }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full blur-[120px]" style={{ background: 'rgba(236, 72, 153, 0.1)' }} />

      <div className="w-full max-w-[400px] relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Home size={32} className="text-accent" />
          </div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-l from-white to-gray-400 m-0" style={{ fontFamily: 'system-ui, sans-serif', letterSpacing: '-0.5px' }}>
            Home Eco
          </h1>
          <p className="text-secondary mt-2 text-sm">ניהול מלאי חכם למשק הבית והעסק</p>
        </div>

        <div className="glass-panel p-8" style={{
          background: 'rgba(20, 22, 35, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          borderRadius: '24px'
        }}>
          
          <h2 className="text-xl font-bold text-center mb-6 text-white">
            {isSignUp ? 'יצירת חשבון חדש' : 'ברוכים השבים'}
          </h2>

          {msg && (
            <div className={`mb-5 p-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${
              msg.type === 'error' ? 'bg-danger/20 text-[#ff6b6b] border border-danger/30' : 
              msg.type === 'success' ? 'bg-success/20 text-[#4ade80] border border-success/30' : 
              'bg-accent/20 text-accent border border-accent/30'
            }`} style={{ animation: 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-5">
            <div>
              <label className="text-secondary text-sm font-medium mb-2 block mr-1">כתובת דוא״ל</label>
              <div className="relative">
                <input 
                  type="email" 
                  className="w-full bg-[#0d0f17]/50 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-accent transition-colors"
                  dir="ltr"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-secondary text-sm font-medium mb-2 block mr-1">סיסמה</label>
              <div className="relative">
                <input 
                  type="password" 
                  className="w-full bg-[#0d0f17]/50 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-accent transition-colors"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {isSignUp && (
              <div className="mt-2" style={{ animation: 'fadeIn 0.3s ease' }}>
                <label className="text-secondary text-sm font-medium mb-3 block mr-1">בחר סוג חשבון</label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 border ${
                      !isBusiness 
                        ? 'bg-accent/20 border-accent text-accent' 
                        : 'bg-[#0d0f17]/50 border-white/10 text-secondary hover:bg-white/5'
                    }`}
                    onClick={() => setIsBusiness(false)}
                  >
                    <Home size={22} className={!isBusiness ? 'text-accent' : 'opacity-70'} />
                    <span className="text-sm font-bold">חשבון ביתי</span>
                  </button>
                  <button 
                    type="button"
                    className={`flex-1 py-3 px-2 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 border ${
                      isBusiness 
                        ? 'bg-accent/20 border-accent text-accent' 
                        : 'bg-[#0d0f17]/50 border-white/10 text-secondary hover:bg-white/5'
                    }`}
                    onClick={() => setIsBusiness(true)}
                  >
                    <Briefcase size={22} className={isBusiness ? 'text-accent' : 'opacity-70'} />
                    <span className="text-sm font-bold">חשבון עסקי</span>
                  </button>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full mt-4 bg-accent hover:opacity-90 text-white font-bold rounded-xl p-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
              disabled={loading}
              style={{ transform: loading ? 'scale(0.98)' : 'scale(1)' }}
            >
              {loading ? (
                <span className="opacity-80">אנא המתן...</span>
              ) : (
                isSignUp ? <><UserPlus size={20} /> צור חשבון חדש</> : <><LogIn size={20} /> התחברות מאובטחת</>
              )}
            </button>
          </form>

        </div>
        
        <div className="text-center mt-6">
            <button 
              className="text-secondary text-sm hover:text-white transition-colors"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMsg(null);
              }}
            >
              {isSignUp ? (
                <span>כבר רשום למערכת? <strong className="text-accent ml-1 border-b border-accent/30 pb-0.5">התחבר כאן</strong></span>
              ) : (
                <span>משתמש חדש? <strong className="text-accent ml-1 border-b border-accent/30 pb-0.5">צור חשבון בחינם</strong></span>
              )}
            </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
