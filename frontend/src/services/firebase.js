import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBoOAjwPlK6LXoj-v1yAYwIoTLf1na31hs",
  authDomain: "wildwoods-zoo-auth-v1.firebaseapp.com",
  projectId: "wildwoods-zoo-auth-v1",
  storageBucket: "wildwoods-zoo-auth-v1.firebasestorage.app",
  messagingSenderId: "971321563000",
  appId: "1:971321563000:web:c4c76f7ba5063f31cb5a8d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
