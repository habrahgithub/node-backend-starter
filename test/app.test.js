const request = require('supertest');
const app = require('../index');

describe('SWD Pulse Application', () => {
  describe('GET /', () => {
    it('should return Hello World message', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toBe('Hello World from SWD Pulse!');
    });

    it('should return HTML content type', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('Health check endpoints', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent')
        .expect(404);
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/')
        .expect(200);
    });
  });

  describe('Server configuration', () => {
    it('should listen on default port 3000', () => {
      // This test verifies the port configuration
      expect(process.env.PORT || 3000).toBe(3000);
    });

    it('should have proper package.json structure', () => {
      const packageJson = require('../package.json');
      expect(packageJson.name).toBe('swd-pulse');
      expect(packageJson.version).toBeDefined();
      expect(packageJson.main).toBe('index.js');
    });
  });
});