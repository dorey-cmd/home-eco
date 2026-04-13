import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Building, Plus, Users, ChevronDown, Check, ChevronRight } from 'lucide-react';
import type { Workspace } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const WorkspaceSettings = () => {
  const navigate = useNavigate();
  const { workspaces, activeWorkspace, setActiveWorkspaceId, user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [loading, setLoading] = useState(false);

  // Invite state
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const handleCreate = async () => {
    if (!newWsName.trim() || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('workspaces').insert({
        name: newWsName,
        owner_id: user.id
      }).select().single();
      
      if (error) throw error;
      
      // Since context doesn't auto-refresh workspaces without reload, 
      // we can trigger a hard refresh or just reload the app softly.
      window.location.reload();
      
    } catch (e: any) {
      console.error(e);
      alert('שגיאה ביצירת המרחב: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !activeWorkspace) return;
    setInviteLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('workspace-invite', {
        body: { email: inviteEmail, workspaceId: activeWorkspace.id, role: 'MEMBER' }
      });
      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      alert(data.message || 'המשתמש הוזמן בהצלחה!');
      setIsInviting(false);
      setInviteEmail('');
    } catch (e: any) {
      console.error(e);
      alert('שגיאה בהזמנה: ' + e.message);
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '90px' }}>
      <div className="flex items-center gap-2 mb-6">
        <button className="glass-button secondary p-2" onClick={() => navigate('/settings')}>
          <ChevronRight size={24} />
        </button>
        <h1 className="page-title m-0">ניהול סביבת תפעול</h1>
      </div>

      <div className="glass-panel p-4 mb-6">
        <h2 className="font-bold mb-3 flex items-center gap-2 text-accent">
          <Building size={18} />
          מעבר / בחירת סביבת תפעול
        </h2>

      <div className="flex flex-col gap-3">
        <div className="text-secondary text-sm">
          סביבת התפעול הנוכחית:
        </div>
        
        <div className="relative">
          <select 
            className="glass-input w-full appearance-none pr-8 font-bold"
            style={{ fontSize: '1.1rem', padding: '12px', color: '#000' }}
            value={activeWorkspace?.id || ''}
            onChange={(e) => {
                setActiveWorkspaceId(e.target.value);
                window.location.reload(); // Refresh the app to pull fresh products for new workspace
            }}
          >
            {workspaces.map((ws: Workspace) => (
              <option key={ws.id} value={ws.id} style={{color: '#000'}}>
                {ws.name} {ws.owner_id === user?.id ? '(בבעלותך)' : '(שותף)'}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" size={20} />
        </div>

        {isCreating ? (
          <div className="mt-2 flex gap-2">
            <input 
              className="glass-input flex-1" 
              placeholder="שם המרחב החדש..." 
              value={newWsName}
              onChange={e => setNewWsName(e.target.value)}
              autoFocus
            />
            <button 
              className="glass-button success p-2" 
              onClick={handleCreate}
              disabled={loading || !newWsName.trim()}
            >
              <Check size={20} />
            </button>
            <button 
              className="glass-button danger p-2" 
              onClick={() => setIsCreating(false)}
            >
              ביטול
            </button>
          </div>
        ) : (
          <button 
            className="glass-button secondary mt-2 flex items-center justify-center gap-2"
            onClick={() => setIsCreating(true)}
            disabled={isInviting}
          >
            <Plus size={16} />
            <span>הוספת סביבת תפעול נוספת לחשבון</span>
          </button>
        )}

        {/* INVITATION SECTION */}
        {activeWorkspace?.owner_id === user?.id && (
           <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
             {isInviting ? (
               <div className="flex flex-col gap-2 relative">
                 <div className="text-sm font-bold text-accent">הזמן שותף לניהול הסביבה ({activeWorkspace?.name})</div>
                 <div className="text-xs text-secondary mb-1">השותף חייב להירשם לאפליקציה לפני שתוכל לצרף אותו בעזרת המייל שלו.</div>
                 <div className="flex gap-2">
                   <input 
                     type="email"
                     className="glass-input flex-1 p-2" 
                     placeholder="אימייל של השותף..." 
                     value={inviteEmail}
                     onChange={e => setInviteEmail(e.target.value)}
                     autoFocus
                   />
                   <button 
                     className="glass-button success p-2" 
                     onClick={handleInvite}
                     disabled={inviteLoading || !inviteEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)}
                   >
                     <Check size={20} />
                   </button>
                   <button 
                     className="glass-button danger p-2" 
                     onClick={() => setIsInviting(false)}
                   >
                     ביטול
                   </button>
                 </div>
               </div>
             ) : (
                <button 
                  className="glass-button w-full flex items-center justify-center gap-2 mt-1"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--accent-color)' }}
                  onClick={() => setIsInviting(true)}
                  disabled={isCreating}
                >
                  <Users size={16} className="text-accent" />
                  <span className="text-accent text-sm">הזמן שותף / משתמש נוסף לערוך סביבה זו</span>
                </button>
             )}
           </div>
        )}

      </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
