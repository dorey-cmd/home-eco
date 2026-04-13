import { useNavigate } from 'react-router-dom';
import { Layers, MapPin, Store, ChevronLeft, ShieldAlert, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import WorkspaceManager from './components/WorkspaceManager';

const AppSettings = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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
      style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.2)', cursor: 'pointer', width: '100%', marginBottom: '12px', transition: 'all 0.2s ease', borderRadius: '12px' }}
      onClick={() => navigate(path)}
    >
      <div className="flex items-center gap-4 text-right flex-1">
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.15)' }}>
          <Icon size={22} style={{ color: '#fff' }} />
        </div>
        <div>
          <h2 className="font-bold m-0" style={{ fontSize: '1.1rem', color: '#fff' }}>{title}</h2>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>{description}</div>
        </div>
      </div>
      <ChevronLeft size={20} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
    </button>
  );

  const getRoleDisplay = () => {
    switch (profile?.role) {
      case 'ADMIN': return 'מנהל מערכת (Admin)';
      case 'BUSINESS': return 'מסלול עסקי (כמותי)';
      default: return 'משתמש ביתי';
    }
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <h1 className="page-title mb-4">הגדרות מתקדמות</h1>
      
      <div className="glass-panel mb-6 p-4 flex justify-between items-center" style={{ borderLeft: '4px solid var(--accent-color)' }}>
        <div className="flex items-center gap-3">
          <div className="bg-accent p-2 rounded-full" style={{ color: 'white' }}>
            <User size={24} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ fontFamily: 'monospace' }}>{user?.email}</div>
            <div className="text-secondary text-xs">{getRoleDisplay()}</div>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 bg-transparent border-none text-danger cursor-pointer"
          style={{ opacity: 0.9 }}
        >
          <LogOut size={20} />
          <span style={{ fontSize: '0.75rem' }}>התנתק</span>
        </button>
      </div>

      <div className="mb-4">
        <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
          הגדר את מבנה הנתונים של היומיום. קבע שמות וסדר הופעה לשימוש נוח.
        </p>
      </div>
      
      <WorkspaceManager />
      
      <ActionButton icon={Layers} title="ניהול קטגוריות" description="מוצרי חלב, בשר, פירות וירקות, יבשים..." path="/settings/categories" />
      <ActionButton icon={Store} title={isBusiness ? "ניהול ספקים" : "ניהול חנויות קנייה"} description={isBusiness ? "עריכת הספקים הקבועים שלך" : "שופרסל, רמי לוי, ירקניה מקומית..."} path="/settings/stores" />
      <ActionButton icon={MapPin} title={isBusiness ? "ניהול סניפים ומתחמים" : "ניהול מיקומי אחסון"} description={isBusiness ? "הגדרת רשימות לפי סניפי הרשת" : "מקרר, מזווה, ארון חומרי הניקוי..."} path="/settings/locations" />

      {profile?.role === 'ADMIN' && (
        <div className="mt-8 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <h2 className="text-secondary mb-2" style={{ fontSize: '0.9rem' }}>ניהול מערכת מיוחד</h2>
          <ActionButton icon={ShieldAlert} title="לוח בקרה ראשי (Admin)" description="צפייה במשתמשים, חיפוש הרשמות וניהול גלובלי" path="/admin" />
        </div>
      )}

    </div>
  );
};

export default AppSettings;
