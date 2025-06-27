// src/app/hooks/useDarkMode.js
import { useEffect, useState, useCallback } from 'react';

export default function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Función para aplicar el tema
  const applyTheme = useCallback((dark) => {
    if (typeof window !== 'undefined') {
      const html = document.documentElement;
      
      if (dark) {
        html.classList.add('dark');
        html.style.colorScheme = 'dark';
      } else {
        html.classList.remove('dark');
        html.style.colorScheme = 'light';
      }
    }
  }, []);

  // Función para obtener el tema inicial
  const getInitialTheme = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    try {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Prioridad: tema guardado > preferencia del sistema
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return prefersDark;
    } catch (error) {
      console.warn('Error accessing localStorage:', error);
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }, []);

  // Inicialización
  useEffect(() => {
    const initialTheme = getInitialTheme();
    setIsDark(initialTheme);
    applyTheme(initialTheme);
    setIsLoaded(true);

    // Escuchar cambios en la preferencia del sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e) => {
      // Solo aplicar si no hay tema guardado específicamente
      try {
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
          setIsDark(e.matches);
          applyTheme(e.matches);
        }
      } catch (error) {
        console.warn('Error in system theme change handler:', error);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [getInitialTheme, applyTheme]);

  // Función para alternar tema
  const toggleTheme = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const newTheme = !isDark;
    setIsDark(newTheme);
    applyTheme(newTheme);
    
    try {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
    }
  }, [isDark, applyTheme]);

  // Función para forzar un tema específico
  const setTheme = useCallback((dark) => {
    if (typeof window === 'undefined') return;
    
    setIsDark(dark);
    applyTheme(dark);
    
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    } catch (error) {
      console.warn('Error saving theme to localStorage:', error);
    }
  }, [applyTheme]);

  return { 
    isDark, 
    toggleTheme, 
    setTheme, 
    isLoaded 
  };
}