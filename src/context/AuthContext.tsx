import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export type UserRole = 'PRIVATE' | 'BUSINESS' | 'ADMIN';

export interface UserProfile {
  id: string;
  role: UserRole;
}

export interface Workspace {
  id: string;
  name: string;
  owner_id: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspaceId: (id: string) => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  workspaces: [],
  activeWorkspace: null,
  setActiveWorkspaceId: () => {},
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  // New function to switch workspace globally
  const setActiveWorkspaceId = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (ws) {
      setActiveWorkspace(ws);
      localStorage.setItem('home_eco_active_workspace', ws.id);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function loadData(currentUser: User | null) {
      if (!currentUser) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setWorkspaces([]);
          setActiveWorkspace(null);
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        // Fetch ALL workspaces this user has access to
        // Note: once workspace_sharing.sql is applied, we will just select from workspaces. 
        // For now, it will return the one they own.
        const { data: workspacesData } = await supabase
          .from('workspaces')
          .select('*');

        if (mounted) {
          setUser(currentUser);
          setProfile(profileData as UserProfile);
          
          const wsList = (workspacesData || []) as Workspace[];
          setWorkspaces(wsList);
          
          if (wsList.length > 0) {
            // Restore from localStorage if valid, otherwise pick first
            const savedWsId = localStorage.getItem('home_eco_active_workspace');
            const targetWs = wsList.find(w => w.id === savedWsId) || wsList[0];
            setActiveWorkspace(targetWs);
            localStorage.setItem('home_eco_active_workspace', targetWs.id);
          } else {
            setActiveWorkspace(null);
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (mounted) setLoading(false);
      }
    }

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadData(session?.user || null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadData(session?.user || null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, workspaces, activeWorkspace, setActiveWorkspaceId, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
