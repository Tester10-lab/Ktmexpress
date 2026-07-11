import request from 'supertest';
import { app } from '../../server.js';
import mongoose from 'mongoose';

(async () => {
  console.log('Testing...');
  
  const res1 = await request(app).get('/api/public/track/');
  console.log('PUBLIC ROUTE:', res1.status, res1.body);
  
  const res2 = await request(app).get('/api/public/track/LOG-TEST1');
  console.log('PUBLIC 2:', res2.status, res2.body);
  
  console.log('Done');
  process.exit(0);
})();
