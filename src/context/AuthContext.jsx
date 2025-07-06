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
          const emailFallback = firebaseUser.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@admin.com') ? 'admin' : 'user';
          const assignedRole = tokenResult.claims.role || emailFallback;
          setUser(firebaseUser);
          setRole(assignedRole);
        } catch (error) {
          console.error("AuthContext: Error al obtener el token:", error);
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

  // --- FUNCIÓN DE LOGOUT CORREGIDA ---
  const logout = async () => {
    try {
      // 1. Limpiamos la cookie de sesión en el servidor.
      await fetch('/api/logout', { method: 'POST' });
      
      // 2. Cerramos la sesión de Firebase en el cliente.
      // Esto disparará onAuthStateChanged, que limpiará el estado (user, role) de forma segura.
      await fbSignOut(auth);
      
      // 3. Redirigimos a la página de login.
      router.push('/login');

    } catch (error) {
      console.error('AuthContext: Error durante el logout:', error);
      // Lanzamos el error para que el componente que lo llama pueda manejarlo.
      throw error;
    }
  };

  // Cambiamos el nombre de la función exportada a 'logout' para claridad.
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
