import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

export const FirebaseAdapter = {
  async login(email, password) {
    console.log(`FirebaseAdapter: attempting login with email: ${email}`);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const { token } = await user.getIdTokenResult();

      console.log('FirebaseAdapter: Login successful');

      return {
        access_token: token,
        refresh_token: user.refreshToken,
      };
    } catch (err) {
      console.error(`FirebaseAdapter: Unexpected login error: ${err}`);
      throw err;
    }
  },

  async register(email, password, password_confirmation) {
    if (password !== password_confirmation) {
      throw new Error('Password does not match');
    }

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      console.log('FirebaseAdapter: Register successful');

      return user.email;
    } catch (error) {
      console.error(`FirebaseAdapter: Unexpected register error: ${error}`);
      throw error;
    }
  },

  async requestPasswordReset(email) {},

  async resetPassword(password, password_confirmation) {},

  getCurrentUser() {
    const user = auth.currentUser;
    if (!user.uid) return null;

    return {
      id: user.uid,
      email: user.email || '',
      email_verified: user.emailVerified,
      display_name: user.displayName || '',
      phone: user.phoneNumber || '',
    };
  },

  async verify() {
    const user = setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('Persistence mode set to local.');
        return auth.currentUser;
      })
      .catch((error) => {
        console.error('Error setting persistence mode:', error);
      });

    return user;
  },

  async logout() {
    await signOut(auth);
  },
};
