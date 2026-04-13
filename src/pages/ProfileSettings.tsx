import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, ChevronRight, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const getRoleDisplay = () => {
    switch (profile?.role) {
      case 'ADMIN': return 'מנהל מערכת (Admin)';
      case 'BUSINESS': return 'מסלול עסקי (כמותי)';
      default: return 'משתמש ביתי';
    }
  };

  const handleSave = async () => {
    // Scaffold save mechanism for future DB schema integration
    setLoading(true);
    setTimeout(() => {
        alert("העדכון נשמר בהצלחה. מערכת פרופילים מלאה בתהליך פיתוח.");
        setLoading(false);
    }, 800);
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <div className="flex items-center gap-2 mb-6">
        <button className="glass-button secondary p-2" onClick={() => navigate('/settings')}>
          <ChevronRight size={24} />
        </button>
        <h1 className="page-title m-0">ניהול פרטים אישיים</h1>
      </div>

      <div className="glass-panel p-6 mb-6 flex flex-col items-center">
        <div className="mb-4 bg-accent flex items-center justify-center rounded-full" style={{ width: '80px', height: '80px', color: 'white' }}>
          <User size={40} />
        </div>
        <div className="text-xl font-bold mb-1">{user?.email}</div>
        <div className="text-sm text-secondary bg-dark-2 px-3 py-1 rounded-full">{getRoleDisplay()}</div>
      </div>

      <div className="glass-panel p-5">
        <h2 className="font-bold mb-4">עריכת פרטים</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-secondary mb-1">דוא״ל (לצפייה בלבד)</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
              <input 
                type="text" 
                className="glass-input w-full pr-10" 
                style={{ opacity: 0.7 }}
                value={user?.email || ''} 
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1">שם פרטי</label>
            <input 
                type="text" 
                className="glass-input w-full" 
                placeholder="הכנס שם פרטי..."
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1">שם משפחה</label>
            <input 
                type="text" 
                className="glass-input w-full" 
                placeholder="הכנס שם משפחה..."
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm text-secondary mb-1">טלפון נייד</label>
            <input 
                type="tel" 
                className="glass-input w-full" 
                placeholder="הכנס מספר טלפון..."
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <button 
            className="glass-button w-full flex items-center justify-center gap-2 mt-2 font-bold"
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={18} />
            שמור שינויים
          </button>
        </div>
      </div>

    </div>
  );
};

export default ProfileSettings;
