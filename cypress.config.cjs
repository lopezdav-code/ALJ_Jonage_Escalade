const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000/ALJ_Jonage_Escalade',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',

    // Load Supabase credentials from environment variables or cypress.env.json
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || ''
    },

    // Configuration des rapports
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      reportFilename: 'mochawesome',
      overwrite: false,
      html: true,
      json: true,
      timestamp: 'yyyy-mm-dd_HH-MM-ss'
    },

    // Timeouts
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,

    // Viewport
    viewportWidth: 1280,
    viewportHeight: 720,

    // Screenshots
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    trashAssetsBeforeRuns: true,

    // Videos
    videosFolder: 'cypress/videos',
    video: true,
    videoCompression: 32,

    // Autres configurations
    chromeWebSecurity: false,
    waitForAnimations: true,
    animationDistanceThreshold: 5,
  },

  // Configuration pour les tests de composants
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
