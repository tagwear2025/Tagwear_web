// src/context/AuthContext.jsx
'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, getIdTokenResult, signOut as fbSignOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          const assignedRole = tokenResult.claims.role || 'user';
          
          setUser(firebaseUser);
          setRole(assignedRole);
        } catch (error) {
          console.error("AuthContext: Error al obtener el token del usuario:", error);
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const logout = async () => {
    // 1. Actualiza el estado local inmediatamente.
    // Esto le dice a todos los componentes que el usuario se ha ido,
    // previniendo re-renderizados con datos obsoletos.
    setUser(null);
    setRole(null);

    try {
      // 2. Ejecuta las operaciones de limpieza en paralelo.
      await Promise.all([
        fetch('/api/logout', { method: 'POST' }), // Limpia la cookie del servidor
        fbSignOut(auth) // Limpia el estado de Firebase en el cliente
      ]);
    } catch (error) {
      console.error('AuthContext: Ocurrió un error durante las operaciones de logout, pero la sesión del cliente ha sido cerrada.', error);
      // No lanzamos un error aquí porque el estado del cliente ya está limpio
      // y la redirección es lo más importante.
    } finally {
      // 3. Redirige SIEMPRE al final.
      // Usamos `replace` para que el usuario no pueda volver a la página anterior
      // con el botón "atrás" del navegador.
      router.replace('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}
