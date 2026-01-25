import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: "AIzaSyBbTyHWp3qBNPVYdkauEWN9_FCu67govr0",
  authDomain: "abs1-96886.firebaseapp.com",
  projectId: "abs1-96886",
  storageBucket: "abs1-96886.firebasestorage.app",
  messagingSenderId: "139924754132",
  appId: "1:139924754132:web:cc366779227133dab5f541"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with offline persistence settings
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const storage = getStorage(app);