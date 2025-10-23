import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de Playwright para tests E2E del sistema SEACE ProjectFinder
 * Testa tanto el frontend como el backend desplegados en Docker
 */
export default defineConfig({
  testDir: './e2e',
  /* Ejecutar tests en paralelo por archivo */
  fullyParallel: true,
  /* Fallar CI si commiteas archivos de test.only() accidentalmente */
  forbidOnly: !!process.env.CI,
  /* Reintentar en CI solo */
  retries: process.env.CI ? 2 : 0,
  /* Opt out de parallel tests en CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter para generar reportes detallados */
  reporter: [
    ['html', { outputFolder: 'html-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['line']
  ],
  
  /* Configuración global para todos los tests */
  use: {
    /* URL base del sistema desplegado */
    baseURL: 'http://localhost:3000',
    
    /* Capturar screenshots en fallos */
    screenshot: 'only-on-failure',
    
    /* Capturar video en fallos */
    video: 'retain-on-failure',
    
    /* Capturar traces en fallos para debugging */
    trace: 'on-first-retry',
    
    /* Configurar timeouts */
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  /* Configurar proyectos para diferentes navegadores */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Tests en dispositivos móviles */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    
    /* Proyecto específico para tests de API */
    {
      name: 'api-tests',
      testMatch: '**/api/*.spec.js',
      use: {
        baseURL: 'http://localhost:8001',
      },
    },
  ],

  /* Ejecutar servidor de desarrollo local antes de iniciar tests */
  // webServer: [
  //   {
  //     command: 'docker-compose up -d',
  //     cwd: '../',
  //     port: 3000,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //   },
  //   {
  //     command: 'echo "Backend health check"',
  //     port: 8001,
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 60000,
  //   }
  // ],
});