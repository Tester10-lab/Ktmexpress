import React, { useState, useEffect } from 'react';
import { Package, MapPin, DollarSign, Save, X, ArrowLeft, Loader } from 'lucide-react';
import api from '../../../api/axios';
import { useToast } from '../../../context/ToastContext';
import { useNavigate } from 'react-router-dom';

const EMPTY_FORM = {
  customerName: '',
  customerPhone: '',
  address: '',
  city: '',
  outOfValley: false,
  weight: 0.5,
  amount: '',
  deliveryCharge: 0,
  packageAccess: 'sealed',
  invoiceId: '',
  comments: ''
};

const PackageCreate = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Auto-save draft
  useEffect(() => {
    const draft = localStorage.getItem('packageCreateDraft');
    if (draft) {
      try {
        setForm(JSON.parse(draft));
      } catch (e) {
        // ignore invalid draft
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('packageCreateDraft', JSON.stringify(form));
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors(err => ({ ...err, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.customerName.trim()) newErrors.customerName = "Recipient name is required";
    if (!form.customerPhone.trim()) newErrors.customerPhone = "Phone number is required";
    if (!form.address.trim()) newErrors.address = "Delivery address is required";
    if (form.amount === '' || isNaN(Number(form.amount))) newErrors.amount = "Valid COD amount is required";
    if (form.weight === '' || isNaN(Number(form.weight))) newErrors.weight = "Valid weight is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      return showToast('Please fix the errors in the form', 'error');
    }

    setIsSubmitting(true);
    try {
      const payload = { ...form, amount: Number(form.amount), weight: Number(form.weight) };
      const res = await api.post('/vendor/packages', payload);
      
      showToast(`Order created successfully! Tracking: ${res.data.data.trackingCode}`, 'success');
      localStorage.removeItem('packageCreateDraft');
      navigate('/vendor/packages');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Create New Order</h2>
          <p className="text-sm text-gray-500">Enter package and recipient details to generate a tracking code.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Recipient Details */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><MapPin size={18}/></div>
            Recipient Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input type="text" name="customerName" value={form.customerName} onChange={handleChange} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none ${errors.customerName ? 'border-rose-500' : 'border-gray-300 focus:border-blue-500'}`} placeholder="John Doe" />
              {errors.customerName && <p className="text-rose-500 text-xs mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input type="text" name="customerPhone" value={form.customerPhone} onChange={handleChange} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none ${errors.customerPhone ? 'border-rose-500' : 'border-gray-300 focus:border-blue-500'}`} placeholder="98XXXXXXXX" />
              {errors.customerPhone && <p className="text-rose-500 text-xs mt-1">{errors.customerPhone}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Delivery Address *</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none ${errors.address ? 'border-rose-500' : 'border-gray-300 focus:border-blue-500'}`} placeholder="Street, Landmark, Area" />
              {errors.address && <p className="text-rose-500 text-xs mt-1">{errors.address}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City / District</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Kathmandu" />
            </div>
            <div className="flex items-center pt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="outOfValley" checked={form.outOfValley} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm font-medium text-gray-700">Out of Valley Delivery</span>
              </label>
            </div>
          </div>
        </div>

        {/* Package & Finance */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={18}/></div>
            Package & Financials
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cash on Delivery (COD) Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rs.</span>
                <input type="number" name="amount" value={form.amount} onChange={handleChange} className={`w-full pl-12 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none ${errors.amount ? 'border-rose-500' : 'border-gray-300 focus:border-blue-500'}`} placeholder="0" />
              </div>
              {errors.amount && <p className="text-rose-500 text-xs mt-1">{errors.amount}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (KG) *</label>
              <div className="relative">
                <input type="number" step="0.1" name="weight" value={form.weight} onChange={handleChange} className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none ${errors.weight ? 'border-rose-500' : 'border-gray-300 focus:border-blue-500'}`} placeholder="0.5" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">KG</span>
              </div>
              {errors.weight && <p className="text-rose-500 text-xs mt-1">{errors.weight}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference / Invoice ID</label>
              <input type="text" name="invoiceId" value={form.invoiceId} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="INV-001" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
              <select name="packageAccess" value={form.packageAccess} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white">
                <option value="sealed">Sealed (Do not open)</option>
                <option value="open">Openable (Customer can check)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes for Rider / Dispatcher</label>
              <textarea name="comments" value={form.comments} onChange={handleChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Call before delivery, leave at reception, etc..."></textarea>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => { setForm(EMPTY_FORM); localStorage.removeItem('packageCreateDraft'); }} className="btn btn-outline text-gray-600 hover:text-gray-900">
            <X size={18} className="mr-2" /> Clear Form
          </button>
          <button type="submit" disabled={isSubmitting} className="btn btn-primary px-8 flex items-center">
            {isSubmitting ? (
              <><Loader size={18} className="animate-spin mr-2" /> Creating...</>
            ) : (
              <><Save size={18} className="mr-2" /> Create Order</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PackageCreate;
