'use client';
import { useEffect } from 'react';
import { useAuth } from 'src/context/AuthContext';
import { useRouter } from 'next/navigation';
// La importación de NavbarAdmin viene desde la ruta corregida en tu código.
import NavbarAdmin from '@/app/components/layout/NavbarAdmin';
import { ThemeProvider } from '@/context/ThemeContext'; // Importamos ThemeProvider aquí también

export default function AdminLayout({ children }) {
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      const isAdmin = role === 'admin';
      if (!user) {
        router.replace('/login');
        return;
      }
      if (!isAdmin) {
        router.replace('/app');
      }
    }
  }, [loading, user, role, router]);

  if (loading) {
    return <div className="p-8">Cargando...</div>;
  }
  
  // Envolvemos el layout específico del admin con el ThemeProvider
  // para asegurar que el contexto del tema esté disponible.
  return (
    <ThemeProvider>
        {/* Pasamos el signOut al Navbar para que el botón funcione desde allí */}
        {/* Aquí asumimos que NavbarAdmin ya está renderizando el resto del layout */}
        <NavbarAdmin onSignOut={signOut}>
            {children}
        </NavbarAdmin>
    </ThemeProvider>
  );
}