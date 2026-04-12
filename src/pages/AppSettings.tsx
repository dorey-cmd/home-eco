import { useNavigate } from 'react-router-dom';
import { Layers, MapPin, Store, ChevronLeft } from 'lucide-react';

const AppSettings = () => {
  const navigate = useNavigate();

  const ActionButton = ({ icon: Icon, title, path }: { icon: any, title: string, path: string }) => (
    <button 
      className="glass-panel list-row" 
      style={{ padding: '20px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', width: '100%', marginBottom: '12px' }}
      onClick={() => navigate(path)}
    >
      <div className="flex items-center justify-center" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)' }}>
        <Icon size={20} className="text-accent" />
      </div>
      <div style={{ flex: 1, textAlign: 'right', marginRight: '16px' }}>
        <h2 className="font-bold m-0" style={{ fontSize: '1.2rem' }}>{title}</h2>
      </div>
      <ChevronLeft size={24} className="text-secondary" />
    </button>
  );

  return (
    <div style={{ paddingBottom: '90px' }}>
      <h1 className="page-title">הגדרות מתקדמות</h1>
      <p className="text-secondary mb-6">נהל את הרשימות הדינמיות, הגדר סדר הופעה ושמות לשימוש נוח יותר.</p>
      
      <ActionButton icon={Layers} title="ניהול קטגוריות" path="/settings/categories" />
      <ActionButton icon={Store} title="ניהול חנויות קנייה" path="/settings/stores" />
      <ActionButton icon={MapPin} title="ניהול מיקומי איחסון" path="/settings/locations" />
    </div>
  );
};

export default AppSettings;
