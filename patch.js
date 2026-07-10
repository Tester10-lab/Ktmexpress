const fs = require('fs');
let code = fs.readFileSync('backend/controllers/adminController.js', 'utf8');

const s1 = `      status: 'Pending',
      timeline: [{
        time: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'Invoice Created',
        message: \`Admin created order on behalf of vendor \${getVendorDisplayName(vendor)}\`,
        user: req.user.name,
      }]`;

const r1 = `      status: 'In Warehouse',
      timeline: [{
        time: new Date().toISOString().replace('T', ' ').substring(0, 16),
        status: 'In Warehouse',
        message: 'Package created directly in warehouse by Admin',
        user: req.user.name,
      }]`;

code = code.replace(s1, r1);

const s2 = `        status: 'Pending',
        timeline: [{
          time: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'Invoice Created',
          message: \`Admin bulk created on behalf of vendor \${getVendorDisplayName(vendor)}\`,
          user: req.user.name,
        }]`;

const r2 = `        status: 'In Warehouse',
        timeline: [{
          time: new Date().toISOString().replace('T', ' ').substring(0, 16),
          status: 'In Warehouse',
          message: 'Package created directly in warehouse by Admin',
          user: req.user.name,
        }]`;

code = code.replace(s2, r2);

const s3 = `    const result = await processCsvImport(req.file.path, vendorId, creatorName);`;
const r3 = `    const result = await processCsvImport(req.file.path, vendorId, creatorName, req.user.role);`;

code = code.replace(s3, r3);

fs.writeFileSync('backend/controllers/adminController.js', code);
console.log("Patched adminController.js successfully!");
