import { test, expect } from '@playwright/test';

/**
 * Tests de integración completa
 * Prueban el flujo completo desde frontend hasta backend
 */

test.describe('🔄 Integration Tests - Frontend + Backend', () => {
  
  test('🌐 Full System Health Check', async ({ page, request }) => {
    console.log('🔍 Verificando salud completa del sistema...');
    
    // 1. Verificar que el backend esté disponible
    const backendHealth = await request.get('http://localhost:8001/health');
    expect(backendHealth.status()).toBe(200);
    console.log('✅ Backend healthy');
    
    // 2. Verificar que el frontend cargue
    await page.goto('http://localhost:3000');
    await expect(page.locator('text=SEACE ProjectFinder')).toBeVisible();
    console.log('✅ Frontend loaded');
    
    // 3. Verificar que la API esté respondiendo desde el frontend
    const response = await page.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:8001/health');
        return {
          status: res.status,
          data: await res.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    expect(response.status).toBe(200);
    console.log('✅ API accesible desde frontend');
    
    console.log('🎉 Sistema completo funcionando');
  });

  test('🔐 Complete Authentication Flow', async ({ page, request }) => {
    console.log('🔍 Probando flujo completo de autenticación...');
    
    // 1. Primero verificar que login funciona via API
    const apiLogin = await request.post('http://localhost:8001/api/v1/auth/login', {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
    
    expect(apiLogin.status()).toBe(200);
    const apiData = await apiLogin.json();
    console.log('✅ API login exitoso, token length:', apiData.access_token.length);
    
    // 2. Luego probar login desde frontend
    await page.goto('http://localhost:3000/login');
    
    // Interceptar requests para ver qué está pasando
    page.on('request', request => {
      if (request.url().includes('/auth/login')) {
        console.log('📤 Frontend enviando login request a:', request.url());
        console.log('📤 Method:', request.method());
        console.log('📤 Headers:', request.headers());
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/auth/login')) {
        console.log('📥 Login response status:', response.status());
        console.log('📥 Response URL:', response.url());
      }
    });
    
    // Llenar y enviar formulario
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Ingresar")');
    await expect(submitButton).toBeVisible();
    
    await submitButton.click();
    
    // Esperar por redirección o error
    await page.waitForTimeout(5000);
    
    // Verificar estado final
    const currentUrl = page.url();
    console.log('📍 URL final:', currentUrl);
    
    if (currentUrl.includes('/home') || currentUrl.includes('/dashboard')) {
      console.log('✅ Login desde frontend exitoso');
      
      // Verificar que aparezca contenido autenticado
      await expect(page.locator('nav')).toBeVisible();
      
    } else {
      console.log('⚠️ Login desde frontend no redirigió correctamente');
      
      // Capturar screenshot para debugging
      await page.screenshot({ path: 'test-results/frontend-login-issue.png' });
      
      // Verificar si hay errores en consola
      const logs = await page.evaluate(() => {
        return console.history || [];
      });
      console.log('📋 Console logs:', logs);
    }
  });

  test('🐛 Debug Registration Issue', async ({ page, request }) => {
    console.log('🔍 Debugging problema de registro...');
    
    // 1. Probar registro directamente via API
    const timestamp = Date.now();
    const userData = {
      username: `debug_${timestamp}`,
      email: `debug_${timestamp}@test.com`,
      password: 'password123',
      full_name: 'Debug User'
    };
    
    console.log('📝 Probando registro via API directa...');
    const apiRegister = await request.post('http://localhost:8001/api/v1/auth/register', {
      data: userData
    });
    
    console.log('📊 API Register status:', apiRegister.status());
    console.log('📊 API Register headers:', apiRegister.headers());
    
    if (apiRegister.status() !== 201) {
      const errorText = await apiRegister.text();
      console.log('❌ API Register error:', errorText);
    } else {
      const successData = await apiRegister.json();
      console.log('✅ API Register success:', successData.username);
    }
    
    // 2. Probar desde frontend
    console.log('📝 Probando registro via frontend...');
    
    await page.goto('http://localhost:3000/register');
    
    // Interceptar todas las requests
    page.on('request', request => {
      console.log('📤 Frontend request:', request.method(), request.url());
    });
    
    page.on('response', response => {
      console.log('📥 Frontend response:', response.status(), response.url());
    });
    
    // Llenar formulario si está disponible
    const usernameField = page.locator('input[name="username"]').first();
    if (await usernameField.isVisible()) {
      await usernameField.fill(`frontend_${timestamp}`);
      
      const emailField = page.locator('input[name="email"], input[type="email"]').first();
      await emailField.fill(`frontend_${timestamp}@test.com`);
      
      const passwordField = page.locator('input[name="password"], input[type="password"]').first();
      await passwordField.fill('password123');
      
      // Si hay confirmación de password
      const confirmField = page.locator('input[name="confirmPassword"], input[name="password_confirmation"]');
      if (await confirmField.isVisible()) {
        await confirmField.fill('password123');
      }
      
      // Si hay campo de nombre
      const nameField = page.locator('input[name="fullName"], input[name="full_name"]');
      if (await nameField.isVisible()) {
        await nameField.fill('Frontend Test User');
      }
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Registrar")');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Esperar respuesta
        await page.waitForTimeout(3000);
        
        console.log('✅ Formulario de registro enviado desde frontend');
      } else {
        console.log('⚠️ Botón de registro no encontrado');
      }
    } else {
      console.log('⚠️ Formulario de registro no encontrado');
    }
    
    // Capturar screenshot final
    await page.screenshot({ path: 'test-results/registration-debug.png' });
  });

  test('📋 Full API Endpoints Discovery', async ({ request }) => {
    console.log('🔍 Descubriendo todos los endpoints disponibles...');
    
    const baseUrl = 'http://localhost:8001';
    
    // Lista de endpoints a probar
    const endpoints = [
      '/',
      '/health',
      '/api/v1',
      '/api/v1/docs',
      '/api/v1/auth/register',
      '/api/v1/auth/login',
      '/api/v1/auth/me',
      '/api/v1/auth/logout',
      '/api/v1/procesos',
      '/api/v1/chatbot',
      '/api/v1/admin',
      '/api/v1/dashboard'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await request.get(`${baseUrl}${endpoint}`);
        console.log(`📍 ${endpoint}: ${response.status()}`);
        
        if (response.status() === 404) {
          console.log(`   ❌ No encontrado`);
        } else if (response.status() === 401) {
          console.log(`   🔒 Requiere autenticación`);
        } else if (response.status() === 200) {
          console.log(`   ✅ Disponible`);
        } else {
          console.log(`   ⚠️ Status: ${response.status()}`);
        }
      } catch (error) {
        console.log(`📍 ${endpoint}: ❌ Error - ${error.message}`);
      }
    }
  });

  test('🔧 Frontend Build and Assets Check', async ({ page }) => {
    console.log('🔍 Verificando build y assets del frontend...');
    
    await page.goto('http://localhost:3000');
    
    // Verificar que no hay errores 404 en assets
    const failed404s = [];
    
    page.on('response', response => {
      if (response.status() === 404 && response.url().includes('localhost:3000')) {
        failed404s.push(response.url());
      }
    });
    
    // Esperar que la página cargue completamente
    await page.waitForLoadState('networkidle');
    
    if (failed404s.length > 0) {
      console.log('❌ Assets 404:', failed404s);
    } else {
      console.log('✅ Todos los assets cargan correctamente');
    }
    
    // Verificar que JavaScript está funcionando
    const jsWorking = await page.evaluate(() => {
      return typeof React !== 'undefined' || document.querySelector('[data-reactroot]') !== null;
    });
    
    if (jsWorking) {
      console.log('✅ React está funcionando');
    } else {
      console.log('⚠️ React podría no estar funcionando correctamente');
    }
  });

});