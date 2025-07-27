import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'mi_jwt_secret_123';

// Conectar MongoDB (cambia esta URL si usas Atlas)
mongoose.connect('mongodb://localhost:27017/agenda-contactos')
    .then(() => console.log('✅ MongoDB conectado'))
    .catch(() => console.log('❌ MongoDB no disponible - usa MongoDB Atlas o instala MongoDB local'));

// Modelos simples
const User = mongoose.model('User', {
    nombre: String,
    apellido: String,
    email: { type: String, unique: true },
    password: String,
    empresa: String,
    domicilio: String,
    telefonos: String,
    esAdmin: { type: Boolean, default: false }
});

const Contact = mongoose.model('Contact', {
    nombre: String,
    apellido: String,
    email: String,
    empresa: String,
    domicilio: String,
    telefonos: String,
    propietario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    esPublico: { type: Boolean, default: false },
    esVisible: { type: Boolean, default: true }
});

// Middleware de auth
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'No token' });

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// RUTAS

// Registro
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nombre, apellido, email, password, empresa, domicilio, telefonos } = req.body;

        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Usuario ya existe' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            nombre, apellido, email,
            password: hashedPassword,
            empresa, domicilio, telefonos,
            esAdmin: email === 'admin@agenda.com'
        });

        const token = jwt.sign({ id: user._id }, JWT_SECRET);

        res.json({
            token,
            user: { id: user._id, nombre, apellido, email, esAdmin: user.esAdmin }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Credenciales incorrectas' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Credenciales incorrectas' });

        const token = jwt.sign({ id: user._id }, JWT_SECRET);

        res.json({
            token,
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                esAdmin: user.esAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Obtener contactos
app.get('/api/contacts', auth, async (req, res) => {
    try {
        let filter = {};

        if (req.user.esAdmin) {
            filter = {}; // Admin ve todos
        } else {
            filter = {
                $or: [
                    { propietario: req.user._id },
                    { esPublico: true, esVisible: true }
                ]
            };
        }

        const contacts = await Contact.find(filter)
            .populate('propietario', 'nombre apellido')
            .sort({ apellido: 1, nombre: 1 });

        res.json(contacts);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Crear contacto
app.post('/api/contacts', auth, async (req, res) => {
    try {
        const contact = await Contact.create({
            ...req.body,
            propietario: req.user._id
        });

        await contact.populate('propietario', 'nombre apellido');
        res.json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Actualizar contacto
app.put('/api/contacts/:id', auth, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: 'No encontrado' });

        if (!req.user.esAdmin && contact.propietario.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        Object.assign(contact, req.body);
        await contact.save();
        await contact.populate('propietario', 'nombre apellido');

        res.json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Eliminar contacto
app.delete('/api/contacts/:id', auth, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (!contact) return res.status(404).json({ message: 'No encontrado' });

        if (!req.user.esAdmin && contact.propietario.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Toggle visibilidad pública
app.patch('/api/contacts/:id/visibility', auth, async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);
        if (contact.propietario.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        contact.esPublico = !contact.esPublico;
        await contact.save();
        await contact.populate('propietario', 'nombre apellido');

        res.json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Toggle visibilidad admin
app.patch('/api/contacts/:id/admin-visibility', auth, async (req, res) => {
    try {
        if (!req.user.esAdmin) return res.status(403).json({ message: 'Solo admin' });

        const contact = await Contact.findById(req.params.id);
        contact.esVisible = !contact.esVisible;
        await contact.save();
        await contact.populate('propietario', 'nombre apellido');

        res.json(contact);
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor' });
    }
});

// Crear admin por defecto
async function createAdmin() {
    try {
        const adminExists = await User.findOne({ email: 'admin@agenda.com' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                nombre: 'Admin',
                apellido: 'Sistema',
                email: 'admin@agenda.com',
                password: hashedPassword,
                esAdmin: true
            });
            console.log('👤 Admin creado: admin@agenda.com / admin123');
        }
    } catch (error) {
        // Ignorar errores de conexión
    }
}

app.listen(5000, () => {
    console.log('🚀 Servidor en http://localhost:5000');
    createAdmin();
});