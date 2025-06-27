// src/app/components/layout/NavbarUser.jsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Asegúrate que la ruta al contexto sea correcta

const links = [
  { href: '/app',         label: 'Inicio' },
  { href: '/app/courses', label: 'Cursos' },
  { href: '/app/profile', label: 'Mi Perfil' } // Asegúrate que esta ruta exista
];

export default function NavbarUser() {
  const path = usePathname();
  const { user, signOut } = useAuth(); // Obtén signOut del contexto

  // Opcional: Mostrar algo mientras carga o si no hay usuario (aunque el layout ya debería manejar esto)
  // if (!user) return null;

  return (
    <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-gray-800">MedCursos</h1> {/* Ajuste de color */}
      <ul className="flex space-x-4">
        {links.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              // Clase activa más específica para evitar activar '/' para todas las subrutas
              className={path === l.href || (l.href !== '/app' && path.startsWith(l.href)) ? 'text-blue-600 font-semibold' : 'text-gray-600 hover:text-gray-900'}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      {/* Asegúrate de que el botón llama a signOut */}
      <button
        onClick={signOut} // Llama a la función signOut del contexto
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out" // Estilo mejorado
      >
        Cerrar sesión
      </button>
    </nav>
  );
}
