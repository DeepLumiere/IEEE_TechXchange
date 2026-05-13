import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDLJhVfrpk8HZAkfwp9z6lNDNvzU9VBgno",
  authDomain: "cipherquest-ieee.firebaseapp.com",
  projectId: "cipherquest-ieee",
  storageBucket: "cipherquest-ieee.firebasestorage.app",
  messagingSenderId: "134509379256",
  appId: "1:134509379256:web:06d8070418d08e9e09fe4d",
  measurementId: "G-43MZWE1YPB"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
