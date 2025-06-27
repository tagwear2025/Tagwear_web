// src/context/AuthContext.jsx
'use client';
import { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, getIdTokenResult, signOut as fbSignOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
// Importa cookies de 'js-cookie' para eliminar cookies no HttpOnly si es necesario
// import Cookies from 'js-cookie'; // Descomentar si necesitas eliminar otras cookies no HttpOnly

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true); // Inicia carga al detectar cambio
      if (firebaseUser) {
        try {
          const tokenResult = await getIdTokenResult(firebaseUser, true); // Forzar refresh
          const emailFallback = firebaseUser.email === (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@admin.com') ? 'admin' : 'user';
          const assignedRole = tokenResult.claims.role || emailFallback;

          setUser(firebaseUser);
          setRole(assignedRole);
          // Actualiza la cookie 'role' en el cliente (si es necesario y no HttpOnly)
          // document.cookie = `role=${assignedRole}; path=/; max-age=86400; SameSite=Strict; Secure=${process.env.NODE_ENV === 'production'}`;
          console.log('AuthContext: User authenticated, role:', assignedRole);
        } catch (error) {
          console.error("AuthContext: Error getting token result:", error);
          // Si hay error obteniendo token, desloguear localmente
          setUser(null);
          setRole(null);
          // document.cookie = "role=; path=/; max-age=0"; // Limpiar cookie de rol cliente
        }
      } else {
        setUser(null);
        setRole(null);
        // Limpiar la cookie 'role' del cliente al desloguear
        // document.cookie = "role=; path=/; max-age=0";
        console.log('AuthContext: No user authenticated.');
      }
      setLoading(false); // Finaliza carga
    });
    return () => unsub(); // Limpiar suscripción al desmontar
  }, []); // Ejecutar solo una vez al montar

  const signOut = async () => {
    setLoading(true); // Indicar que el proceso de logout está en curso
    console.log('AuthContext: Iniciando signOut...');
    try {
      // 1. Llamar a la API para limpiar las cookies del servidor (__session y role)
      const response = await fetch('/api/logout', { method: 'POST' });
      if (!response.ok) {
        // Intenta continuar incluso si falla la limpieza de cookies, pero loguea el error
        console.error('AuthContext: Falló la llamada a /api/logout', await response.text());
      } else {
        console.log('AuthContext: Llamada a /api/logout exitosa.');
      }

      // 2. Cerrar sesión en Firebase (lado del cliente)
      await fbSignOut(auth);
      console.log('AuthContext: Firebase signOut completado.');

      // 3. Limpiar estado local explícitamente (aunque onAuthStateChanged también lo hará)
      setUser(null);
      setRole(null);

      // 4. Redirigir a la página de login
      console.log('AuthContext: Redirigiendo a /login...');
      router.push('/login'); // Usa push para permitir volver atrás si es necesario (o replace si no)

    } catch (error) {
      console.error('AuthContext: Error durante signOut:', error);
      // Manejar el error como sea apropiado, quizás mostrar un mensaje al usuario
    } finally {
      // Asegúrate de que loading se ponga en false eventualmente,
      // aunque la redirección debería ocurrir antes.
      // Podrías quitar setLoading(true) si la redirección es inmediata.
      // setLoading(false);
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
