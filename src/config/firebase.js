import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB9g809B-1ahP4ZYz3Mck0-vjBLT6N9srg",
  authDomain: "movimientos-88740.firebaseapp.com",
  projectId: "movimientos-88740",
  storageBucket: "movimientos-88740.firebasestorage.app",
  messagingSenderId: "300496648792",
  appId: "1:300496648792:web:f02f1832a2c1230df7282d"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Error inicializando Firebase:", e);
}

export { auth, db, app };
export const APP_ID = 'stock-cine-multiplex-v1';