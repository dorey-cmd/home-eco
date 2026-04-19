import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Building, Plus, Users, ChevronDown, Check, ChevronRight, Edit2, Trash2 } from 'lucide-react';
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
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Edit/Rename state
  const [isEditing, setIsEditing] = useState(false);
  const [editWsName, setEditWsName] = useState('');

  // When active workspace changes, reset edit forms
  useEffect(() => {
    if (activeWorkspace) {
       setEditWsName(activeWorkspace.name);
       setIsEditing(false);
       setIsInviting(false);
    }
  }, [activeWorkspace]);

  const isOwner = activeWorkspace?.owner_id === user?.id;
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
        body: { email: inviteEmail, workspaceId: activeWorkspace.id, role: inviteRole }
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

  const handleRename = async () => {
    if (!activeWorkspace || !editWsName.trim() || !isOwner) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('workspaces').update({ name: editWsName.trim() }).eq('id', activeWorkspace.id);
      if (error) throw error;
      alert('השם עודכן בהצלחה!');
      window.location.reload();
    } catch (e: any) {
      alert('שגיאה בעדכון שם: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeWorkspace || !isOwner) return;
    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את סביבת התפעול "${activeWorkspace.name}" לחלוטין? פעולה זו בלתי הפיכה!`)) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('workspaces').delete().eq('id', activeWorkspace.id);
      if (error) throw error;
      alert('סביבת התפעול נמחקה בהצלחה.');
      window.location.reload();
    } catch (e: any) {
      alert('שגיאה במחיקת הסביבה: ' + e.message);
    } finally {
      setLoading(false);
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
            style={{ fontSize: '1.1rem', padding: '12px' }}
            value={activeWorkspace?.id || ''}
            onChange={(e) => {
                setActiveWorkspaceId(e.target.value);
                window.location.reload(); // Refresh the app to pull fresh products for new workspace
            }}
          >
            {workspaces.map((ws: Workspace) => (
              <option key={ws.id} value={ws.id}>
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
        {isOwner && (
           <div className="mt-6">
             <div className="flex items-center gap-2 mb-3">
               <Users size={18} className="text-accent" />
               <h3 className="font-bold text-accent m-0">שותפים בסביבה ({activeWorkspace?.name})</h3>
             </div>
             
             <div className="glass-panel" style={{ padding: '16px', background: 'rgba(255,255,255,0.5)' }}>
               {isInviting ? (
                 <div className="flex flex-col gap-3 animate-fade-in">
                   <div className="text-xs text-secondary mb-1">השותף חייב להירשם לאפליקציה לפני שתוכל לצרף אותו בעזרת המייל שלו.</div>
                   
                   <div className="flex flex-col gap-2">
                     <label className="text-xs font-bold text-secondary">סוג הרשאה:</label>
                     <select 
                       className="glass-input p-2 w-full" 
                       value={inviteRole}
                       onChange={e => setInviteRole(e.target.value as 'MEMBER' | 'VIEWER')}
                     >
                       <option value="MEMBER">שותף מלא (ניהול מוצרים)</option>
                       <option value="VIEWER">קניות בלבד (צפייה ועריכת קניות)</option>
                     </select>
                   </div>

                   <div className="flex flex-col gap-2 mt-1">
                     <label className="text-xs font-bold text-secondary">כתובת אימייל:</label>
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
                 </div>
               ) : (
                  <button 
                    className="glass-button w-full flex items-center justify-center gap-2"
                    style={{ background: 'white', border: '1px dashed var(--accent-color)', boxShadow: 'none' }}
                    onClick={() => setIsInviting(true)}
                    disabled={isCreating || isEditing}
                  >
                    <Plus size={16} className="text-accent" />
                    <span className="text-accent font-bold">הזמן שותף חדש</span>
                  </button>
               )}
             </div>
           </div>
        )}

        {/* OWNER ACTIONS SECTION (Rename & Delete) */}
        {isOwner && activeWorkspace && (
           <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--glass-border)' }}>
             <h3 className="font-bold text-secondary mb-3 text-sm">הגדרות מתקדמות למרחב מנהל</h3>
             {isEditing ? (
               <div className="glass-panel p-3 animate-fade-in">
                   <div className="text-sm font-bold text-accent mb-2">שינוי שם הסביבה</div>
                   <div className="flex gap-2">
                     <input 
                       className="glass-input flex-1 p-2" 
                       value={editWsName}
                       onChange={e => setEditWsName(e.target.value)}
                       autoFocus
                     />
                     <button className="glass-button success p-2" onClick={handleRename} disabled={loading || !editWsName.trim()}>
                       <Check size={20} />
                     </button>
                     <button className="glass-button danger p-2" onClick={() => setIsEditing(false)}>
                       ביטול
                     </button>
                   </div>
               </div>
             ) : (
               <div className="flex gap-2">
                  <button 
                    className="glass-button secondary flex-1 flex items-center justify-center gap-2"
                    onClick={() => setIsEditing(true)}
                    disabled={isCreating || isInviting}
                  >
                    <Edit2 size={16} /> שינוי שם
                  </button>
                  {workspaces.length > 1 && (
                    <button 
                      className="glass-button danger flex-1 flex items-center justify-center gap-2"
                      onClick={handleDelete}
                      disabled={loading || isCreating || isInviting}
                      style={{ opacity: 0.9, background: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c' }}
                    >
                      <Trash2 size={16} /> מחיקת הסביבה
                    </button>
                  )}
               </div>
             )}
           </div>
        )}

      </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
