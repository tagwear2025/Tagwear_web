// src/app/components/layout/NavbarUser.jsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Home, Search, Plus, User, Bell } from 'lucide-react';

// La lógica de los enlaces no cambia.
const navLinks = [
  { href: '/app', icon: Home, label: 'Inicio' },
  { href: '/app/pages/LupaUsers', icon: Search, label: 'Buscar' },
  { href: '/app/pages/Notifications', icon: Bell, label: 'Alertas' },
  { href: '/app/pages/Profile', icon: User, label: 'Perfil' },
];

// Componente de ítem para la barra de móvil, rediseñado.
const NavItem = ({ href, icon: Icon, label, isActive }) => (
  <Link href={href} className="flex flex-col items-center justify-center w-full h-full group transition-transform duration-200 ease-out hover:-translate-y-1">
    <div className={`relative flex items-center justify-center w-16 h-8 rounded-full transition-all duration-300 ${isActive ? 'bg-orange-500/20' : ''}`}>
      <Icon 
        size={24} 
        className={`transition-colors duration-200 ${isActive ? 'text-orange-400' : 'text-white/60 group-hover:text-white'}`}
        strokeWidth={isActive ? 2.5 : 2} 
      />
    </div>
    <span className={`text-xs mt-1 transition-colors duration-200 ${isActive ? 'text-orange-400 font-bold' : 'text-white/60 group-hover:text-white'}`}>
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
      {/* Estilos globales necesarios si no están definidos en otro lugar */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lobster&display=swap');
        .font-lobster { font-family: 'Lobster', cursive; }
      `}</style>

      {/* NAVBAR PARA MÓVILES (Bottom Bar) - Rediseñado */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-black/50 backdrop-blur-lg border-t border-white/10 md:hidden">
        <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
          <NavItem {...navLinks[0]} isActive={pathname === navLinks[0].href} />
          <NavItem {...navLinks[1]} isActive={pathname === navLinks[1].href} />
          
          {/* Botón central '+' rediseñado */}
          <div className="flex items-center justify-center">
            <Link href="/app/pages/Profile_Ventas" className="flex items-center justify-center w-16 h-16 -mt-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg shadow-orange-500/30 text-white transform transition-transform duration-300 hover:scale-110 group">
              <Plus size={32} className="transition-transform duration-300 group-hover:rotate-180" />
            </Link>
          </div>

          <NavItem {...navLinks[2]} isActive={pathname === navLinks[2].href} />
          <NavItem {...navLinks[3]} isActive={pathname === navLinks[3].href} />
        </div>
      </nav>

      {/* NAVBAR PARA DESKTOP (Top Bar) - Rediseñado */}
      <header className="hidden md:flex sticky top-0 z-50 bg-[#111] shadow-lg shadow-black/20 border-b border-white/10 px-6 py-3 items-center justify-between">
        <Link href="/app" className="flex items-center gap-3">
            <img src="/icons/bola8.png" alt="Tagwear Logo" className="h-9 w-9" />
            <span className="font-lobster text-3xl text-white">Tagwear</span>
        </Link>
        <nav className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-full p-1">
            {navLinks.map(({ href, label }) => (
                <Link 
                  key={href} 
                  href={href} 
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-300
                    ${pathname === href 
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20' 
                      : 'text-white/70 hover:bg-white/10'
                    }`
                  }
                >
                    {label}
                </Link>
            ))}
        </nav>
        <Link href="/app/pages/Profile_Ventas" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold px-5 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/20">
            <Plus size={20} />
            <span>Vender</span>
        </Link>
      </header>
    </>
  );
}