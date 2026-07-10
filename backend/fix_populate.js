import fs from 'fs';
import path from 'path';

const controllersDir = path.resolve('controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace all variations of .populate('vendorId', ...)
  // e.g., .populate('vendorId', 'name')
  // e.g., .populate('vendorId', 'name vendorMeta')
  // e.g., .populate('vendorId','name')
  // Match .populate('vendorId', <any string literal>)
  const regex = /\.populate\(\s*['"]vendorId['"]\s*,\s*['"][^'"]+['"]\s*\)/g;
  
  content = content.replace(regex, `.populate('vendorId', 'name email phone vendorMeta')`);
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
