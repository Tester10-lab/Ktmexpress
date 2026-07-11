import request from 'supertest';
import { app } from '../../server.js';

test('track package', async () => {
  const res = await request(app).get('/api/public/track/LOG-TEST1');
  console.log(res.status, res.body);
});
