'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from 'src/context/AuthContext';
import { fetcher } from '@/lib/fetcher';
import { 
    Users, 
    UserX, 
    Gem, 
    QrCode, 
    Mail, 
    Clock,
    Sun,
    Cloud,
    CloudSun,
    Cloudy,
    CloudRain,
    CloudSnow,
    CloudLightning,
    Loader
} from 'lucide-react';

// --- Pequeño Hook para animar el conteo de números ---
const useCountUp = (end, duration = 1.5) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const endValue = parseInt(end, 10);
    if (isNaN(endValue) || endValue === 0) {
      setCount(0);
      return;
    }
    const startTime = Date.now();
    const frame = () => {
      const now = Date.now();
      const progress = (now - startTime) / (duration * 1000);
      if (progress < 1) {
        setCount(Math.min(endValue, Math.ceil(endValue * progress)));
        requestAnimationFrame(frame);
      } else {
        setCount(endValue);
      }
    };
    requestAnimationFrame(frame);
  }, [end, duration]);
  return count;
};

// --- Componente para las Tarjetas de Estadísticas ---
function StatCard({ icon, title, value, isLoading }) {
  const animatedValue = useCountUp(value);
  return (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-md flex items-center gap-6 transition-transform hover:-translate-y-1 backdrop-blur-sm">
      <div className="bg-blue-100 dark:bg-blue-900/40 p-4 rounded-xl">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        {isLoading ? (
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse mt-1"></div>
        ) : (
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{animatedValue}</p>
        )}
      </div>
    </div>
  );
}

// --- Componente para los Atajos Animados ---
function ShortcutCard({ icon, title, description, href }) {
  return (
    <Link href={href} className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-md group transition-all duration-300 hover:shadow-xl hover:bg-gray-50 dark:hover:bg-gray-700/60 backdrop-blur-sm">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <div className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
          {icon}
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </Link>
  );
}

// --- Componente Principal del Dashboard ---
export default function AdminHomePage() {
  const { user, loading: authLoading } = useAuth();
  const [currentTime, setCurrentTime] = useState('');

  // 1. Fetching de datos de usuarios para estadísticas
  const { data: usersData, isLoading: usersLoading } = useSWR('/api/users', fetcher);

  // 2. Fetching de datos del clima directamente desde el cliente (API sin clave)
  const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=-21.53&longitude=-64.72&current=temperature_2m,weather_code';
  const { data: weatherData, isLoading: weatherLoading } = useSWR(weatherUrl, fetcher);

  // 3. Lógica para el reloj en tiempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  // 4. Cálculo de estadísticas cuando los datos de usuarios están disponibles
  const stats = {
    total: usersData?.length || 0,
    inactive: usersData?.filter(u => !u.active).length || 0,
    premium: usersData?.filter(u => u.fechaSuscripcion).length || 0
  };

  // 5. Función para interpretar el código del clima y devolver un ícono y descripción
  const getWeatherDetails = (code) => {
    if (code === 0) return { icon: <Sun size={28}/>, description: "Despejado" };
    if (code === 1) return { icon: <CloudSun size={28}/>, description: "Principalmente despejado" };
    if (code === 2) return { icon: <Cloud size={28}/>, description: "Parcialmente nublado" };
    if (code === 3) return { icon: <Cloudy size={28}/>, description: "Nublado" };
    if (code >= 51 && code <= 67) return { icon: <CloudRain size={28}/>, description: "Lluvia" };
    if (code >= 71 && code <= 77) return { icon: <CloudSnow size={28}/>, description: "Nieve" };
    if (code >= 95 && code <= 99) return { icon: <CloudLightning size={28}/>, description: "Tormenta" };
    return { icon: <Cloudy size={28}/>, description: "Brumoso" };
  };

  const weatherDetails = weatherData ? getWeatherDetails(weatherData.current.weather_code) : null;

  if (authLoading) {
    return <div className="p-8 text-center animate-pulse">Verificando sesión...</div>;
  }
  
  return (
    <section className="p-4 sm:p-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* -- Encabezado con Saludo y Widgets -- */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Bienvenido, {user?.displayName || 'Admin'}
            </h1>
            <p className="text-md text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-6 p-4 bg-white/50 dark:bg-gray-800/50 rounded-2xl shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-800 dark:text-white">
              <Clock size={24} />
              <span className="font-bold text-xl">{currentTime || '...'}</span>
            </div>
            {weatherLoading ? (
              <div className="flex items-center gap-2 text-gray-800 dark:text-white">
                <Loader size={24} className="animate-spin"/>
                <span className="font-bold text-xl">--°C</span>
              </div>
            ) : weatherDetails && (
              <div className="flex items-center gap-2 text-gray-800 dark:text-white" title={weatherDetails.description}>
                {weatherDetails.icon}
                <span className="font-bold text-xl">{Math.round(weatherData.current.temperature_2m)}°C</span>
              </div>
            )}
          </div>
        </div>

        {/* -- Sección de Estadísticas -- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard icon={<Users size={32} className="text-blue-500"/>} title="Total de Usuarios" value={stats.total} isLoading={usersLoading} />
          <StatCard icon={<UserX size={32} className="text-red-500"/>} title="Usuarios Inactivos" value={stats.inactive} isLoading={usersLoading} />
          <StatCard icon={<Gem size={32} className="text-amber-500"/>} title="Usuarios Premium" value={stats.premium} isLoading={usersLoading} />
        </div>

        {/* -- Sección de Atajos -- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ShortcutCard 
            href="/admin/users" 
            title="Gestión de Usuarios" 
            description="Crear, editar y administrar todos los usuarios." 
            icon={<Users size={28} className="text-gray-400 dark:text-gray-500"/>} 
          />
          <ShortcutCard 
            href="/admin/solicitudes" 
            title="Solicitudes" 
            description="Revisar y gestionar las solicitudes pendientes." 
            icon={<Mail size={28} className="text-gray-400 dark:text-gray-500"/>} 
          />
          <ShortcutCard 
            href="/admin/qr-gestion" 
            title="Gestión de QR" 
            description="Administrar los códigos QR de los clientes." 
            icon={<QrCode size={28} className="text-gray-400 dark:text-gray-500"/>} 
          />
        </div>
      </div>
    </section>
  );
}