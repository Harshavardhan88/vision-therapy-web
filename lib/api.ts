import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add Authorization header if token exists
api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// Error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Redirect to login if unauthorized
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const auth = {
    // Modified signup to accept child_name
    signup: (data: any) => {
        return api.post('/users/', data);
    },
    login: (username: string, password: string) => {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        return api.post('/token', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    getUsers: () => api.get('/users/'),
    getMyPatients: () => api.get('/api/doctor/patients'),
    getParentChildren: () => api.get('/api/parent/children'),
    getPublicDoctors: () => api.get('/api/public/doctors'),
    getMe: () => api.get('/users/me'),
    register: (full_name: string, email: string, password: string, role: string) =>
        api.post('/users/', { full_name, email, password, role }),
    saveSession: (data: any) => api.post('/api/sessions', data),
    getSessions: (userId: number) => api.get(`/api/sessions/${userId}`),
    createDoctorNote: (data: any) => api.post('/api/doctor/notes', data),
    getDoctorNotes: (patientId: number) => api.get(`/api/doctor/notes/${patientId}`),
};

export default api;
