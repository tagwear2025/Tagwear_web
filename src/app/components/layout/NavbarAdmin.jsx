'use client';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useTheme } from '@/context/ThemeContext';
import {
  Moon, Sun, Home, Users,
  Wallet, QrCode, Bell, LogOut
} from 'lucide-react';

export default function AdminNavbar({ children }) {
  // ✅ CORRECCIÓN: Cambiamos 'signOut' por 'logout' para que coincida con el AuthContext.
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isDark, toggleTheme, isLoaded } = useTheme();
  const [isMobile, setIsMobile] = useState(false);

  const bellButtonRef = useRef(null);
  const notificationsPanelRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleNotifications = () => setShowNotifications(!showNotifications);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsPanelRef.current &&
        !notificationsPanelRef.current.contains(event.target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let unsubscribe;
    if (user) {
      unsubscribe = onSnapshot(collection(db, 'solicitudes'), (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotifications(data);
      }, (error) => {
        console.error('Error fetching real-time notifications:', error);
      });
    }
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  const navItems = [
    { href: '/admin', label: 'Inicio', icon: <Home className="w-5 h-5" /> },
    { href: '/admin/users', label: 'Usuarios', icon: <Users className="w-5 h-5" /> },
    { href: '/admin/solicitudes', label: 'Solicitudes', icon: <Wallet className="w-5 h-5" /> },
    { href: '/admin/qr-gestion', label: 'QR', icon: <QrCode className="w-5 h-5" /> },
  ];

  const headerStyle = { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderBottomColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f9fafb' : '#111827' };
  const sidebarStyle = { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderRightColor: isDark ? '#374151' : '#e5e7eb' };
  const mainStyle = { backgroundColor: isDark ? '#111827' : '#f9fafb' };
  const notificationPanelStyle = { backgroundColor: isDark ? '#2d3748' : '#ffffff', borderColor: isDark ? '#4a5568' : '#e2e8f0', color: isDark ? '#e2e8f0' : '#4a5568' };
  const notificationItemStyle = { borderBottomColor: isDark ? '#4a5568' : '#e2e8f0' };
  const emptyNotificationStyle = { color: isDark ? '#cbd5e0' : '#718096' };
  
  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: isDark ? '#111827' : '#f9fafb' }}>
        <div className="h-16 fixed top-0 left-0 w-full z-40 animate-pulse" style={{ backgroundColor: isDark ? '#1f2937' : '#f3f4f6' }}></div>
        <div className="p-8 pt-24 text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <>
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30" onClick={toggleSidebar}></div>
      )}

      <header className="border-b px-4 py-3 flex justify-between items-center fixed top-0 left-0 w-full z-40 shadow-sm transition-colors duration-200" style={headerStyle}>
        <div className="flex items-center gap-4">
          <div className="cursor-pointer" onClick={toggleSidebar}>
            <div className={`w-6 h-0.5 mb-1 transition-all duration-300 ${isDark ? 'bg-gray-300' : 'bg-gray-600'} ${isSidebarOpen ? 'rotate-45 translate-y-1.5' : ''}`}></div>
            <div className={`w-6 h-0.5 transition-all duration-300 ${isDark ? 'bg-gray-300' : 'bg-gray-600'} ${isSidebarOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-6 h-0.5 mt-1 transition-all duration-300 ${isDark ? 'bg-gray-300' : 'bg-gray-600'} ${isSidebarOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
          </div>
          <div className="flex items-center gap-1">
            <img src="/icons/bola8.png" alt="logo" className="w-7" />
            <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>Tagwear</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className={`p-2 rounded-lg transition-all duration-200 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {isDark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
          
          {!loading && user && (
            <>
              <button ref={bellButtonRef} onClick={toggleNotifications} className={`relative p-2 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <Bell className={`w-6 h-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
                {notifications.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">{notifications.length > 9 ? '9+' : notifications.length}</span>}
              </button>

              {showNotifications && (
                <div ref={notificationsPanelRef} className="absolute right-4 top-16 w-80 max-h-[80vh] overflow-y-auto rounded-lg shadow-xl border z-50 flex flex-col" style={notificationPanelStyle}>
                  <h3 className={`text-lg font-semibold px-4 py-3 border-b ${isDark ? 'border-gray-700 text-blue-400' : 'border-gray-200 text-blue-600'}`}>Notificaciones</h3>
                  <div className="flex-grow p-2">
                    {notifications.length === 0 ? (
                      <p className="text-center p-4" style={emptyNotificationStyle}>No hay notificaciones pendientes.</p>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-3 border-b last:border-b-0" style={notificationItemStyle}>
                          <p className="text-sm font-medium" style={notificationPanelStyle}>
                            <span className="font-semibold">{notification.userName}</span> solicitó Premiun <span className="font-semibold">{notification.courseName}</span>.
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                       <div className={`px-4 py-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} text-right`}>
                          <Link href="/admin/solicitudes" className={`text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`} onClick={() => setShowNotifications(false)}>
                            Ver todas las solicitudes
                          </Link>
                       </div>
                   )}
                </div>
              )}

              {!isMobile && (
                <>
                  <img src="/icons/user.png" alt="user" className={"w-7"} />
                  {/* ✅ CORRECCIÓN: Usamos 'logout' en el onClick */}
                  <button onClick={logout} className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 ${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}>
                    Cerrar sesión
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </header>

      <div className="fixed top-0 left-0 h-full pt-16 border-r shadow-lg transition-width duration-300 ease-in-out flex flex-col" style={{ width: isSidebarOpen ? '16rem' : '4rem', zIndex: isMobile ? 35 : 20, ...sidebarStyle }}>
        <nav className="flex-grow overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1 px-2 mt-4">
            {navItems.map(({ href, label, icon }) => (
              <li key={href}>
                <Link href={href} className={`flex items-center gap-4 px-2 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group ${pathname === href ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600') : (isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}`}>
                  {icon}
                  {isSidebarOpen && <span className="truncate font-medium">{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {!loading && user && (
          <div className={`border-t p-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`flex items-center transition-all duration-300 ${isSidebarOpen ? 'flex-row gap-3' : 'flex-col gap-2'}`}>
              <img src="/icons/user.png" alt="user" className={"w-7"}/>

              {isSidebarOpen && (
                <div className="flex-grow">
                  <span className={`block text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{user.displayName || 'Admin'}</span>
                </div>
              )}
              
              {/* ✅ CORRECCIÓN: Usamos 'logout' en el onClick */}
              <button onClick={logout} title="Cerrar sesión" className={`rounded-lg transition-all duration-300 ${isSidebarOpen ? 'p-2 bg-red-500 text-white hover:bg-red-600' : 'p-1 text-gray-500 hover:text-red-500'}`}>
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <main className="pt-16 transition-all duration-300 ease-in-out min-h-screen" style={{ paddingLeft: isMobile ? '4rem' : (isSidebarOpen ? '16rem' : '4rem'), ...mainStyle }}>
        <div className="p-0">
          {children}
        </div>
      </main>
    </>
  );
}
