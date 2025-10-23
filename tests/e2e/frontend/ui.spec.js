import { test, expect } from '@playwright/test';

/**
 * Tests para el frontend React
 * Verifica que la interfaz de usuario funcione correctamente
 */

const FRONTEND_URL = 'http://localhost:3000';

test.describe('🎨 Frontend UI Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Configurar intercepción de logs del navegador
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🚨 Console Error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('💥 Page Error:', error.message);
    });
  });

  test('🏠 Landing Page - Welcome debe cargar correctamente', async ({ page }) => {
    console.log('🔍 Navegando a la página principal...');

    await page.goto(FRONTEND_URL);

    // La aplicación actual redirige automáticamente a /login si no está autenticado
    await page.waitForURL('**/login');

    // Verificar que estamos en la página de login
    await expect(page).toHaveURL(/.*\/login/);

    // Verificar que la página de login cargue correctamente
    await expect(page.locator('h2').filter({ hasText: 'Iniciar Sesión' })).toBeVisible();

    console.log('✅ Redirección automática a login funciona correctamente');
  });

  test('🔐 Login Page - Página de login debe ser accesible', async ({ page }) => {
    console.log('🔍 Navegando a la página de login...');

    await page.goto(`${FRONTEND_URL}/login`);

    // Verificar que la página de login cargue
    await expect(page.locator('h2').filter({ hasText: 'Iniciar Sesión' })).toBeVisible();

    // Verificar campos del formulario usando selectores más específicos
    await expect(page.locator('input[placeholder*="usuario"], input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();

    // Verificar botón de submit
    await expect(page.locator('button[type="submit"]').filter({ hasText: 'Iniciar Sesión' })).toBeVisible();

    console.log('✅ Página de login cargada correctamente');
  });

  test('👤 Register Page - Sistema no tiene registro público', async ({ page }) => {
    console.log('🔍 Verificando que no existe página de registro pública...');

    // Intentar acceder a una ruta de registro que no existe
    await page.goto(`${FRONTEND_URL}/register`);

    // La aplicación debería redirigir a login o mostrar página 404
    // Verificar que no estamos en una página de registro funcional
    const hasRegisterForm = await page.locator('input[name="username"], input[name="email"]').count();
    expect(hasRegisterForm).toBe(0);

    console.log('✅ Sistema correctamente no tiene registro público');
  });

  test('🔑 Login Flow - Proceso completo de login debe funcionar', async ({ page }) => {
    console.log('🔍 Probando flujo completo de login...');
    
    await page.goto(`${FRONTEND_URL}/login`);
    
    // Llenar formulario de login
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    
    console.log('📝 Formulario de login llenado');
    
    // Capturar respuestas de la red para debugging
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/auth/login') && response.status() === 200
    );
    
    // Hacer click en submit
    await page.click('button[type="submit"], button:has-text("Ingresar")');
    
    console.log('🖱️ Click en botón de login');
    
    try {
      // Esperar respuesta exitosa del backend
      const response = await responsePromise;
      console.log('✅ Login response status:', response.status());
      
      // Verificar redirección al dashboard
      await expect(page).toHaveURL(/home|dashboard/);
      
      // Verificar que aparezca la navbar autenticada usando selectores más específicos
      await expect(page.locator('nav a[href="/admin"]')).toBeVisible({ timeout: 10000 });

      console.log('✅ Login exitoso, usuario redirigido al dashboard');
      
    } catch (error) {
      console.log('❌ Error en login:', error.message);
      
      // Capturar screenshot para debugging
      await page.screenshot({ path: 'test-results/login-error.png' });
      
      // Verificar si hay mensajes de error en la UI
      const errorMessage = page.locator('text=Error, text=error, .error, .alert-danger');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log('🚨 Error en UI:', errorText);
      }
      
      throw error;
    }
  });

  test('👥 Navigation - Navegación debe funcionar según el rol del usuario', async ({ page }) => {
    console.log('🔍 Probando navegación después de login...');
    
    // Hacer login primero
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"], button:has-text("Ingresar")');
    
    // Esperar a que aparezca la navbar
    await expect(page.locator('nav')).toBeVisible({ timeout: 10000 });
    
    // Verificar que aparezcan los elementos de navegación para admin usando selectores específicos
    await expect(page.locator('nav a[href="/"]')).toBeVisible(); // Inicio
    await expect(page.locator('nav a[href="/catalog"]')).toBeVisible(); // Catálogo
    await expect(page.locator('nav a[href="/admin"]')).toBeVisible(); // Admin

    console.log('✅ Navegación cargada correctamente para admin');

    // Probar navegación a diferentes secciones
    await page.click('nav a[href="/admin"]');
    await expect(page).toHaveURL(/admin/);

    console.log('✅ Navegación a Admin exitosa');
  });

  test('🔄 User Creation - Creación de usuarios via API debe funcionar', async ({ page, request }) => {
    console.log('🔍 Probando creación de usuario via API...');

    const timestamp = Date.now();
    const userData = {
      username: `testuser_${timestamp}`,
      email: `test_${timestamp}@example.com`,
      password: 'password123',
      full_name: 'Test User Playwright'
    };

    // Crear usuario via API
    const response = await request.post(`${FRONTEND_URL}/api/v1/auth/register`, {
      data: userData
    });

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.username).toBe(userData.username);
    expect(data.email).toBe(userData.email);

    console.log('✅ Usuario creado exitosamente via API');
  });

  test('🚪 Logout Flow - Proceso de logout debe funcionar', async ({ page }) => {
    console.log('🔍 Probando flujo de logout...');

    // Hacer login primero
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="username"], input[type="text"]', 'admin');
    await page.fill('input[name="password"], input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Esperar a estar logueado
    await expect(page.locator('nav a[href="/admin"]')).toBeVisible({ timeout: 10000 });

    // Buscar y hacer click en el botón de logout
    const logoutButton = page.locator('button:has-text("Cerrar"), button:has-text("Logout"), [data-testid="logout"]');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
    } else {
      // Intentar con el menú de usuario si existe
      const userMenu = page.locator('[data-testid="user-menu"], .user-menu, .dropdown');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.click('text=Cerrar Sesión');
      } else {
        console.log('⚠️ Botón de logout no encontrado');
      }
    }

    // Verificar que se redirige a login
    await expect(page).toHaveURL(/login/);

    console.log('✅ Logout exitoso');
  });

  test('📱 Responsive Design - UI debe funcionar en dispositivos móviles', async ({ page }) => {
    console.log('🔍 Probando diseño responsive...');

    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(FRONTEND_URL);

    // La aplicación redirige a login, verificar que funciona en móvil
    await page.waitForURL('**/login');
    await expect(page.locator('h2').filter({ hasText: 'Iniciar Sesión' })).toBeVisible();

    console.log('✅ Diseño responsive verificado');
  });
});