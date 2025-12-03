import { useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!auth) return;

    const initAuth = async () => {
      try {
        // CORRECCIÓN #3: Acceso seguro a variable global
        // Verificamos explícitamente en el objeto window para evitar errores de referencia
        // y permitir la inyección de tokens si el entorno lo soporta.
        const customToken = window.__initial_auth_token;

        if (customToken) {
          await signInWithCustomToken(auth, customToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Fallo Autenticación", e);
        setAuthError("No se pudo conectar a Firebase.");
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setAuthError(null);
    });

    return () => unsubscribe();
  }, []);

  return { user, authError };
};