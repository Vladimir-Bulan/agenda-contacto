import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'mi_jwt_secret_123';

// Conectar MongoDB Atlas
mongoose.connect('mongodb+srv://admin:AgendaContact2025!@cluster0.tvfqj3n.mongodb.net/agenda-contactos?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('✅ MongoDB Atlas conectado'))
    .catch((err) => console.log('❌ Error conectando MongoDB Atlas:', err.message));

// Modelos
const UserSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    empresa: String,
    domicilio: String,
    telefonos: String,
    esAdmin: { type: Boolean, default: false }
}, { timestamps: true });

const ContactSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    apellido: { type: String, required: true },
    email: { type: String, required: true },
    empresa: String,
    domicilio: String,
    telefonos: String,
    propietario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    esPublico: { type: Boolean, default: false },
    esVisible: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Contact = mongoose.model('Contact', ContactSchema);

// Middleware de autenticación
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token, acceso denegado' });

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Token inválido' });
        }

        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// RUTAS DE AUTENTICACIÓN

// Registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre, apellido, email, password, empresa, domicilio, telefonos } = req.body;

        // Validaciones
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son obligatorios' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            nombre,
            apellido,
            email,
            password: hashedPassword,
            empresa: empresa || '',
            domicilio: domicilio || '',
            telefonos: telefonos || '',
            esAdmin: email === 'admin@agenda.com'
        });

        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            token,
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                empresa: user.empresa,
                domicilio: user.domicilio,
                telefonos: user.telefonos,
                esAdmin: user.esAdmin
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error del servidor: ' + error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son obligatorios' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciales incorrectas' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            token,
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                empresa: user.empresa,
                domicilio: user.domicilio,
                telefonos: user.telefonos,
                esAdmin: user.esAdmin
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Actualizar perfil de usuario
app.put('/api/auth/profile', auth, async (req, res) => {
    try {
        const { nombre, apellido, empresa, domicilio, telefonos } = req.body;

        if (!nombre || !apellido) {
            return res.status(400).json({ message: 'Nombre y apellido son obligatorios' });
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                nombre,
                apellido,
                empresa: empresa || '',
                domicilio: domicilio || '',
                telefonos: telefonos || ''
            },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                empresa: user.empresa,
                domicilio: user.domicilio,
                telefonos: user.telefonos,
                esAdmin: user.esAdmin
            }
        });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// RUTAS DE CONTACTOS

// Obtener contactos (según permisos del usuario)
app.get('/api/contacts', auth, async (req, res) => {
    try {
        let filter = {};

        if (req.user.esAdmin) {
            // Admin ve todos los contactos
            filter = {};
        } else {
            // Usuario normal ve sus contactos + públicos visibles
            filter = {
                $or: [
                    { propietario: req.user._id },
                    { esPublico: true, esVisible: true }
                ]
            };
        }

        const contacts = await Contact.find(filter)
            .populate('propietario', 'nombre apellido email')
            .sort({ apellido: 1, nombre: 1 });

        res.json(contacts);
    } catch (error) {
        console.error('Error obteniendo contactos:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Crear contacto
app.post('/api/contacts', auth, async (req, res) => {
    try {
        const { nombre, apellido, email, empresa, domicilio, telefonos } = req.body;

        if (!nombre || !apellido || !email) {
            return res.status(400).json({ message: 'Nombre, apellido y email son obligatorios' });
        }

        const contact = new Contact({
            nombre,
            apellido,
            email,
            empresa: empresa || '',
            domicilio: domicilio || '',
            telefonos: telefonos || '',
            propietario: req.user._id,
            esPublico: false,
            esVisible: true
        });

        await contact.save();
        await contact.populate('propietario', 'nombre apellido email');

        res.status(201).json(contact);
    } catch (error) {
        console.error('Error creando contacto:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Actualizar contacto
app.put('/api/contacts/:id', auth, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ message: 'Contacto no encontrado' });
        }

        // Verificar permisos
        if (!req.user.esAdmin && contact.propietario.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado para editar este contacto' });
        }

        const { nombre, apellido, email, empresa, domicilio, telefonos } = req.body;

        if (!nombre || !apellido || !email) {
            return res.status(400).json({ message: 'Nombre, apellido y email son obligatorios' });
        }

        contact.nombre = nombre;
        contact.apellido = apellido;
        contact.email = email;
        contact.empresa = empresa || '';
        contact.domicilio = domicilio || '';
        contact.telefonos = telefonos || '';

        await contact.save();
        await contact.populate('propietario', 'nombre apellido email');

        res.json(contact);
    } catch (error) {
        console.error('Error actualizando contacto:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Eliminar contacto
app.delete('/api/contacts/:id', auth, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ message: 'Contacto no encontrado' });
        }

        // Verificar permisos
        if (!req.user.esAdmin && contact.propietario.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado para eliminar este contacto' });
        }

        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Contacto eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminando contacto:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Cambiar visibilidad pública (solo propietario)
app.patch('/api/contacts/:id/visibility', auth, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ message: 'Contacto no encontrado' });
        }

        if (contact.propietario.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Solo el propietario puede cambiar la visibilidad' });
        }

        contact.esPublico = !contact.esPublico;
        await contact.save();
        await contact.populate('propietario', 'nombre apellido email');

        res.json(contact);
    } catch (error) {
        console.error('Error cambiando visibilidad:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Cambiar visibilidad admin (solo administrador)
app.patch('/api/contacts/:id/admin-visibility', auth, async (req, res) => {
    try {
        if (!req.user.esAdmin) {
            return res.status(403).json({ message: 'Solo administradores pueden realizar esta acción' });
        }

        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({ message: 'Contacto no encontrado' });
        }

        if (!contact.esPublico) {
            return res.status(400).json({ message: 'Solo se puede ocultar/mostrar contactos públicos' });
        }

        contact.esVisible = !contact.esVisible;
        await contact.save();
        await contact.populate('propietario', 'nombre apellido email');

        res.json(contact);
    } catch (error) {
        console.error('Error cambiando visibilidad admin:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Crear usuario admin por defecto
async function createAdminUser() {
    try {
        const adminExists = await User.findOne({ email: 'admin@agenda.com' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            const admin = new User({
                nombre: 'Admin',
                apellido: 'Sistema',
                email: 'admin@agenda.com',
                password: hashedPassword,
                empresa: 'Sistema',
                domicilio: '',
                telefonos: '',
                esAdmin: true
            });

            await admin.save();
            console.log('👤 Usuario admin creado: admin@agenda.com / admin123');
        } else {
            console.log('👤 Usuario admin ya existe');
        }
    } catch (error) {
        console.log('Error creando usuario admin:', error.message);
    }
}

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
});

// Ruta de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    createAdminUser();
});