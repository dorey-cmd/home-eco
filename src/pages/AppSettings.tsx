import { useNavigate } from 'react-router-dom';
import { Layers, MapPin, Store, ChevronLeft, ShieldAlert, LogOut, User, Building } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';

const AppSettings = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isBusiness = profile?.role === 'BUSINESS';

  const handleLogout = async () => {
    if (window.confirm('האם אתה בטוח שברצונך להתנתק?')) {
      await supabase.auth.signOut();
      // AuthContext will automatically drop state to null, ProtectedLayout in App.tsx will kick to Login!
    }
  };

  const ActionButton = ({ icon: Icon, title, description, path }: { icon: any, title: string, description: string, path: string }) => (
    <button 
      className="glass-panel list-row flex items-center justify-between" 
      style={{ padding: '16px', background: '#ffffff', border: '1px solid rgba(26, 43, 94, 0.08)', cursor: 'pointer', width: '100%', marginBottom: '12px', transition: 'all 0.25s ease', borderRadius: '14px' }}
      onClick={() => navigate(path)}
    >
      <div className="flex items-center gap-4 flex-1" style={{ textAlign: 'right' }}>
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--rakbuy-green-light)' }}>
          <Icon size={24} style={{ color: 'var(--rakbuy-green-dark)' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <h2 className="font-bold m-0" style={{ fontSize: '1.05rem', color: 'var(--rakbuy-navy)', marginBottom: '4px' }}>{title}</h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{description}</div>
        </div>
      </div>
      <ChevronLeft size={20} style={{ color: 'var(--text-muted)' }} />
    </button>
  );



  return (
    <div style={{ paddingBottom: '90px' }}>
      <h1 className="page-title mb-4">הגדרות מתקדמות</h1>
      
      <ActionButton icon={User} title="ניהול פרטים אישיים" description="צפייה ועריכת שם, אמצעי התקשרות ופרופיל" path="/settings/profile" />

      <div className="mb-4">
        <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
          הגדר את מבנה הנתונים של היומיום. קבע שמות וסדר הופעה לשימוש נוח.
        </p>
      </div>
      
      <ActionButton icon={Building} title="ניהול סביבת תפעול" description="הקמת מרחבים נפרדים, מעבר בין משתמשים והזמנת שותפים לניהול" path="/settings/workspaces" />
      <ActionButton icon={Layers} title="ניהול קטגוריות" description="מוצרי חלב, בשר, פירות וירקות, יבשים..." path="/settings/categories" />
      <ActionButton icon={Store} title={isBusiness ? "ניהול ספקים" : "ניהול חנויות קנייה"} description={isBusiness ? "עריכת הספקים הקבועים שלך" : "שופרסל, רמי לוי, ירקניה מקומית..."} path="/settings/stores" />
      <ActionButton icon={MapPin} title={isBusiness ? "ניהול סניפים ומתחמים" : "ניהול ארונות אחסון"} description={isBusiness ? "הגדרת רשימות לפי סניפי הרשת" : "מקרר, מזווה, ארון חומרי הניקוי..."} path="/settings/locations" />

      {profile?.role === 'ADMIN' && (
        <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <h2 className="text-secondary mb-2" style={{ fontSize: '0.9rem' }}>ניהול מערכת מיוחד</h2>
          <ActionButton icon={ShieldAlert} title="Admin Control" description="צפייה במשתמשים, חיפוש הרשמות וניהול גלובלי" path="/admin" />
        </div>
      )}

      <div className="mt-8 mb-4">
        <button 
          onClick={handleLogout}
          className="glass-button w-full flex items-center justify-center gap-2"
          style={{ background: 'rgba(231, 76, 60, 0.06)', border: '1px solid rgba(231, 76, 60, 0.2)', color: '#e74c3c', boxShadow: 'none' }}
        >
          <LogOut size={18} />
          <span className="font-bold">התנתק מהחשבון</span>
        </button>
      </div>

    </div>
  );
};

export default AppSettings;
