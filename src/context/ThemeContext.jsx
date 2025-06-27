// src/context/ThemeContext.jsx
'use client';

import { createContext, useContext } from 'react';
import useDarkMode from '@/app/hooks/useDarkMode'; // Importamos el hook que ya tienes

// 1. Crear el contexto
const ThemeContext = createContext();

// 2. Crear el Proveedor del Contexto
// Este componente envolverá tu aplicación y le dará acceso al estado del tema.
export function ThemeProvider({ children }) {
  // Usamos tu hook `useDarkMode` para obtener el estado y las funciones del tema.
  const theme = useDarkMode();

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

// 3. Crear un hook personalizado para consumir el contexto fácilmente
// Los componentes usarán este hook para acceder a `isDark`, `toggleTheme`, etc.
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
}