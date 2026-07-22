import { useState } from 'react';
import api from '../../api/axios';

export const useVerification = (fetchPackages, showToast) => {
  const [verificationModal, setVerificationModal] = useState(false);
  const [currentPkg, setCurrentPkg] = useState(null);
  const [form, setForm] = useState({
    status: '',
    amount: 0,
    deliveryCharge: 0,
    comments: '',
    receiverName: '',
    receiverPhone: '',
    deliveryDate: '',
    holdReason: '',
    rejectReason: '',
    paymentMethod: 'Cash',
    collectionType: '',
    reason: 'System correction',
    customRemarks: '',
  });

  const openVerificationModal = (pkg) => {
    const isVerified = pkg.deliveryVerificationStatus === 'Verified';
    const defaultVal = isVerified ? pkg : (pkg.verificationDraft || pkg.riderSubmission || pkg);
    setCurrentPkg(pkg);
    setForm({
      status: defaultVal.status || pkg.status,
      amount: defaultVal.amount !== undefined ? defaultVal.amount : pkg.amount,
      deliveryCharge: defaultVal.deliveryCharge !== undefined ? defaultVal.deliveryCharge : pkg.deliveryCharge,
      comments: defaultVal.comments || pkg.comments || '',
      receiverName: defaultVal.receiverName || pkg.customerName || '',
      receiverPhone: defaultVal.receiverPhone || pkg.customerPhone || '',
      deliveryDate: defaultVal.deliveryDate ? new Date(defaultVal.deliveryDate).toISOString().split('T')[0] : pkg.deliveryDate ? new Date(pkg.deliveryDate).toISOString().split('T')[0] : '',
      holdReason: defaultVal.holdReason || pkg.holdReason || '',
      rejectReason: defaultVal.rejectReason || pkg.rejectReason || '',
      paymentMethod: defaultVal.paymentMethod || pkg.paymentMethod || 'Cash',
      collectionType: defaultVal.collectionType || pkg.collectionType || '',
      reason: 'System correction',
      customRemarks: '',
    });
    setVerificationModal(true);
  };

  const handleSaveDraft = async () => {
    if (!currentPkg) return;
    try {
      await api.put(`/packages/${currentPkg._id}/verification-draft`, form);
      showToast('Verification draft saved successfully.', 'success');
      setVerificationModal(false);
      if (fetchPackages) fetchPackages(true);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to save draft', 'error');
    }
  };

  const handleVerify = async () => {
    if (!currentPkg) return;
    try {
      const payload = {
        ...form,
        version: currentPkg.__v,
      };
      await api.post(`/packages/${currentPkg._id}/verify-action`, payload);
      showToast('Package verified successfully.', 'success');
      setVerificationModal(false);
      if (fetchPackages) fetchPackages(true);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to verify package', 'error');
    }
  };

  const handleQuickVerify = async (pkg) => {
    if (!window.confirm(`Verify delivery status of package ${pkg.trackingCode} as submitted?`)) return;
    try {
      const payload = {
        version: pkg.__v,
        status: pkg.riderSubmission?.status || pkg.status,
        amount: pkg.riderSubmission?.amount !== undefined ? pkg.riderSubmission.amount : pkg.amount,
        deliveryCharge: pkg.deliveryCharge,
        comments: pkg.riderSubmission?.comments || pkg.comments,
        paymentMethod: pkg.paymentMethod || 'Cash',
        reason: 'System correction',
        customRemarks: 'Directly verified from pending'
      };
      await api.post(`/packages/${pkg._id}/verify-action`, payload);
      showToast('Package verified successfully.', 'success');
      if (fetchPackages) fetchPackages(true);
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to verify package', 'error');
    }
  };

  return {
    verificationModal,
    setVerificationModal,
    currentPkg,
    form,
    setForm,
    openVerificationModal,
    handleSaveDraft,
    handleVerify,
    handleQuickVerify
  };
};
