import React, { useState, useEffect } from 'react';
import { User, Plus, Edit, Eye, EyeOff, Trash2, LogOut, UserPlus, LogIn } from 'lucide-react';
import { auth, contacts } from '../api';

const ContactosApp = () => {
    const [user, setUser] = useState(null);
    const [contactList, setContactList] = useState([]);
    const [currentView, setCurrentView] = useState('home');
    const [editingContact, setEditingContact] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Cargar usuario al iniciar
    useEffect(() => {
        const savedUser = auth.getCurrentUser();
        if (savedUser) {
            setUser(savedUser);
        }
    }, []);

    // Cargar contactos cuando hay usuario
    useEffect(() => {
        if (user) {
            loadContacts();
        } else {
            // Si no hay usuario, mostrar solo contactos públicos
            loadPublicContacts();
        }
    }, [user]);

    const loadContacts = async () => {
        try {
            setLoading(true);
            const data = await contacts.getAll();
            setContactList(data);
        } catch (err) {
            setError('Error cargando contactos');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadPublicContacts = () => {
        // Para usuarios no autenticados, mostrar array vacío
        // El backend manejará esto
        setContactList([]);
    };

    const handleLogin = async (email, password) => {
        try {
            setLoading(true);
            setError('');
            const data = await auth.login(email, password);
            auth.setUser(data);
            setUser(data.user);
            setCurrentView('home');
            return true;
        } catch (err) {
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (userData) => {
        try {
            setLoading(true);
            setError('');
            const data = await auth.register(userData);
            auth.setUser(data);
            setUser(data.user);
            setCurrentView('home');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        auth.logout();
        setUser(null);
        setContactList([]);
        setCurrentView('home');
    };

    const handleAddContact = async (contactData) => {
        try {
            setLoading(true);
            await contacts.create(contactData);
            await loadContacts();
            setCurrentView('home');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEditContact = async (contactData) => {
        try {
            setLoading(true);
            await contacts.update(editingContact._id, contactData);
            await loadContacts();
            setEditingContact(null);
            setCurrentView('home');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteContact = async (contactId) => {
        if (!window.confirm('¿Estás seguro de eliminar este contacto?')) return;

        try {
            setLoading(true);
            await contacts.delete(contactId);
            await loadContacts();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleContactVisibility = async (contactId) => {
        try {
            await contacts.toggleVisibility(contactId);
            await loadContacts();
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleAdminVisibility = async (contactId) => {
        try {
            await contacts.toggleAdminVisibility(contactId);
            await loadContacts();
        } catch (err) {
            setError(err.message);
        }
    };

    // Componente de Login
    const LoginForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            await handleLogin(email, password);
        };

        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Iniciar Sesión</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                        required
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentView('home')}
                            className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
                <p className="mt-4 text-sm text-gray-600">
                    Usuario de prueba: admin@agenda.com / admin123
                </p>
            </div>
        );
    };

    // Componente de Registro
    const RegisterForm = () => {
        const [formData, setFormData] = useState({
            nombre: '',
            apellido: '',
            email: '',
            password: '',
            empresa: '',
            domicilio: '',
            telefonos: ''
        });

        const handleSubmit = async (e) => {
            e.preventDefault();
            await handleRegister(formData);
        };

        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Registro</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Nombre *"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Apellido *"
                        value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email *"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña *"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Empresa"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Domicilio"
                        value={formData.domicilio}
                        onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Teléfonos"
                        value={formData.telefonos}
                        onChange={(e) => setFormData({ ...formData, telefonos: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
                        >
                            {loading ? 'Registrando...' : 'Registrar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setCurrentView('home')}
                            className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // Componente de Formulario de Contacto
    const ContactForm = ({ contact, onSubmit, onCancel }) => {
        const [formData, setFormData] = useState({
            nombre: contact?.nombre || '',
            apellido: contact?.apellido || '',
            empresa: contact?.empresa || '',
            domicilio: contact?.domicilio || '',
            telefonos: contact?.telefonos || '',
            email: contact?.email || ''
        });

        const handleSubmit = async (e) => {
            e.preventDefault();
            await onSubmit(formData);
        };

        return (
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">
                    {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Nombre *"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Apellido *"
                        value={formData.apellido}
                        onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="email"
                        placeholder="Email *"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-2 border rounded"
                        required
                    />
                    <input
                        type="text"
                        placeholder="Empresa"
                        value={formData.empresa}
                        onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Domicilio"
                        value={formData.domicilio}
                        onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    <input
                        type="text"
                        placeholder="Teléfonos"
                        value={formData.telefonos}
                        onChange={(e) => setFormData({ ...formData, telefonos: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : (contact ? 'Actualizar' : 'Crear')}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        );
    };

    // Componente principal de la lista
    const ContactList = () => (
        <div className="space-y-4">
            {user && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setCurrentView('add-contact')}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Agregar Contacto
                    </button>
                </div>
            )}

            {loading && <p className="text-center">Cargando...</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            <div className="grid gap-4">
                {contactList.map(contact => (
                    <div key={contact._id} className="bg-white p-4 rounded-lg shadow-md border">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold">
                                    {contact.apellido}, {contact.nombre}
                                </h3>
                                {contact.empresa && (
                                    <p className="text-gray-600">{contact.empresa}</p>
                                )}
                                <p className="text-sm text-gray-500">{contact.email}</p>
                                {contact.telefonos && (
                                    <p className="text-sm text-gray-500">{contact.telefonos}</p>
                                )}
                                {contact.domicilio && (
                                    <p className="text-sm text-gray-500">{contact.domicilio}</p>
                                )}

                                <div className="flex gap-2 mt-2">
                                    <span className={`px-2 py-1 text-xs rounded ${contact.esPublico ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {contact.esPublico ? 'Público' : 'Privado'}
                                    </span>

                                    {user?.esAdmin && (
                                        <span className={`px-2 py-1 text-xs rounded ${contact.esVisible ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {contact.esVisible ? 'Visible' : 'Oculto'}
                                        </span>
                                    )}

                                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
                                        Por: {contact.propietario?.nombre || 'Sistema'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {user && (contact.propietario?._id === user.id || user.esAdmin) && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingContact(contact);
                                                setCurrentView('edit-contact');
                                            }}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>

                                        {contact.propietario?._id === user.id && (
                                            <button
                                                onClick={() => toggleContactVisibility(contact._id)}
                                                className="p-2 text-yellow-500 hover:bg-yellow-50 rounded"
                                                title={contact.esPublico ? 'Hacer privado' : 'Hacer público'}
                                            >
                                                {contact.esPublico ? <Eye size={16} /> : <EyeOff size={16} />}
                                            </button>
                                        )}

                                        {user.esAdmin && contact.esPublico && (
                                            <button
                                                onClick={() => toggleAdminVisibility(contact._id)}
                                                className="p-2 text-purple-500 hover:bg-purple-50 rounded"
                                                title={contact.esVisible ? 'Ocultar' : 'Mostrar'}
                                            >
                                                {contact.esVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDeleteContact(contact._id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {!loading && contactList.length === 0 && (
                    <p className="text-center text-gray-500">
                        {user ? 'No hay contactos disponibles' : 'Inicia sesión para ver contactos'}
                    </p>
                )}
            </div>
        </div>
    );

    // Renderizado principal
    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800">Agenda de Contactos</h1>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-blue-600 flex items-center gap-2">
                                    <User size={16} />
                                    {user.nombre} {user.apellido}
                                    {user.esAdmin && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Admin</span>}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
                                >
                                    <LogOut size={16} />
                                    Salir
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentView('register')}
                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
                                >
                                    <UserPlus size={16} />
                                    Registrar
                                </button>
                                <button
                                    onClick={() => setCurrentView('login')}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
                                >
                                    <LogIn size={16} />
                                    Ingresar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 py-8">
                {currentView === 'home' && <ContactList />}
                {currentView === 'login' && <LoginForm />}
                {currentView === 'register' && <RegisterForm />}
                {currentView === 'add-contact' && (
                    <ContactForm
                        onSubmit={handleAddContact}
                        onCancel={() => setCurrentView('home')}
                    />
                )}
                {currentView === 'edit-contact' && (
                    <ContactForm
                        contact={editingContact}
                        onSubmit={handleEditContact}
                        onCancel={() => {
                            setEditingContact(null);
                            setCurrentView('home');
                        }}
                    />
                )}
            </main>
        </div>
    );
};

export default ContactosApp;

asdasdas