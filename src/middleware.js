// src/middleware.js
import { NextResponse } from "next/server";

export async function middleware(req) {
  const token = req.cookies.get("__session")?.value; // token Firebase
  const { pathname } = req.nextUrl;

  // siempre redirigir "/" a "/login"
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // rutas públicas que dejamos pasar
  const publicPaths = ["/login", "/register", "/favicon.ico"];
  if (publicPaths.includes(pathname)) {
    // si ya estás logueado y vas al login o register, 
    // opcionalmente redirige al dashboard según rol:
    if (token && (pathname === "/login" || pathname === "/register")) {
      const role = req.cookies.get("role")?.value;
      const dest = role === "admin" ? "/admin" : "/app";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // si no hay token, bloquea todo lo demás y manda al login
  if (!token) {
    console.log(`Middleware: No token found for path ${pathname}. Redirecting to /login.`);
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // rutas admin
  if (pathname.startsWith("/admin")) {
    const role = req.cookies.get("role")?.value;
    if (role !== "admin") {
      console.log(`Middleware: User with role '${role}' tried to access /admin. Redirecting to /app.`);
      return NextResponse.redirect(new URL("/app", req.url));
    }
  }

  // para todo lo demás ("/app" y subrutas), deja pasar
  return NextResponse.next();
}

export const config = {
  // CORRECCIÓN: Se agrega "/admin" para que el middleware también
  // se ejecute en la ruta raíz del panel de administración.
  matcher: [
    "/",
    "/login",
    "/register",
    "/app/:path*",
    "/admin", // <-- AÑADIDO: Protege la ruta raíz /admin
    "/admin/:path*",
  ]
};