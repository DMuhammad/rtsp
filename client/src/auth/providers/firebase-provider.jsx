import { useState } from 'react';
import { FirebaseAdapter } from '@/auth/adapters/firebase-adapter';
import { AuthContext } from '@/auth/context/auth-context';
import * as authHelper from '@/auth/lib/helpers';

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [auth, setAuth] = useState(authHelper.getAuth());
  const [currentUser, setCurrentUser] = useState();

  const verify = async () => {
    if (auth) {
      try {
        const user = await FirebaseAdapter.verify();
        setCurrentUser(user || undefined);
      } catch {
        saveAuth(undefined);
        setCurrentUser(undefined);
      }
    }
  };

  const saveAuth = (auth) => {
    setAuth(auth);
    if (auth) {
      authHelper.setAuth(auth);
    } else {
      authHelper.removeAuth();
    }
  };

  const login = async (email, password) => {
    try {
      const auth = await FirebaseAdapter.login(email, password);
      saveAuth(auth);
      const user = await getUser();
      setCurrentUser(user);
    } catch (error) {
      saveAuth(undefined);
      throw error;
    }
  };

  const register = async (email, password, password_confirmation) => {
    try {
      await FirebaseAdapter.register(email, password, password_confirmation);
      saveAuth(undefined);
      setCurrentUser(undefined);
    } catch (error) {
      saveAuth(undefined);
      throw error;
    }
  };

  const getUser = async () => {
    return FirebaseAdapter.getCurrentUser();
  };

  const logout = () => {
    FirebaseAdapter.logout();
    saveAuth(undefined);
    setCurrentUser(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        loading,
        setLoading,
        auth,
        saveAuth,
        user: currentUser,
        setUser: setCurrentUser,
        login,
        register,
        getUser,
        logout,
        verify,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
