const API_URL = 'http://localhost:5000/api';

const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        },
        ...options
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_URL}${url}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en la API');
    }

    return data;
};

export const auth = {
    login: (email, password) =>
        apiRequest('/auth/login', {
            method: 'POST',
            body: { email, password }
        }),

    register: (userData) =>
        apiRequest('/auth/register', {
            method: 'POST',
            body: userData
        }),

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    setUser: (userData) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('user', JSON.stringify(userData.user));
    }
};

export const contacts = {
    getAll: () => apiRequest('/contacts'),
    create: (contactData) => apiRequest('/contacts', { method: 'POST', body: contactData }),
    update: (id, contactData) => apiRequest(`/contacts/${id}`, { method: 'PUT', body: contactData }),
    delete: (id) => apiRequest(`/contacts/${id}`, { method: 'DELETE' }),
    toggleVisibility: (id) => apiRequest(`/contacts/${id}/visibility`, { method: 'PATCH' }),
    toggleAdminVisibility: (id) => apiRequest(`/contacts/${id}/admin-visibility`, { method: 'PATCH' })
};