import React, { useState } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, User, DollarSign, Calendar } from 'lucide-react';

const PackageCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    address: '',
    city: '',
    outOfValley: false,
    weight: 0.5,
    amount: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/vendor/packages', {
        ...formData,
        amount: Number(formData.amount),
        weight: Number(formData.weight)
      });
      alert('Package created successfully!');
      navigate('/vendor/packages');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
        <p className="text-sm text-gray-500 mt-1">Enter customer and delivery details to generate a tracking code.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Customer Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b pb-2">
              <User className="mr-2 text-blue-600" size={20} />
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  required
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. 9800000000"
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b pb-2 mt-8">
              <MapPin className="mr-2 text-blue-600" size={20} />
              Delivery Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Address *</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Koteshwor, Near Bhatbhateni"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g. Kathmandu"
                />
              </div>
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  id="outOfValley"
                  name="outOfValley"
                  checked={formData.outOfValley}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="outOfValley" className="ml-2 block text-sm text-gray-900">
                  Out of Kathmandu Valley?
                </label>
              </div>
            </div>
          </div>

          {/* Package & Payment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center border-b pb-2 mt-8">
              <Package className="mr-2 text-blue-600" size={20} />
              Package & Financials
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  name="weight"
                  required
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">COD Amount (Rs.) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">Rs.</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    name="amount"
                    required
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Total to collect from customer"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/vendor/packages')}
              className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Order & Generate Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageCreate;
