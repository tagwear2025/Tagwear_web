'use client';

// Importaciones necesarias. Se elimina useRouter porque ya no se usa aquí.
import { useAuth } from 'src/context/AuthContext';
import NavbarAdmin from '@/app/components/layout/NavbarAdmin';
import { ThemeProvider } from '@/context/ThemeContext';

export default function AdminLayout({ children }) {
  // Solo necesitamos el estado 'loading' del contexto.
  // El middleware ya se encargó de verificar el 'user' y el 'role'.
  const { loading } = useAuth();

  // Si el contexto está en su proceso de carga inicial, mostramos un loader.
  // Esto evita que se renderice contenido incompleto.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-xl font-medium text-gray-700 dark:text-gray-300 animate-pulse">
          Verificando credenciales...
        </div>
      </div>
    );
  }

  // Una vez que loading es false, significa que el contexto está listo
  // y podemos renderizar el layout del administrador con su contenido.
  return (
    <ThemeProvider>
      {/* Ya no pasamos 'onSignOut' como prop. 
        El componente NavbarAdmin obtiene la función 'signOut' directamente del contexto 'useAuth'.
      */}
      <NavbarAdmin>
        {children}
      </NavbarAdmin>
    </ThemeProvider>
  );
}