import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { ShieldAlert, Users, Building, ChevronRight, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile, Workspace } from '../context/AuthContext';

interface AdminProfile extends UserProfile {
  email?: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingRoleFor, setEditingRoleFor] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Due to RLS with is_admin(), this user will retrieve all columns
      const [{ data: pData, error: pErr }, { data: wData, error: wErr }] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('workspaces').select('*')
      ]);

      if (pErr) throw pErr;
      if (wErr) throw wErr;

      setProfiles(pData as AdminProfile[]);
      setWorkspaces(wData as Workspace[]);
    } catch (error: any) {
      console.error(error);
      alert('שגיאה בטעינת נתוני מנהל: כנראה שאין לך הרשאת גישה מלאה. נא להריץ את ה-SQL סקריפט.');
    } finally {
      setLoading(false);
    }
  };

  const getWorkspacesCount = (userId: string) => {
    return workspaces.filter(w => w.owner_id === userId).length;
  };

  const handleAction = async (action: 'deleteUser' | 'changeRole', targetUserId: string, payload?: any) => {
    const p = profiles.find(pr => pr.id === targetUserId);
    if (action === 'deleteUser') {
      if (!window.confirm(`האם אתה בטוח שברצונך למחוק לצמיתות את המשתמש ${p?.email}? פעולה זו תשמיד אותו מהמערכת.`)) return;
    }

    setActionLoading(targetUserId);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { action, targetUserId, payload }
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      if (action === 'deleteUser') {
        setProfiles(profiles.filter(pr => pr.id !== targetUserId));
      } else if (action === 'changeRole') {
        setProfiles(profiles.map(pr => pr.id === targetUserId ? { ...pr, role: payload.role } : pr));
        setEditingRoleFor(null);
      }
      
      alert(data.message || 'הפעולה בוצעה בהצלחה!');
    } catch (e: any) {
      console.error(e);
      alert('תקלה בביצוע הפעולה: ' + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate('/settings')} style={{ background: 'transparent', border: 'none', color: 'var(--text-color)' }}>
          <ChevronRight size={28} />
        </button>
        <h1 className="page-title flex items-center gap-2" style={{ marginBottom: 0, color: 'var(--danger-color)' }}>
          <ShieldAlert size={24} />
          ניהול מערכת (Admin)
        </h1>
      </div>

      <div className="glass-panel mb-6" style={{ padding: '16px' }}>
        <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>
          ברוך הבא למסך הניהול העולמי. מכאן ניתן לצפות בכל המשמשים שנרשמו למערכת ולהבין את הפעילות שלהם.
          כדי להוסיף או לאפס סיסמה למשתמש, השתמש בלוח הבקרה (Authentication) המובנה באתר Supabase.
        </p>
        <div className="flex gap-4">
          <div className="glass-panel flex-1 flex flex-col items-center justify-center p-4">
            <Users size={28} className="text-accent mb-2" />
            <div className="text-2xl font-bold">{profiles.length}</div>
            <div className="text-secondary text-sm">משתמשים</div>
          </div>
          <div className="glass-panel flex-1 flex flex-col items-center justify-center p-4">
            <Building size={28} className="text-accent mb-2" />
            <div className="text-2xl font-bold">{workspaces.length}</div>
            <div className="text-secondary text-sm">מרחבים/סניפים</div>
          </div>
        </div>
      </div>

      <h2 className="mb-4 font-bold text-accent">רשימת משתמשים (ניהול)</h2>
      {loading ? (
        <div className="text-center p-8">טוען נתונים אבסולוטיים...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {profiles.map(p => (
            <div key={p.id} className="glass-panel p-4 flex flex-col gap-2 relative">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold">{p.email || 'משתמש ללא אימייל'}</div>
                  <div className="text-secondary text-xs" style={{ fontFamily: 'monospace' }}>{p.id}</div>
                </div>
                
                {editingRoleFor === p.id ? (
                  <div className="flex items-center gap-1">
                    <select 
                      className="glass-input p-1 text-sm bg-black" 
                      defaultValue={p.role}
                      onChange={(e) => handleAction('changeRole', p.id, { role: e.target.value })}
                    >
                      <option value="PRIVATE">PRIVATE</option>
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button className="glass-button secondary p-1 text-secondary" onClick={() => setEditingRoleFor(null)}>ביטול</button>
                  </div>
                ) : (
                  <div 
                    className={`badge ${p.role === 'ADMIN' ? 'bg-danger' : (p.role === 'BUSINESS' ? 'bg-accent' : 'bg-success')}`} 
                    style={{ padding: '4px 8px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer' }}
                    onClick={() => setEditingRoleFor(p.id)}
                    title="לחץ כאן כדי לשנות תפקיד"
                  >
                    {p.role} ✏️
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-secondary mt-2">
                <div className="flex items-center gap-2">
                  <Building size={16} /> מרחבים פעילים: {getWorkspacesCount(p.id)}
                </div>
                
                {p.email !== 'dorey@gor-ziv.com' && (
                  <button 
                    className="glass-button secondary p-2 text-danger flex items-center gap-1"
                    onClick={() => handleAction('deleteUser', p.id)}
                    disabled={actionLoading === p.id}
                    title="מחק משתמש לצמיתות מהמערכת"
                  >
                    {actionLoading === p.id ? <CheckCircle size={16}/> : <Trash2 size={16} />}
                    <span className="text-xs">השמד</span>
                  </button>
                )}
              </div>
              <div className="text-xs text-secondary mt-1">
                נרשם: {new Date(p.created_at).toLocaleDateString('he-IL')} {new Date(p.created_at).toLocaleTimeString('he-IL')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
