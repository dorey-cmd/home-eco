import { useNavigate } from 'react-router-dom';
import { Layers, MapPin, Store, ChevronLeft } from 'lucide-react';

const AppSettings = () => {
  const navigate = useNavigate();

  const ActionButton = ({ icon: Icon, title, description, path }: { icon: any, title: string, description: string, path: string }) => (
    <button 
      className="glass-panel list-row" 
      style={{ padding: '20px 16px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', cursor: 'pointer', width: '100%', marginBottom: '16px', transition: 'transform 0.2s ease', position: 'relative', overflow: 'hidden' }}
      onClick={() => navigate(path)}
    >
      <div className="flex items-center justify-center" style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-glow)' }}>
        <Icon size={24} className="text-accent" />
      </div>
      <div style={{ flex: 1, textAlign: 'right', marginRight: '16px' }}>
        <h2 className="font-bold m-0" style={{ fontSize: '1.2rem' }}>{title}</h2>
        <div className="text-secondary mt-1" style={{ fontSize: '0.85rem' }}>{description}</div>
      </div>
      <ChevronLeft size={24} className="text-secondary" style={{ opacity: 0.5 }} />
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
      <ActionButton icon={Store} title="ניהול חנויות קנייה" description="שופרסל, רמי לוי, ירקניה מקומית..." path="/settings/stores" />
      <ActionButton icon={MapPin} title="ניהול מיקומי אחסון" description="מקרר, מזווה, ארון חומרי הניקוי..." path="/settings/locations" />

    </div>
  );
};

export default AppSettings;
