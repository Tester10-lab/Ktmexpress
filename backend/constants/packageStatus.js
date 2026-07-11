export const PACKAGE_STATUS = {
  PENDING: 'Pending',
  PICKUP_REQUESTED: 'Pick Up Requested',
  PICKED_UP: 'Picked Up',
  IN_WAREHOUSE: 'In Warehouse',
  SORTED: 'Sorted',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  POSTPONED: 'Postponed',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
  RETURNED_TO_VENDOR: 'Returned to Vendor',
};

export const PACKAGE_STATUSES = Object.values(PACKAGE_STATUS);
