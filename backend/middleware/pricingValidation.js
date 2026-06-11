export const validateGlobalSettings = (req, res, next) => {
  const { ktmBaseRate, weightSurchargePerKg } = req.body;
  
  if (ktmBaseRate !== undefined && (typeof ktmBaseRate !== 'number' || ktmBaseRate < 0)) {
    return res.status(400).json({ success: false, message: 'ktmBaseRate must be a non-negative number' });
  }
  
  if (weightSurchargePerKg !== undefined && (typeof weightSurchargePerKg !== 'number' || weightSurchargePerKg < 0)) {
    return res.status(400).json({ success: false, message: 'weightSurchargePerKg must be a non-negative number' });
  }
  
  next();
};

export const validateOutsideValleyFee = (req, res, next) => {
  const { city, fee } = req.body;
  
  if (!city || typeof city !== 'string' || city.trim() === '') {
    return res.status(400).json({ success: false, message: 'City is required and must be a string' });
  }
  
  if (fee === undefined || typeof fee !== 'number' || fee < 0) {
    return res.status(400).json({ success: false, message: 'Fee is required and must be a non-negative number' });
  }
  
  next();
};
