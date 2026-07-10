import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://dipupratice_db_user:A6Dn5R0dArnVPjXm@cluster0.fqlne0d.mongodb.net/ktmexpress?retryWrites=true&w=majority';
const API_URL = 'https://ktmexpress-backend.onrender.com/api';

async function verify() {
  try {
    // 2. Login as Admin
    console.log('Logging in as Admin...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ktmexpress.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    // We need a vendor ID to create a package. We can just hit the API for vendors.
    console.log('Fetching vendors...');
    const vendorRes = await fetch(`${API_URL}/admin/users?role=vendor`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const vendorData = await vendorRes.json();
    const vendor = vendorData.data.find(v => v.role === 'vendor');
    const vendorId = vendor._id;
    console.log(`Using vendor: ${vendor.name} (${vendorId})`);

    // 3. Create Package via API
    console.log('\nCreating package via API...');
    const createRes = await fetch(`${API_URL}/admin/packages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        vendorId,
        customerName: 'Test Admin Flow Customer',
        customerPhone: '9841000000',
        address: 'Test Address',
        city: 'Kathmandu',
        amount: 1000,
        weight: 1
      })
    });
    
    const createData = await createRes.json();
    const createdPkgId = createData.data._id;
    const trackingCode = createData.data.trackingCode;
    console.log(`Package created: ${trackingCode} | Status: ${createData.data.status}`);

    // 4. Retrieve MongoDB Document directly
    console.log('\nConnecting to MongoDB directly...');
    try {
      await mongoose.connect(MONGO_URI);
      const Package = mongoose.connection.collection('packages');
      const dbDoc = await Package.findOne({ _id: new mongoose.Types.ObjectId(createdPkgId) });
      console.log('--- MONGODB DOCUMENT ---');
      console.log(JSON.stringify(dbDoc, null, 2));
    } catch (dbErr) {
      console.log('Failed to connect to MongoDB directly from local script:', dbErr.message);
    } finally {
      mongoose.disconnect();
    }

    // 5. Retrieve Page 1 API
    console.log('\n--- API /admin/packages?page=1&limit=10 ---');
    const page1Res = await fetch(`${API_URL}/admin/packages?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const page1Data = await page1Res.json();
    console.log(`Total records: ${page1Data.pagination.total}`);
    const page1HasPkg = page1Data.data.some(p => p.trackingCode === trackingCode);
    console.log(`Package ${trackingCode} found on page 1? ${page1HasPkg}`);
    
    // 6. Retrieve Page 2 API
    console.log('\n--- API /admin/packages?page=2&limit=10 ---');
    const page2Res = await fetch(`${API_URL}/admin/packages?page=2&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const page2Data = await page2Res.json();
    const page2HasPkg = page2Data.data.some(p => p.trackingCode === trackingCode);
    console.log(`Package ${trackingCode} found on page 2? ${page2HasPkg}`);

    // If it's on page 1, print out the JSON for that package from API
    if (page1HasPkg) {
      console.log('\n--- JSON FROM API (Page 1) ---');
      const apiPkg = page1Data.data.find(p => p.trackingCode === trackingCode);
      console.log(JSON.stringify(apiPkg, null, 2));
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

verify();
