import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export type UserRole = 'PRIVATE' | 'BUSINESS';

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
  workspace: Workspace | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  workspace: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData(currentUser: User | null) {
      if (!currentUser) {
        if (mounted) {
          setUser(null);
          setProfile(null);
          setWorkspace(null);
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

        // Fetch workspaces
        const { data: workspaceData } = await supabase
          .from('workspaces')
          .select('*')
          .eq('owner_id', currentUser.id)
          .limit(1)
          .single();

        if (mounted) {
          setUser(currentUser);
          setProfile(profileData as UserProfile);
          setWorkspace(workspaceData as Workspace);
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
    <AuthContext.Provider value={{ user, profile, workspace, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
