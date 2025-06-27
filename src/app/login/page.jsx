'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase'; // Asegúrate que la ruta sea correcta
import Swal from 'sweetalert2';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Autenticar con Firebase en el cliente
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Obtener el ID Token del usuario
      const idToken = await user.getIdToken(true); // Forzar refresco para obtener claims actualizados

      // 3. Llamar a la API backend para verificar estado, rol y establecer cookies
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`, // Enviar token en el header (opcional, pero buena práctica)
        },
        body: JSON.stringify({ token: idToken }), // O enviar solo en el body
      });

      const data = await response.json();

      if (!response.ok) {
        // La API retornó un error (ej: usuario inactivo, no encontrado, token inválido)
        throw new Error(data.error || 'Error en el servidor durante el login');
      }

      // 4. Si la API fue exitosa (usuario activo, cookies establecidas)
      await Swal.fire({
        icon: 'success',
        title: '¡Bienvenido!',
        text: 'Has iniciado sesión correctamente.',
        timer: 1200,
        showConfirmButton: false,
      });

      // 5. Redirigir basado en el rol devuelto por la API
      //    AuthContext se actualizará automáticamente debido al cambio de estado
      //    y el middleware usará las cookies establecidas por la API.
      router.replace(data.role === 'admin' ? '/admin' : '/app');

    } catch (err) {
      // Captura errores de Firebase Auth o de la llamada a la API
      let errorMessage = 'Ocurrió un error inesperado.';
      if (err.code) { // Error de Firebase Auth
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // Nueva versión de Firebase SDK
            errorMessage = 'Correo o contraseña incorrectos.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo es inválido.';
            break;
          default:
            errorMessage = 'Error de autenticación: ' + err.message;
        }
      } else { // Error de la API u otro error
        errorMessage = err.message;
      }
      await Swal.fire('Error de Inicio de Sesión', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const goToRegister = () => {
    router.push('/register');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md space-y-6"
      >
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Iniciar Sesión
        </h1>

        <div>
          <label htmlFor="email" // Added htmlFor
                 className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Correo electrónico
          </label>
          <input
            id="email" // Added id
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" // Added focus styles
          />
        </div>

        <div>
          <label htmlFor="password" // Added htmlFor
                 className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contraseña
          </label>
          <input
            id="password" // Added id
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full p-2 border rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500" // Added focus styles
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded shadow transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed" // Added transition and disabled styles
        >
          {loading ? 'Cargando...' : 'Ingresar'}
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={goToRegister}
              className="font-medium text-blue-600 hover:underline dark:text-blue-400" // Made it look more like a link
            >
              Regístrate
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
