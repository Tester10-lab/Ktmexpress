import fs from 'fs';
import path from 'path';

const file = path.resolve('frontend/src/pages/dispatcher/DispatcherDashboard.jsx');
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/<<<<<<< HEAD\nconst PickupRequests = \(\{ globalSearch = '', hideSearch = false \}\) => \{\n  const \{ openTracking \} = useTrackingDrawer\(\);\n=======\nconst PickupRequests = \(\) => \{\n  const openTracking = \(\) => \{\}; \/\/ const \{ openTracking \} = useTrackingDrawer\(\);\n>>>>>>> d7b9ec4 \(fix: Replace all vendor.name with getVendorDisplayName helper globally across frontend\)/, 'const PickupRequests = ({ globalSearch = \'\', hideSearch = false }) => {\n  const openTracking = () => {}; // const { openTracking } = useTrackingDrawer();');

fs.writeFileSync(file, code, 'utf8');
console.log('Conflict resolved.');
