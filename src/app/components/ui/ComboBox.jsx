'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, X } from 'lucide-react';

/**
 * Un componente ComboBox reutilizable con búsqueda y filtrado.
 * @param {string[]} options - La lista de opciones a mostrar.
 * @param {string} value - El valor actual del input.
 * @param {function} onChange - Función para manejar el cambio de valor.
 * @param {string} placeholder - El texto placeholder para el input.
 * @param {boolean} disabled - Estado para deshabilitar el componente.
 */
export default function ComboBox({ options, value, onChange, placeholder, disabled = false }) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const filteredOptions = query === ''
        ? options
        : options.filter((option) =>
            option.toLowerCase().includes(query.toLowerCase())
        );
    
    // Cerrar el dropdown si se hace clic fuera de él
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    const handleSelectOption = (option) => {
        onChange(option);
        setQuery('');
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    value={value || query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(e.target.value); // Permite escritura libre
                        if (!isOpen) setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className="w-full p-3 pr-10 bg-gray-100 dark:bg-gray-700 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                    disabled={disabled}
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:cursor-not-allowed"
                    onClick={() => {
                        if (value) {
                             onChange(''); // Limpiar valor
                        } else {
                            setIsOpen(!isOpen);
                        }
                    }}
                    disabled={disabled}
                >
                    {value ? <X size={20} /> : <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
                </button>
            </div>

            {isOpen && !disabled && (
                <ul className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                            <li
                                key={option}
                                className="px-4 py-2 text-gray-800 dark:text-gray-200 cursor-pointer hover:bg-blue-500 hover:text-white transition-colors"
                                onClick={() => handleSelectOption(option)}
                            >
                                {option}
                            </li>
                        ))
                    ) : (
                        <li className="px-4 py-2 text-gray-500">No se encontraron resultados.</li>
                    )}
                </ul>
            )}
        </div>
    );
}
