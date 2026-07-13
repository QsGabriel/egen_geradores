import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types';
import { getPermissionsForLegacyRole, getRoleLabel } from '../utils/permissions';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*, custom_roles(id, name, permissions)')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao carregar perfil:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const customRole = (data as any).custom_roles;
        const permissions: string[] = customRole?.permissions
          || getPermissionsForLegacyRole(data.role as UserRole);
        const roleName: string | undefined = customRole?.name
          || getRoleLabel(data.role as UserRole);

        setUserProfile({
          id: data.id,
          email: data.email,
          name: data.name,
          phone: data.phone || undefined,
          avatar_url: data.avatar_url || undefined,
          qrcode_url: data.qrcode_url || undefined,
          cpf: data.cpf || undefined,
          data_nascimento: data.data_nascimento || undefined,
          role: data.role,
          department: data.department || '',
          customRoleId: data.custom_role_id || undefined,
          permissions,
          roleName,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
      setIsInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const signUp = async (
    email: string,
    password: string,
    name?: string,
    department?: string,
  ) => {
    if (!department) {
      throw new Error('Departamento é obrigatório.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          department,
        },
      },
    });

    if (data.user && !error) {
      await loadUserProfile(data.user.id);
    }

    return { data, error };
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUserProfile(null);
    return { error };
  };

  const updateUserRole = async (userId: string, customRoleId: string | null) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ custom_role_id: customRoleId, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      if (userId === user?.id) {
        await loadUserProfile(userId);
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao atualizar cargo:', error);
      return { success: false, error };
    }
  };

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  }, [user, loadUserProfile]);

  return {
    user,
    session,
    userProfile,
    loading,
    isInitialized,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateUserRole,
    refreshProfile,
    authenticated: !!session,
  };
};
