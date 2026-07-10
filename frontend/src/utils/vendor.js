export const getVendorDisplayName = (vendor, fallback = 'Unknown Vendor') => {
  if (!vendor) return fallback;
  return vendor.vendorMeta?.shopName || vendor.shopName || vendor.name || fallback;
};
