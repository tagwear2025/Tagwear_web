import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Tag-Wear",
  description: "Tag-Wear by victordev",
};

// Este es el layout raíz. Envuelve TODA la aplicación.
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* 1. Proveedor de Autenticación en el nivel más alto. */}
        <AuthProvider>
          {/* 2. Proveedor de Tema justo después, para que use el estado de auth si es necesario. */}
          <ThemeProvider>
            {/* 3. Aquí se renderizarán todas tus páginas y layouts anidados. */}
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
