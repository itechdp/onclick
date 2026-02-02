import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppUser, LoginCredentials, TeamMember } from '../types';
import { supabaseAuthService } from '../services/supabaseAuthService';
import { teamMemberService } from '../services/teamMemberService';
import { supabase } from '../config/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: AppUser | null;
  teamMember: TeamMember | null;
  isTeamMember: boolean;
  pageAccess: string[];
  effectiveUserId: string | null; // Admin's user ID for team members, own user ID for regular users
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [pageAccess, setPageAccess] = useState<string[]>([]);
  const [effectiveUserId, setEffectiveUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // First, check if there's a team member session in localStorage
        const teamMemberSession = localStorage.getItem('teamMemberSession');
        if (teamMemberSession) {
          try {
            console.log('👥 Found team member session in localStorage');
            const parsedSession = JSON.parse(teamMemberSession);
            // Verify the session is still valid by checking if team member still exists
            const teamMemberData = await teamMemberService.getTeamMemberById(parsedSession.id);
            if (teamMemberData && teamMemberData.isActive) {
              console.log('✅ Team member session valid, restoring...');
              setTeamMember(teamMemberData);
              setPageAccess(teamMemberData.permissions?.pageAccess || []);
              setEffectiveUserId(teamMemberData.adminUserId);
              setLoading(false);
              return; // Exit early - team member session restored
            } else {
              console.log('❌ Team member session invalid, clearing...');
              // Invalid session, clear it
              localStorage.removeItem('teamMemberSession');
            }
          } catch (err) {
            console.error('Error parsing team member session:', err);
            localStorage.removeItem('teamMemberSession');
          }
        }

        // If no team member session, check for regular user session via Supabase
        console.log('🔍 Checking for Supabase user session...');
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session data:', session ? 'Session exists' : 'No session');
        
        if (session?.user) {
          console.log('✅ Found active Supabase session');
          
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => {
              console.log('⏱️ User profile fetch timed out in initializeAuth');
              resolve(null);
            }, 3000);
          });
          
          const currentUser = await Promise.race([
            supabaseAuthService.getCurrentUser(),
            timeoutPromise
          ]);
          
          if (currentUser) {
            console.log('✅ User profile loaded:', currentUser.email);
            setUser(currentUser);
            setEffectiveUserId(currentUser.id);
          } else {
            console.log('⚠️ Could not load user profile, but session exists');
          }
        } else {
          console.log('❌ No active session found');
        }
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 Auth state change:', event, 'Has session:', !!session);
      
      // Ignore INITIAL_SESSION event - we handle it in initializeAuth
      if (event === 'INITIAL_SESSION') {
        console.log('ℹ️ Ignoring INITIAL_SESSION - handled by initializeAuth');
        return;
      }
      
      if (event === 'SIGNED_IN' && session) {
        console.log('✅ SIGNED_IN event - fetching user profile');
        
        try {
          const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => {
              console.log('⏱️ User profile fetch timed out');
              resolve(null);
            }, 3000);
          });
          
          const currentUser = await Promise.race([
            supabaseAuthService.getCurrentUser(),
            timeoutPromise
          ]);
          
          // Only set user if we got a valid user object
          if (currentUser) {
            console.log('✅ User profile loaded after SIGNED_IN');
            setUser(currentUser);
            setEffectiveUserId(currentUser.id);
          } else {
            console.log('⚠️ Could not load user profile after SIGNED_IN');
          }
        } catch (error) {
          console.error('❌ Error loading user profile after SIGNED_IN:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 SIGNED_OUT event - clearing user state');
        setUser(null);
        setTeamMember(null);
        setPageAccess([]);
        setEffectiveUserId(null);
        localStorage.removeItem('teamMemberSession');
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refreshed successfully, re-fetch user
        console.log('🔄 Token refreshed, re-fetching user');
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setEffectiveUserId(currentUser.id);
        }
      } else if (event === 'USER_UPDATED') {
        // User data updated, refresh
        console.log('📝 User updated, re-fetching');
        const currentUser = await supabaseAuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setEffectiveUserId(currentUser.id);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      
      // First, try team member authentication
      try {
        const teamMemberAuth = await teamMemberService.authenticateTeamMember(
          credentials.email,
          credentials.password
        );
        
        if (teamMemberAuth) {
          // Team member login successful - use admin's user ID for data access
          console.log('Team member authenticated:', teamMemberAuth);
          console.log('Setting pageAccess to:', teamMemberAuth.permissions?.pageAccess);
          
          // Store team member session in localStorage
          const sessionData = {
            id: teamMemberAuth.id,
            email: teamMemberAuth.email,
            fullName: teamMemberAuth.fullName,
            adminUserId: teamMemberAuth.adminUserId,
          };
          localStorage.setItem('teamMemberSession', JSON.stringify(sessionData));
          
          setTeamMember(teamMemberAuth);
          setPageAccess(teamMemberAuth.permissions?.pageAccess || []);
          setEffectiveUserId(teamMemberAuth.adminUserId); // Use admin's ID for queries
          setUser(null);
          
          console.log('State set. pageAccess should now be:', teamMemberAuth.permissions?.pageAccess);
          
          toast.success(`Welcome, ${teamMemberAuth.fullName}!`);
          return;
        }
      } catch (teamMemberError) {
        console.log('Not a team member, trying regular auth:', teamMemberError);
      }
      
      // If not a team member, try regular user authentication
      const { user: authenticatedUser, error } = await supabaseAuthService.signin(credentials);
      
      if (error) {
        toast.error(error);
        throw new Error(error);
      }

      if (authenticatedUser) {
        setUser(authenticatedUser);
        setTeamMember(null);
        setPageAccess([]); // Admin/regular users have full access
        setEffectiveUserId(authenticatedUser.id); // Use own ID
        
        // Check if subscription is expired
        if (authenticatedUser.role !== 'admin' && authenticatedUser.subscriptionStatus === 'expired') {
          toast.error('Your subscription has expired. Please subscribe to continue.', { duration: 5000 });
        } else {
          toast.success(`Welcome back, ${authenticatedUser.displayName}!`);
          
          // Show subscription warning if needed
          const daysRemaining = supabaseAuthService.getDaysRemaining(authenticatedUser);
          if (daysRemaining <= 5 && daysRemaining > 0) {
            setTimeout(() => {
              toast(
                `Your ${authenticatedUser.subscriptionStatus === 'trial' ? 'trial' : 'subscription'} expires in ${daysRemaining} days!`,
                { duration: 6000, icon: '⚠️' }
              );
            }, 2000);
          }
        }
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (teamMember) {
        // Team member logout - clear local state and localStorage
        localStorage.removeItem('teamMemberSession');
        setTeamMember(null);
        setPageAccess([]);
        setEffectiveUserId(null);
      } else {
        // Regular user logout
        await supabaseAuthService.signout();
        setUser(null);
        setEffectiveUserId(null);
      }
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const value = {
    user,
    teamMember,
    isTeamMember: !!teamMember,
    pageAccess,
    effectiveUserId,
    loading,
    login,
    logout,
    isAuthenticated: !!(user || teamMember)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
