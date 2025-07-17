🚀 Tagwer
El marketplace definitivo para comprar y vender productos locales de forma segura y eficiente.

✨ Ver Demo en Vivo
📝 Descripción General
Tagwer es una aplicación web completa de tipo marketplace, construida con tecnologías modernas. Permite a los usuarios registrarse, verificar su identidad, publicar productos para la venta y calificar a otros vendedores. Incluye un panel de administración robusto para gestionar usuarios, solicitudes y productos, garantizando un entorno seguro y controlado.

🌟 Características Principales
Autenticación Segura: Registro e inicio de sesión de usuarios con Firebase Auth (Email/Contraseña y proveedores sociales).

Verificación de Vendedores: Proceso de verificación de identidad para vendedores, aumentando la confianza en la plataforma.

Gestión de Productos: Los usuarios pueden crear, leer, actualizar y eliminar (CRUD) sus propias publicaciones de productos.

Sistema de Calificaciones: Los usuarios pueden calificar y dejar comentarios a los vendedores, construyendo un sistema de reputación.

Panel de Administración:

Dashboard con estadísticas en tiempo real (usuarios, solicitudes).

Gestión completa de usuarios (ver, editar, eliminar).

Aprobación/Rechazo de solicitudes de productos premium.

Visualización detallada del perfil de cada usuario, incluyendo sus productos y comentarios públicos del admin.

Diseño Moderno y Responsivo: Interfaz de usuario amigable y adaptable a cualquier dispositivo, construida con Tailwind CSS.

Modo Claro y Oscuro: Tema personalizable para una mejor experiencia de usuario.

🛠️ Tecnologías Utilizadas
Tecnología

Descripción

Next.js

Framework de React para renderizado del lado del servidor (SSR) y generación de sitios estáticos (SSG), optimizando el SEO y la performance.

React

Biblioteca para construir interfaces de usuario interactivas y componentes reutilizables.

Firebase

Plataforma de Google utilizada para: <br> - Authentication: Gestión de usuarios. <br> - Firestore: Base de datos NoSQL en tiempo real para almacenar toda la data. <br> - Storage: Alojamiento de imágenes de productos y perfiles.

Tailwind CSS

Framework de CSS "utility-first" para un diseño rápido, moderno y personalizable.

SWR

Biblioteca de React Hooks para la obtención de datos, garantizando que la UI siempre esté actualizada.

Lucide React

Biblioteca de iconos SVG, ligera y personalizable.

🚀 Cómo Empezar
Sigue estos pasos para tener una copia del proyecto corriendo en tu máquina local.

Prerrequisitos
Node.js (v18 o superior)

npm, yarn o pnpm

Una cuenta de Firebase

Instalación
Clona el repositorio:

git clone https://[URL_DE_TU_REPOSITORIO_EN_GUTHUB].git
cd tagwer

Instala las dependencias:

npm install
# o
yarn install

Configura las variables de entorno:

Crea un archivo .env.local en la raíz del proyecto.

Añade tus credenciales de Firebase:

NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

Ejecuta el proyecto en modo de desarrollo:

npm run dev

¡Abre http://localhost:3000 en tu navegador para ver la aplicación!

👨‍💻 Creado por
Víctor Hugo Saldaña Ortiz

Instagram
https://www.instagram.com/victor_hugo_saldana_ortiz?igsh=ZzQ5aHkyNnBsNDkw
LinkedIn
https://www.linkedin.com/in/germany-salda%C5%88a-372a35271/

📄 Licencia
Este proyecto está bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.