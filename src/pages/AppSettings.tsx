import { useNavigate } from 'react-router-dom';
import { Layers, MapPin, Store, ChevronLeft, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AppSettings = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isBusiness = profile?.role === 'BUSINESS';

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

  return (
    <div style={{ paddingBottom: '90px' }}>
      <div className="mb-6">
        <h1 className="page-title mb-2">הגדרות מתקדמות</h1>
        <p className="text-secondary" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
          הגדר את מבנה הנתונים של האפליקציה. קבע שמות וסדר הופעה לשימוש נוח ומותאם אישית.
        </p>
      </div>
      
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
