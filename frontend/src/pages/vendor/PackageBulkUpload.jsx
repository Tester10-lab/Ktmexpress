import React, { useState } from 'react';
import api from '../../api/axios';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

const PackageBulkUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const processCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (lines.length < 2) throw new Error('CSV is empty or missing headers');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const required = ['customer name', 'customer phone', 'address', 'amount'];
    const missing = required.filter(r => !headers.includes(r));
    if (missing.length) throw new Error(`Missing required columns: ${missing.join(', ')}`);

    const nameIdx = headers.indexOf('customer name');
    const phoneIdx = headers.indexOf('customer phone');
    const addrIdx = headers.indexOf('address');
    const cityIdx = headers.indexOf('city');
    const outOfValleyIdx = headers.indexOf('out of valley');
    const weightIdx = headers.indexOf('weight');
    const amountIdx = headers.indexOf('amount');

    const parsed = [];
    for (let i = 1; i < lines.length; i++) {
      // Basic CSV splitting (does not handle quoted commas properly, but fine for simple cases)
      const row = lines[i].split(',').map(cell => cell.trim());
      if (row.length < headers.length) continue;

      parsed.push({
        customerName: row[nameIdx],
        customerPhone: row[phoneIdx],
        address: row[addrIdx],
        city: cityIdx >= 0 ? row[cityIdx] : '',
        outOfValley: outOfValleyIdx >= 0 ? ['yes', 'true', '1', 'y'].includes(row[outOfValleyIdx].toLowerCase()) : false,
        weight: weightIdx >= 0 ? Number(row[weightIdx]) || 0.5 : 0.5,
        amount: Number(row[amountIdx]) || 0
      });
    }

    return parsed;
  };

  const handleUpload = async () => {
    if (!file) return alert('Please select a CSV file first');

    try {
      setLoading(true);
      const text = await file.text();
      const packages = processCSV(text);
      
      if (!packages.length) {
        throw new Error('No valid rows found in the CSV');
      }

      const { data } = await api.post('/vendor/packages/bulk', { packages });
      
      setResults({
        success: true,
        count: data.data.length,
        message: `Successfully uploaded and generated tracking codes for ${data.data.length} packages.`
      });
      setFile(null);
    } catch (error) {
      setResults({
        success: false,
        message: error.message || error.response?.data?.message || 'Failed to upload CSV'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Order Upload</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/50">
          <FileSpreadsheet size={48} className="text-blue-500 mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Upload CSV File</h3>
          <p className="text-gray-500 text-sm text-center max-w-md mb-6">
            Upload a CSV containing your package details. Required columns: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-800">Customer Name, Customer Phone, Address, Amount</span>.
          </p>
          
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileChange} 
            className="hidden" 
            id="csv-upload" 
          />
          <label 
            htmlFor="csv-upload" 
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg cursor-pointer font-medium transition-colors shadow-sm inline-flex items-center"
          >
            <Upload size={18} className="mr-2" />
            {file ? file.name : 'Select CSV File'}
          </label>
        </div>

        {file && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Upload ${file.name}`}
            </button>
          </div>
        )}

        {results && (
          <div className={`mt-6 p-4 rounded-lg border flex items-start ${results.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            {results.success ? <CheckCircle className="text-green-600 mt-0.5 mr-3 flex-shrink-0" size={20} /> : <AlertCircle className="text-red-600 mt-0.5 mr-3 flex-shrink-0" size={20} />}
            <div>
              <h4 className={`font-semibold ${results.success ? 'text-green-800' : 'text-red-800'}`}>
                {results.success ? 'Upload Successful' : 'Upload Failed'}
              </h4>
              <p className={`text-sm mt-1 ${results.success ? 'text-green-700' : 'text-red-700'}`}>
                {results.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageBulkUpload;
