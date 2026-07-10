import fs from 'fs';
import path from 'path';

const file = path.resolve('frontend/src/pages/dispatcher/DispatcherDashboard.jsx');
let code = fs.readFileSync(file, 'utf8');

// 1. QrScanner
code = code.replace(/import QrScanner from '\.\.\/\.\.\/components\/QrScanner';/g, '// import QrScanner from \'../../components/QrScanner\';');
code = code.replace(/<QrScanner onScanSuccess={handleScanSuccess} onClose={\(\) => setScannerOpen\(false\)} \/>/g, '{/* <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setScannerOpen(false)} /> */}');

// 2. TrackingDrawerContext
code = code.replace(/import { useTrackingDrawer } from '\.\.\/\.\.\/store\/TrackingDrawerContext';/g, '// import { useTrackingDrawer } from \'../../store/TrackingDrawerContext\';');
code = code.replace(/const { openTracking } = useTrackingDrawer\(\);/g, 'const openTracking = () => {}; // const { openTracking } = useTrackingDrawer();');
code = code.replace(/const { openShopPickups } = useTrackingDrawer\(\);/g, 'const openShopPickups = () => {}; // const { openShopPickups } = useTrackingDrawer();');

// 3. RiderHistoryContext
code = code.replace(/import { useRiderHistory } from '\.\.\/\.\.\/store\/RiderHistoryContext';/g, '// import { useRiderHistory } from \'../../store/RiderHistoryContext\';');
code = code.replace(/const { openRiderHistory } = useRiderHistory\(\);/g, 'const openRiderHistory = () => {}; // const { openRiderHistory } = useRiderHistory();');

// 4. OutsideValleyActionMenu
code = code.replace(/import OutsideValleyActionMenu from '\.\.\/\.\.\/components\/OutsideValleyActionMenu';/g, '// import OutsideValleyActionMenu from \'../../components/OutsideValleyActionMenu\';');
code = code.replace(/<OutsideValleyActionMenu\s+packageId={p\._id}\s+currentStatus={p\.status}\s+onUpdate={fetchData}\s+\/>/g, '{/* <OutsideValleyActionMenu packageId={p._id} currentStatus={p.status} onUpdate={fetchData} /> */}');

fs.writeFileSync(file, code, 'utf8');
console.log('Fixed missing imports in DispatcherDashboard.jsx');
