import React, { useState, useRef } from 'react';
import { UploadCloud, AlertCircle, CheckCircle, FileSpreadsheet, X, Download } from 'lucide-react';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);
  const fileInputRef = useRef();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && (selected.name.endsWith('.csv') || selected.name.endsWith('.xlsx'))) {
      setFile(selected);
      setPreviewData([]);
      setUploadStats(null);
    } else {
      showToast('Please select a valid CSV or XLSX file', 'error');
    }
  };

  const handleUploadPreview = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/vendor/packages/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = res.data.data;
      setPreviewData(data);
      
      const valid = data.filter(d => d.isValid).length;
      const invalid = data.length - valid;
      setUploadStats({ total: data.length, valid, invalid });
      
      if (invalid > 0) {
        showToast(`Found ${invalid} rows with errors. Please review.`, 'warning');
      } else {
        showToast(`Successfully validated ${valid} packages!`, 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to process file', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitValid = async () => {
    const validPackages = previewData.filter(d => d.isValid).map(d => d.data);
    if (validPackages.length === 0) return showToast('No valid packages to import', 'error');

    setIsSubmitting(true);
    try {
      const res = await api.post('/vendor/packages/bulk', { packages: validPackages });
      showToast(`Successfully imported ${res.data.data.length} packages!`, 'success');
      navigate('/vendor/packages');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to import packages', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewData([]);
    setUploadStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadTemplate = () => {
    // Basic CSV template
    const headers = "customerName,customerPhone,address,city,amount,weight,outOfValley,invoiceId\n";
    const sample = "John Doe,9800000000,Thamel,Kathmandu,1500,1,false,INV-001\n";
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ktmexpress_bulk_template.csv';
    a.click();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Bulk Upload Orders</h2>
        <p className="text-sm text-gray-500">Upload an Excel or CSV file to create multiple orders at once.</p>
      </div>

      {!previewData.length ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
            />
            <UploadCloud size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Click or drag file to this area to upload</h3>
            <p className="text-sm text-gray-500 mb-4">Support for a single or bulk upload. Strictly prohibited from uploading company data or other band files.</p>
            <p className="text-xs font-medium text-gray-400">Accepted formats: .csv, .xlsx</p>
          </div>

          {file && (
            <div className="mt-6 flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="text-blue-600" />
                <div className="text-left">
                  <p className="font-medium text-blue-900">{file.name}</p>
                  <p className="text-xs text-blue-600">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleReset} className="btn btn-ghost btn-sm text-gray-500"><X size={16}/></button>
                <button onClick={handleUploadPreview} disabled={isUploading} className="btn btn-primary btn-sm">
                  {isUploading ? 'Processing...' : 'Preview Validation'}
                </button>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
            <button onClick={downloadTemplate} className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-2">
              <Download size={16} /> Download Sample Template
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Validation Report</h3>
              <p className="text-sm text-gray-500 mt-1">
                Found <span className="font-semibold text-gray-900">{uploadStats?.total}</span> records. 
                <span className="text-emerald-600 font-medium ml-2">{uploadStats?.valid} valid</span>, 
                <span className="text-rose-600 font-medium ml-2">{uploadStats?.invalid} invalid</span>.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleReset} className="btn btn-outline">Cancel</button>
              <button 
                onClick={handleSubmitValid} 
                disabled={isSubmitting || uploadStats?.valid === 0} 
                className="btn btn-primary"
              >
                {isSubmitting ? 'Importing...' : `Import ${uploadStats?.valid} Valid Orders`}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px]">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Row</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City/Address</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Errors</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr key={i} className={`border-b ${!row.isValid ? 'bg-rose-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.row}</td>
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle size={12} /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 py-1 px-2 rounded-md text-xs font-medium bg-rose-100 text-rose-800">
                          <AlertCircle size={12} /> Invalid
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.data.customerName || <span className="text-gray-400 italic">Missing</span>}</td>
                    <td className="px-4 py-3">{row.data.customerPhone || <span className="text-gray-400 italic">Missing</span>}</td>
                    <td className="px-4 py-3">{row.data.city ? `${row.data.city}, ` : ''}{row.data.address}</td>
                    <td className="px-4 py-3">Rs. {row.data.amount}</td>
                    <td className="px-4 py-3 text-rose-600 text-xs">
                      {row.errors.map((err, ei) => <div key={ei}>• {err}</div>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;
