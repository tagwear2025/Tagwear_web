// src/app/components/layout/NavbarUser.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Search, Plus, User, Bell } from 'lucide-react';

// NOTA: He añadido 'Notificaciones' para crear un diseño balanceado y profesional.
// Puedes cambiar el icono o la ruta fácilmente.
const navLinks = [
  { href: '/app', icon: Home, label: 'Inicio' },
  { href: '/app/pages/LupaUsers', icon: Search, label: 'Buscar' },
  { href: '/app/pages/Notifications', icon: Bell, label: 'Alertas' }, // Nuevo item para balancear
  { href: '/app/pages/Profile', icon: User, label: 'Perfil' },
];

// Componente para cada item de la barra de navegación, para no repetir código.
const NavItem = ({ href, icon: Icon, label, isActive }) => (
  <Link href={href} className="flex flex-col items-center justify-center w-full h-full group">
    <div className="relative">
      {/* Indicador de página activa (punto superior) */}
      <div className={`absolute -top-2 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-blue-500 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
      <Icon 
        size={26} 
        className={`transition-colors duration-200 ${isActive ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500'}`}
        strokeWidth={isActive ? 2.5 : 2} 
      />
    </div>
    <span className={`text-xs mt-1 transition-colors duration-200 ${isActive ? 'text-blue-500 font-semibold' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-500'}`}>
      {label}
    </span>
  </Link>
);


export default function NavbarUser() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <>
      {/* NAVBAR PARA MÓVILES (Bottom Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 md:hidden">
        <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
          <NavItem {...navLinks[0]} isActive={pathname === navLinks[0].href} />
          <NavItem {...navLinks[1]} isActive={pathname === navLinks[1].href} />
          
          {/* Botón central '+' */}
          <div className="flex items-center justify-center">
            <Link href="/app/pages/Profile_Ventas" className="inline-flex items-center justify-center w-14 h-14 -mt-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg shadow-blue-500/30 text-white transform transition-transform duration-300 hover:scale-110 group">
              <Plus size={28} className="transition-transform duration-300 group-hover:rotate-90" />
            </Link>
          </div>

          <NavItem {...navLinks[2]} isActive={pathname === navLinks[2].href} />
          <NavItem {...navLinks[3]} isActive={pathname === navLinks[3].href} />
        </div>
      </nav>

      {/* NAVBAR PARA DESKTOP (Top Bar) */}
      <header className="hidden md:flex sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md px-6 py-3 items-center justify-between">
        <Link href="/app" className="flex items-center gap-2">
            <img src="/icons/bola8.png" alt="Tagwear Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-800 dark:text-white">Tagwear</span>
        </Link>
        <nav className="flex items-center gap-2">
            {navLinks.map(({ href, label }) => (
                <Link key={href} href={href} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === href ? 'bg-gray-900 text-white dark:bg-gray-200 dark:text-black' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {label}
                </Link>
            ))}
             <Link href="/app/pages/Profile_Ventas" className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-full transition-transform transform hover:scale-105 ml-4">
                <Plus size={20} />
                <span>Vender</span>
            </Link>
        </nav>
      </header>
    </>
  );
}
