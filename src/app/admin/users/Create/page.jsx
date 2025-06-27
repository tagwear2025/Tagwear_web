'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function CreateUserPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    fechaNacimiento: '',
    sexo: '',
    telefono: '',
    universidad: '',
    profesion: '',
    rol: 'user',
    email: '',
    password: '',
    fechaSuscripcion: new Date().toISOString().slice(0,10),
    fechaVencimiento: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const missing = Object.entries(form)
      .filter(([k, v]) => !v)
      .map(([k]) => k);
    if (missing.length) {
      Swal.fire('Error', `Faltan campos: ${missing.join(', ')}`, 'warning');
      return;
    }

    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw await res.json();
      Swal.fire('Creado', 'Usuario registrado', 'success');
      router.push('/admin/users');
    } catch (err) {
      Swal.fire('Error', err.error || 'No se pudo crear', 'error');
    }
  };

  return (
    <section className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Nuevo Usuario</h1>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
        <input name="fullName" placeholder="Nombre completo" onChange={handleChange} className="input" />
        <input name="fechaNacimiento" type="date" onChange={handleChange} className="input" />
        <select name="sexo" onChange={handleChange} className="input">
          <option value="">Sexo</option>
          <option>Masculino</option>
          <option>Femenino</option>
          <option>Prefiero no decirlo</option>
        </select>
        <input name="telefono" placeholder="+591..." onChange={handleChange} className="input" />
        <input name="universidad" placeholder="Universidad" onChange={handleChange} className="input" />
        <input name="profesion" placeholder="Profesión / Cargo" onChange={handleChange} className="input" />
        <input name="email" type="email" placeholder="Correo electrónico" onChange={handleChange} className="input" />
        <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} className="input" />
        <select name="rol" onChange={handleChange} className="input">
          <option value="user">Rol: Usuario</option>
          <option value="admin">Rol: Admin</option>
        </select>
        <label className="input-label">Fecha de Suscripción</label>
        <input
          name="fechaSuscripcion"
          type="date"
          value={form.fechaSuscripcion}
          onChange={handleChange}
          className="input"
        />
        <label className="input-label">Fecha de Vencimiento</label>
        <input
          name="fechaVencimiento"
          type="date"
          value={form.fechaVencimiento}
          onChange={handleChange}
          className="input"
        />
        <button className="btn-primary md:col-span-2 mt-4">Crear Usuario</button>
      </form>
    </section>
  );
}
