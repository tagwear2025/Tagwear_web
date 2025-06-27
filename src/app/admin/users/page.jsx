import GestionUsuariosClient from './GestionUsuariosClient';

// Opcional: puedes añadir metadata para el título de la página
export const metadata = {
  title: 'Gestión de Usuarios | Panel de Admin',
  description: 'Administra usuarios, estados de cuenta y suscripciones premium.',
};

export default function GestionUsuariosPage() {
  return (
      <GestionUsuariosClient />
  );
}