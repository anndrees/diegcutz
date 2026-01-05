import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  requiresPasswordChange: boolean;
  requiresProfileCompletion: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  checkAccountStatus: () => Promise<{ isBanned: boolean; isRestricted: boolean; banReason?: string; restrictionEndsAt?: string }>;
  clearPasswordChangeRequirement: () => void;
}

interface Profile {
  id: string;
  full_name: string;
  username: string;
  contact_method: string;
  contact_value: string;
  is_banned?: boolean;
  ban_reason?: string;
  banned_at?: string;
  is_restricted?: boolean;
  restriction_ends_at?: string;
  restricted_at?: string;
  temp_password_active?: boolean;
  profile_complete?: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  requiresPasswordChange: false,
  requiresProfileCompletion: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  checkAccountStatus: async () => ({ isBanned: false, isRestricted: false }),
  clearPasswordChangeRequirement: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [requiresPasswordChange, setRequiresPasswordChange] = useState(false);
  const [requiresProfileCompletion, setRequiresProfileCompletion] = useState(false);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      // Check if user is banned
      if (data.is_banned) {
        // Force sign out banned users
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return null;
      }
      
      // Check if restriction has expired
      if (data.is_restricted && data.restriction_ends_at) {
        const endTime = new Date(data.restriction_ends_at);
        if (new Date() >= endTime) {
          // Restriction expired, remove it
          await supabase
            .from("profiles")
            .update({
              is_restricted: false,
              restriction_ends_at: null,
              restricted_at: null,
            })
            .eq("id", userId);
          
          data.is_restricted = false;
          data.restriction_ends_at = null;
          data.restricted_at = null;
        }
      }
      
      // Check if temp password is active
      if (data.temp_password_active) {
        setRequiresPasswordChange(true);
      } else {
        setRequiresPasswordChange(false);
      }
      
      // Check if profile is complete
      if (data.profile_complete === false) {
        setRequiresProfileCompletion(true);
      } else {
        setRequiresProfileCompletion(false);
      }
      
      setProfile(data);
      return data;
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const checkAccountStatus = async () => {
    if (!user) {
      return { isBanned: false, isRestricted: false };
    }

    const { data } = await supabase
      .from("profiles")
      .select("is_banned, ban_reason, is_restricted, restriction_ends_at")
      .eq("id", user.id)
      .single();

    if (!data) {
      return { isBanned: false, isRestricted: false };
    }

    // Check if banned
    if (data.is_banned) {
      return { 
        isBanned: true, 
        isRestricted: false,
        banReason: data.ban_reason || "Tu cuenta ha sido suspendida."
      };
    }

    // Check if restricted and not expired
    if (data.is_restricted && data.restriction_ends_at) {
      const endTime = new Date(data.restriction_ends_at);
      if (new Date() < endTime) {
        return { 
          isBanned: false, 
          isRestricted: true,
          restrictionEndsAt: data.restriction_ends_at
        };
      }
    }

    return { isBanned: false, isRestricted: false };
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRequiresPasswordChange(false);
    setRequiresProfileCompletion(false);
  };

  const clearPasswordChangeRequirement = () => {
    setRequiresPasswordChange(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      loading, 
      requiresPasswordChange,
      requiresProfileCompletion,
      signOut, 
      refreshProfile, 
      checkAccountStatus,
      clearPasswordChangeRequirement 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);