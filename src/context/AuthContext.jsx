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
  const [loading, setLoading] = useState(true); // El estado de carga inicial es true

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // YA NO hacemos setLoading(true) aquí para evitar parpadeos.
      if (firebaseUser) {
        try {
          const tokenResult = await getIdTokenResult(firebaseUser, true);
          const emailFallback = firebaseUser.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@admin.com') ? 'admin' : 'user';
          const assignedRole = tokenResult.claims.role || emailFallback;

          setUser(firebaseUser);
          setRole(assignedRole);
          console.log('AuthContext: Usuario autenticado, rol:', assignedRole);

        } catch (error) {
          console.error("AuthContext: Error al obtener el token:", error);
          setUser(null);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
        console.log('AuthContext: No hay usuario autenticado.');
      }
      // La carga inicial termina aquí. Esto solo pasa de true a false una vez.
      setLoading(false);
    });

    return () => unsub(); // Limpiar la suscripción
  }, []); // El array vacío asegura que se ejecute solo una vez

  // Tu función signOut ya es bastante robusta, la mantenemos.
  const signOut = async () => {
    console.log('AuthContext: Iniciando signOut...');
    try {
      await fetch('/api/logout', { method: 'POST' });
      console.log('AuthContext: Llamada a /api/logout exitosa.');
      
      await fbSignOut(auth);
      console.log('AuthContext: Firebase signOut completado.');
      
      // El listener onAuthStateChanged se encargará de limpiar el estado,
      // pero una limpieza explícita y redirección inmediata es buena práctica.
      setUser(null);
      setRole(null);
      router.push('/login');

    } catch (error) {
      console.error('AuthContext: Error durante signOut:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut }}>
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