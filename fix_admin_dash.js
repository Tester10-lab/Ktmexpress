import fs from 'fs';
import path from 'path';

const file = path.resolve('frontend/src/pages/admin/AdminDashboard.jsx');
let code = fs.readFileSync(file, 'utf8');

// Ensure import exists
if (!code.includes('getVendorDisplayName')) {
  code = code.replace("import { useToast } from '../../store/ToastContext';", "import { useToast } from '../../store/ToastContext';\nimport { getVendorDisplayName } from '../../utils/vendor';");
}

// 1. Manage Users table
code = code.replace(/<div className="font-bold text-slate-900">{u\.name}<\/div>/g, '<div className="font-bold text-slate-900">{u.role === \'vendor\' ? getVendorDisplayName(u) : (u.name || \'Unknown\')}</div>');
// 2. Scan History
code = code.replace(/<td className="px-6 py-4 font-bold text-slate-900">{a\.vendorInfo\?\.\[0\]\?\.name \|\| 'Unknown'}<\/td>/g, '<td className="px-6 py-4 font-bold text-slate-900">{getVendorDisplayName(a.vendorInfo?.[0], \'Unknown\')}</td>');
// 3. Settlements
code = code.replace(/<div className="font-bold text-slate-900">{s\.vendorId\?\.name \|\| 'Unknown'}<\/div>/g, '<div className="font-bold text-slate-900">{getVendorDisplayName(s.vendorId, \'Unknown\')}</div>');
// 4. Packages
code = code.replace(/<td className="px-6 py-4 font-bold text-slate-900">{p\.vendorId\?\.name \|\| '—'}<\/td>/g, '<td className="px-6 py-4 font-bold text-slate-900">{getVendorDisplayName(p.vendorId, \'—\')}</td>');

// 5. Vendor options map
code = code.replace(/{v\.name} — {v\.vendorMeta\?\.shopName \|\| v\.email}/g, '{getVendorDisplayName(v, v.email)}');
code = code.replace(/`${v\.name} — ${v\.vendorMeta\?\.shopName \|\| v\.email}`/g, 'getVendorDisplayName(v, v.email)');

// 6. CSV Vendor Search
code = code.replace(/\(v\.name \+ ' ' \+ \(v\.vendorMeta\?\.shopName \|\| v\.email\)\)/g, 'getVendorDisplayName(v, v.email)');

// 7. Notification messages
code = code.replace(/`${s\.vendorId\?\.name \|\| 'A vendor'} requested Rs\./g, '`${getVendorDisplayName(s.vendorId, \'A vendor\')} requested Rs.');

fs.writeFileSync(file, code, 'utf8');
console.log('AdminDashboard.jsx updated');
