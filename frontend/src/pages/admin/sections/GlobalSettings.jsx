import React, { useState, useEffect, useRef } from 'react';
import api from '../../../api/axios';
import { useToast } from '../../../store/ToastContext';
import { useSettings } from '../../../store/SettingsContext';

const GlobalSettings = ({ onUpdate }) => {
  const { showToast } = useToast();
  const { refreshSettings } = useSettings();
  const [globalSettings, setGlobalSettings] = useState({ ktmBaseRate: 150, weightSurchargePerKg: 50 });
  const [savingGlobal, setSavingGlobal] = useState(false);
  
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Fetch initial to populate form if not passed from summary
    api.get('/admin/pricing-engine/summary').then(res => {
      if (res.data.data.globalSettings) {
        setGlobalSettings({
          ktmBaseRate: res.data.data.globalSettings.ktmBaseRate,
          weightSurchargePerKg: res.data.data.globalSettings.weightSurchargePerKg
        });
      }
    }).catch(() => {});
  }, []);

  const handleSaveGlobalSettings = async (e) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      await api.put('/admin/pricing-engine/settings', globalSettings);
      showToast('Global settings updated', 'success');
      if (onUpdate) onUpdate(true);
    } catch (err) {
      showToast(err.message || 'Failed to update global settings', 'error');
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return showToast('Please select a logo first', 'error');
    
    const formData = new FormData();
    formData.append('logo', logoFile);

    setUploadingLogo(true);
    try {
      await api.post('/admin/settings/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Logo updated successfully', 'success');
      refreshSettings();
      setLogoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Failed to upload logo', 'error');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="card-premium h-fit col-span-1">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h3 className="font-bold text-slate-800 text-lg">Global Pricing Settings</h3>
        <p className="text-sm text-slate-500">Default rates across the platform</p>
      </div>
      <div className="p-6">
        <form onSubmit={handleSaveGlobalSettings} className="space-y-5 border-b border-slate-100 pb-5 mb-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">KTM Valley Base Rate (Rs.)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
              <input type="number" min="0" required className="input-field pl-9" 
                value={globalSettings.ktmBaseRate} 
                onChange={(e) => setGlobalSettings({...globalSettings, ktmBaseRate: Number(e.target.value)})} />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Applied to deliveries within the valley unless overridden by vendor.</p>
          </div>
          <div className="pb-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Weight Surcharge per KG (Rs.)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">Rs.</span>
              <input type="number" min="0" required className="input-field pl-9" 
                value={globalSettings.weightSurchargePerKg} 
                onChange={(e) => setGlobalSettings({...globalSettings, weightSurchargePerKg: Number(e.target.value)})} />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Added for every KG above 1KG.</p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={savingGlobal}>
            {savingGlobal ? 'Saving...' : 'Save Global Settings'}
          </button>
        </form>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Platform Brand Logo</label>
          <div className="flex gap-3">
            <input 
              type="file" 
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => setLogoFile(e.target.files[0])}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors border border-slate-200 rounded-xl"
            />
            <button 
              type="button" 
              onClick={handleLogoUpload}
              disabled={uploadingLogo || !logoFile}
              className="btn-secondary whitespace-nowrap disabled:opacity-50"
            >
              {uploadingLogo ? 'Uploading...' : 'Upload'}
            </button>
          </div>
          <p className="text-xs text-slate-500">Recommended size: 250x60px. Will update globally instantly.</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettings;
