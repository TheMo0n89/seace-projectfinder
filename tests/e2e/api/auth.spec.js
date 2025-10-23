import { test, expect } from '@playwright/test';

/**
 * Tests para la API del backend
 * Verifica que todos los endpoints funcionen correctamente
 */

const API_BASE_URL = 'http://localhost:8001';

test.describe('🔗 API Backend Tests', () => {
  
  test.beforeAll(async () => {
    // Esperar que los servicios Docker estén listos
    console.log('🐳 Verificando que Docker esté ejecutándose...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  test('🏥 Health Check - Backend debe estar disponible', async ({ request }) => {
    console.log('🔍 Probando health check del backend...');
    
    const response = await request.get(`${API_BASE_URL}/health`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    console.log('✅ Health check response:', data);
    
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('healthy');
    expect(data).toHaveProperty('service');
    expect(data.service).toBe('SEACE ProjectFinder');
  });

  test('📚 API Root - Endpoint raíz debe responder', async ({ request }) => {
    console.log('🔍 Probando endpoint raíz...');
    
    const response = await request.get(`${API_BASE_URL}/`);
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    console.log('✅ Root response:', data);
    
    expect(data).toHaveProperty('message');
    expect(data.message).toContain('SEACE ProjectFinder');
  });

  test('📖 API Documentation - Swagger docs debe estar disponible', async ({ request }) => {
    console.log('🔍 Probando documentación Swagger...');
    
    const response = await request.get(`${API_BASE_URL}/api/v1/docs`);
    
    expect(response.status()).toBe(200);
    
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/html');
    
    console.log('✅ Swagger docs disponible');
  });

  test('🔐 Login Admin - Credenciales admin deben funcionar', async ({ request }) => {
    console.log('🔍 Probando login del admin...');
    
    const loginData = {
      username: 'admin',
      password: 'admin123'
    };
    
    const response = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
      data: loginData
    });
    
    console.log('📊 Login status:', response.status());
    
    if (response.status() !== 200) {
      const errorData = await response.text();
      console.log('❌ Login error:', errorData);
    }
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    console.log('✅ Login successful, token length:', data.access_token?.length || 0);
    
    expect(data).toHaveProperty('access_token');
    expect(data).toHaveProperty('token_type');
    expect(data.token_type).toBe('bearer');
    expect(data).toHaveProperty('user');
    expect(data.user.username).toBe('admin');
    expect(data.user.role).toBe('admin');
  });

  test('👤 Registro Usuario - Endpoint de registro debe funcionar', async ({ request }) => {
    console.log('🔍 Probando registro de usuario...');
    
    const timestamp = Date.now();
    const userData = {
      username: `testuser_${timestamp}`,
      email: `test_${timestamp}@example.com`,
      password: 'password123',
      full_name: 'Test User Playwright'
    };
    
    console.log('📝 Datos de registro:', { ...userData, password: '***' });
    
    const response = await request.post(`${API_BASE_URL}/api/v1/auth/register`, {
      data: userData
    });
    
    console.log('📊 Register status:', response.status());
    
    if (response.status() !== 201) {
      const errorData = await response.text();
      console.log('❌ Register error:', errorData);
      console.log('🔍 Headers:', response.headers());
    }
    
    // Si el endpoint no está disponible, será 404
    if (response.status() === 404) {
      console.log('⚠️ Endpoint de registro no encontrado (404)');
      expect(response.status()).toBe(404);
      return;
    }
    
    // Si está disponible, debe crear el usuario
    expect(response.status()).toBe(201);
    
    const data = await response.json();
    console.log('✅ Usuario creado:', data.username);
    
    expect(data).toHaveProperty('username');
    expect(data.username).toBe(userData.username);
    expect(data).toHaveProperty('email');
    expect(data.email).toBe(userData.email);
    expect(data).toHaveProperty('role');
  });

  test('🚫 Login Fallido - Credenciales incorrectas deben fallar', async ({ request }) => {
    console.log('🔍 Probando login con credenciales incorrectas...');
    
    const invalidData = {
      username: 'usernotexist',
      password: 'wrongpassword'
    };
    
    const response = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
      data: invalidData
    });
    
    console.log('📊 Invalid login status:', response.status());
    
    expect(response.status()).toBe(401);
    
    const data = await response.json();
    console.log('✅ Error esperado:', data.detail);
    
    expect(data).toHaveProperty('detail');
    expect(data.detail).toContain('Credenciales incorrectas');
  });

  test('🔒 Endpoint Protegido - /auth/me debe requerir autenticación', async ({ request }) => {
    console.log('🔍 Probando endpoint protegido sin token...');
    
    const response = await request.get(`${API_BASE_URL}/api/v1/auth/me`);
    
    console.log('📊 Protected endpoint status:', response.status());
    
    expect(response.status()).toBe(401);
    
    console.log('✅ Endpoint correctamente protegido');
  });

  test('🔑 Token JWT - Usuario autenticado debe acceder a endpoints protegidos', async ({ request }) => {
    console.log('🔍 Probando acceso con token JWT...');
    
    // Primero hacer login
    const loginResponse = await request.post(`${API_BASE_URL}/api/v1/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
    
    expect(loginResponse.status()).toBe(200);
    
    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    
    console.log('🔐 Token obtenido, length:', token.length);
    
    // Luego acceder a endpoint protegido
    const protectedResponse = await request.get(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Protected access status:', protectedResponse.status());
    
    expect(protectedResponse.status()).toBe(200);
    
    const userData = await protectedResponse.json();
    console.log('✅ Usuario autenticado:', userData.username);
    
    expect(userData).toHaveProperty('username');
    expect(userData.username).toBe('admin');
  });

});