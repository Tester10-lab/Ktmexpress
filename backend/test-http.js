import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const token = jwt.sign({ _id: 'fake-id', role: 'dispatcher' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

fetch('http://localhost:5000/api/dispatcher/pickups', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(res => res.text())
.then(text => console.log('Response:', text))
.catch(err => console.error('Fetch error:', err));
