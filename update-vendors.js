const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const frontendSrc = path.join(__dirname, 'frontend', 'src');

walkDir(frontendSrc, (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(/p\.vendorId\?\.name/g, "(p.vendorId?.vendorMeta?.shopName || p.vendorId?.name)");
    content = content.replace(/pkg\.vendorId\?\.name/g, "(pkg.vendorId?.vendorMeta?.shopName || pkg.vendorId?.name)");
    content = content.replace(/s\.vendorId\?\.name/g, "(s.vendorId?.vendorMeta?.shopName || s.vendorId?.name)");
    content = content.replace(/pkg\.vendorId\.name/g, "(pkg.vendorId?.vendorMeta?.shopName || pkg.vendorId?.name)");
    
    // Quick fix for already wrapped logic like: (p.vendorId?.vendorMeta?.shopName || (p.vendorId?.vendorMeta?.shopName || p.vendorId?.name))
    // Not needed if we only run once.
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
