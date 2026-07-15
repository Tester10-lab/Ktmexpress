import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Flashlight, FlashlightOff, AlertCircle, TerminalSquare, Upload } from 'lucide-react';

const QrScanner = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState('');
  const [hasCamera, setHasCamera] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [fileScanning, setFileScanning] = useState(false);
  
  const scannerRef = useRef(null);
  const html5QrCode = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const scannerId = "reader";
    let initPromise = null;
    
    const initScanner = async () => {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (devices && devices.length > 0) {
          if (html5QrCode.current) return; // Guard for StrictMode
          html5QrCode.current = new Html5Qrcode(scannerId);
          
          initPromise = html5QrCode.current.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText) => {
              if (decodedText.length < 5) {
                setError('Invalid QR code format.');
                return;
              }
              setError('');
              if (onScanSuccess) {
                onScanSuccess(decodedText);
              }
            },
            (errorMessage) => {
              // Ignore standard scan failures (empty frame)
            }
          );
          
          await initPromise;
          
          if (!isMounted && html5QrCode.current?.isScanning) {
            await html5QrCode.current.stop();
            html5QrCode.current.clear();
            return;
          }
          
          // Check for torch support after starting
          const track = html5QrCode.current.getRunningTrackCameraCapabilities();
          if (track && (track.torch || (typeof track.hasTorch === 'function' && track.hasTorch()))) {
            setTorchSupported(true);
          }
        } else {
          setHasCamera(false);
        }
      } catch (err) {
        console.error("Camera initialization error:", err);
        if (isMounted && err.name !== 'AbortError' && !err.message?.includes('AbortError')) {
          setHasCamera(false);
        }
      }
    };

    // Delay init to allow modal entrance animation to complete and size the container
    const timer = setTimeout(() => {
      if (isMounted) initScanner();
    }, 400);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCode.current) {
        if (html5QrCode.current.isScanning) {
          html5QrCode.current.stop().then(() => {
            html5QrCode.current.clear();
          }).catch(console.error);
        } else {
          try {
            html5QrCode.current.clear();
          } catch(e) {}
        }
      }
    };
  }, [onScanSuccess]);

  const toggleTorch = async () => {
    if (html5QrCode.current && torchSupported) {
      try {
        await html5QrCode.current.applyVideoConstraints({
          advanced: [{ torch: !torchOn }]
        });
        setTorchOn(!torchOn);
      } catch (err) {
        console.error("Failed to toggle torch:", err);
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const cleanCode = manualCode.trim();
    if (!cleanCode || cleanCode.length < 5) {
      setError('Invalid tracking code format.');
      return;
    }
    setError('');
    if (onScanSuccess) {
      onScanSuccess(cleanCode);
    }
  };

  const handleFileScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileScanning(true);
    setError('');

    try {
      // Create a temporary Html5Qrcode instance
      const scanner = new Html5Qrcode("file-qr-reader");
      const decodedText = await scanner.scanFile(file, false);
      if (decodedText.length < 5) {
        setError('Invalid QR code format in image.');
        setFileScanning(false);
        return;
      }
      setError('');
      setFileScanning(false);
      if (onScanSuccess) {
        onScanSuccess(decodedText);
      }
    } catch (err) {
      console.error("File scan error:", err);
      setError('Could not find a valid QR code in the image.');
      setFileScanning(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-xl overflow-hidden max-h-full">
      <div id="file-qr-reader" style={{ display: 'none' }}></div>
      <div className="bg-indigo-600 px-4 py-3 flex justify-between items-center text-white shrink-0">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Camera size={20} />
          Scan QR Code
        </h2>
        {onClose && (
          <button onClick={onClose} className="text-white hover:text-indigo-200 focus:outline-none text-2xl leading-none">
            &times;
          </button>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col items-center overflow-y-auto">
        {hasCamera ? (
          <div className="w-full max-w-sm relative flex flex-col items-center">
            <div id="reader" className="w-full overflow-hidden rounded-lg bg-black" style={{ minHeight: '300px' }}></div>
            {torchSupported && (
              <button 
                type="button"
                onClick={toggleTorch}
                className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90"
              >
                {torchOn ? <FlashlightOff size={24} /> : <Flashlight size={24} />}
              </button>
            )}
            <div className="mt-3 text-center">
              <label className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline flex items-center justify-center gap-1">
                <Upload size={12} />
                {fileScanning ? 'Scanning image...' : 'Or upload a QR code image instead'}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileScan}
                  disabled={fileScanning}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 bg-gray-50 rounded-lg w-full max-w-sm border border-dashed border-gray-300">
            <Camera size={48} className="mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700">Camera not available or permission denied</p>
            <p className="text-xs text-gray-400 mt-1 mb-4">Please use manual entry below or upload a QR image.</p>
            
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
              <Upload size={16} />
              {fileScanning ? 'Scanning...' : 'Upload QR Image'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileScan}
                disabled={fileScanning}
              />
            </label>
          </div>
        )}

        {error && (
          <div className="mt-4 w-full max-w-sm p-3 bg-red-50 text-red-700 rounded-md flex items-start gap-2 text-sm">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 w-full max-w-sm shrink-0">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white text-sm text-gray-500">Or enter manually</span>
            </div>
          </div>

          <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <TerminalSquare size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm uppercase"
                placeholder="Enter tracking code"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Submit
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
