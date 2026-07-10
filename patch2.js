const fs = require('fs');
let code = fs.readFileSync('backend/controllers/adminController.js', 'utf8');

let lines = code.split('\n');
let replaced1 = false;
let replaced2 = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const createPackageForVendor')) {
    for (let j = i; j < i + 100; j++) {
      if (lines[j].includes("status: 'Pending',") && !replaced1) {
        lines[j] = lines[j].replace("'Pending'", "'In Warehouse'");
        lines[j+2] = lines[j+2].replace("'Invoice Created'", "'In Warehouse'");
        lines[j+3] = lines[j+3].replace(/message: .*,/, "message: 'Package created directly in warehouse by Admin',");
        replaced1 = true;
        break;
      }
    }
  }
  if (lines[i].includes('export const bulkCreatePackagesForVendor')) {
    for (let j = i; j < i + 100; j++) {
      if (lines[j].includes("status: 'Pending',") && !replaced2) {
        lines[j] = lines[j].replace("'Pending'", "'In Warehouse'");
        lines[j+2] = lines[j+2].replace("'Invoice Created'", "'In Warehouse'");
        lines[j+3] = lines[j+3].replace(/message: .*,/, "message: 'Package created directly in warehouse by Admin',");
        replaced2 = true;
        break;
      }
    }
  }
}

if (replaced1 && replaced2) {
  fs.writeFileSync('backend/controllers/adminController.js', lines.join('\n'));
  console.log('adminController patched successfully.');
} else {
  console.log('Failed to patch adminController.', replaced1, replaced2);
}
