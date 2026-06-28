import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../store/ToastContext';
import MetricCard from '../../components/MetricCard';
import { DollarSign, Weight, MapPin, Users } from 'lucide-react';

import GlobalSettings from './sections/GlobalSettings';
import OutsideValleyFees from './sections/OutsideValleyFees';
import DeliveryChargeRules from './sections/DeliveryChargeRules';
import VendorPricingOverrides from './sections/VendorPricingOverrides';

const PricingEngine = () => {
  const { showToast } = useToast();
  const [summary, setSummary] = useState({});
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [globalSettings, setGlobalSettings] = useState({ ktmBaseRate: 150, weightSurchargePerKg: 50 });

  const fetchSummary = async () => {
    try {
      const res = await api.get('/admin/pricing-engine/summary');
      setSummary(res.data.data);
      if (res.data.data.globalSettings) {
        setGlobalSettings({
          ktmBaseRate: res.data.data.globalSettings.ktmBaseRate,
          weightSurchargePerKg: res.data.data.globalSettings.weightSurchargePerKg
        });
      }
    } catch (err) {
      showToast('Failed to load pricing summary', 'error');
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Global KTM Rate" value={`Rs. ${globalSettings.ktmBaseRate}`} color="primary"
          icon={<DollarSign className="w-6 h-6 text-brand-600" />} />
        <MetricCard title="Surcharge / KG" value={`Rs. ${globalSettings.weightSurchargePerKg}`} color="warning"
          icon={<Weight className="w-6 h-6 text-amber-600" />} />
        <MetricCard title="Cities Configured" value={loadingSummary ? '-' : summary.totalOvCities} color="info"
          icon={<MapPin className="w-6 h-6 text-sky-600" />} />
        <MetricCard title="Custom Pricing Vendors" value={loadingSummary ? '-' : summary.customPricingVendors} color="purple"
          icon={<Users className="w-6 h-6 text-purple-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlobalSettings onUpdate={fetchSummary} />
        <div className="lg:col-span-2">
          <OutsideValleyFees onUpdate={fetchSummary} />
        </div>
      </div>

      <DeliveryChargeRules />
      <VendorPricingOverrides onUpdate={fetchSummary} />
    </div>
  );
};

export default PricingEngine;
