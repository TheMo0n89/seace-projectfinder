import { test, expect } from '@playwright/test';

/**
 * Tests E2E para SEACE ProjectFinder - Ejecutados en Docker
 * Verifica la funcionalidad completa del sistema desplegado
 */

test.describe('🚀 SEACE ProjectFinder - Tests E2E en Docker', () => {

  test.beforeEach(async ({ page }) => {
    // Configurar timeouts para tests en Docker
    test.setTimeout(60000);

    // Ir a la página principal
    await page.goto('/');
  });

  test('🎯 API Health Check - Verificar que el backend esté operativo', async ({ request }) => {
    const response = await request.get('/api/v1/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
    expect(data).toHaveProperty('timestamp');
  });

  test('🔐 Login - Verificar autenticación JWT', async ({ page }) => {
    // Ir a login
    await page.goto('/login');

    // Verificar que estamos en la página de login
    await expect(page).toHaveURL(/.*login/);

    // Llenar formulario de login
    await page.fill('input[type="email"]', 'admin@seaceprojectfinder.com');
    await page.fill('input[type="password"]', 'admin123');

    // Hacer click en login
    await page.click('button[type="submit"]');

    // Verificar redirección al dashboard
    await expect(page).toHaveURL(/.*\/($|catalog|dashboard)/);

    // Verificar que el token JWT esté en localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
    expect(token.length).toBeGreaterThan(10);
  });

  test('📋 Catálogo - Verificar lista de procesos', async ({ page, request }) => {
    // Login primero
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'admin@seaceprojectfinder.com',
        password: 'admin123'
      }
    });

    expect(loginResponse.ok()).toBeTruthy();
    const { token } = await loginResponse.json();

    // Obtener lista de procesos
    const procesosResponse = await request.get('/api/v1/procesos', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(procesosResponse.ok()).toBeTruthy();

    const data = await procesosResponse.json();
    expect(data).toHaveProperty('procesos');
    expect(Array.isArray(data.procesos)).toBeTruthy();
  });

  test('🎨 Frontend - Verificar carga de la interfaz', async ({ page }) => {
    // Verificar título de la página
    await expect(page).toHaveTitle(/SEACE ProjectFinder/);

    // Verificar elementos principales
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();

    // Verificar que no hay errores de JavaScript
    const errors = [];
    page.on('pageerror', error => errors.push(error));

    // Esperar un poco para capturar posibles errores
    await page.waitForTimeout(2000);

    expect(errors.length).toBe(0);
  });

  test('🤖 Chatbot - Verificar funcionalidad de IA', async ({ page, request }) => {
    // Login
    const loginResponse = await request.post('/api/v1/auth/login', {
      data: {
        email: 'admin@seaceprojectfinder.com',
        password: 'admin123'
      }
    });

    const { token } = await loginResponse.json();

    // Hacer una consulta al chatbot
    const chatbotResponse = await request.post('/api/v1/chatbot/query', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        query: '¿Qué es SEACE?',
        context: 'general'
      }
    });

    expect(chatbotResponse.ok()).toBeTruthy();

    const data = await chatbotResponse.json();
    expect(data).toHaveProperty('response');
    expect(data.response.length).toBeGreaterThan(0);
  });

  test('📊 Dashboard - Verificar acceso a analíticas', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@seaceprojectfinder.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Ir al dashboard
    await page.goto('/dashboard');

    // Verificar que estamos en dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Verificar elementos del dashboard
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('⚙️ Admin Panel - Verificar acceso administrativo', async ({ page }) => {
    // Login como admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@seaceprojectfinder.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Ir al panel de admin
    await page.goto('/admin');

    // Verificar acceso (debería estar disponible para admin)
    await expect(page).toHaveURL(/.*admin/);
    await expect(page.locator('text=Panel de Administración')).toBeVisible();
  });

});