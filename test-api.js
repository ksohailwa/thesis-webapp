const fetch = require('node-fetch');

const API_URL = 'http://localhost:4000';

async function request(path, opts = {}) {
    const res = await fetch(API_URL + path, {
        headers: { 'Content-Type': 'application/json' },
        ...opts
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} ${res.statusText} - ${text}`);
    }
    return res.json();
}

async function teacherRegister(payload) {
    return request('/v1/auth/register', { method: 'POST', body: JSON.stringify(payload) });
}

async function teacherLogin(payload) {
    return request('/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

// Test the API functions
async function test() {
    try {
        console.log('Testing teacher registration...');
        const registerResult = await teacherRegister({ 
            name: 'Test Teacher', 
            email: 'teacher@example.com', 
            password: 'testpass123',
            role: 'teacher'
        });
        console.log('Registration successful:', registerResult);

        console.log('Testing teacher login...');
        const loginResult = await teacherLogin({ 
            email: 'teacher@example.com', 
            password: 'testpass123' 
        });
        console.log('Login successful:', loginResult);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

test();
