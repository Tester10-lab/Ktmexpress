export const PACKAGE_STATUS = {
  OUT_FOR_DELIVERY: 'Out for Delivery',
  ARRIVED: 'Arrived',
  WAREHOUSE: 'Warehouse',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  PENDING: 'Pending',
  PICKED_UP: 'Picked Up',
  POSTPONED: 'Postponed',
  RETURNED: 'Returned',
  EXCHANGE: 'Exchange',
  
  // Legacy & Workflow aliases
  PICKUP_REQUESTED: 'Pick Up Requested',
  OUT_OF_DELIVERY: 'Out for Delivery',
  ARRIVE: 'Arrived',
  IN_WAREHOUSE: 'Warehouse',
  RETURNED_TO_VENDOR: 'Returned',
  EXCHANGED: 'Exchange',
  DISPATCH: 'Dispatched',
  CANCELLED: 'Returned',
  SORTED: 'Warehouse',
};

export const STRICT_ALLOWED_STATUSES = [
  'Out for Delivery',
  'Arrived',
  'Warehouse',
  'Dispatched',
  'Delivered',
  'Pending',
  'Picked Up',
  'Postponed',
  'Returned',
  'Exchange'
];

export const PACKAGE_STATUSES = Array.from(new Set([
  ...Object.values(PACKAGE_STATUS),
  'Pick Up Requested',
  'In Warehouse',
  'Out of Delivery',
  'Arrive',
  'Returned to Vendor',
  'Exchanged',
  'Dispatch',
  'Cancelled',
  'Sorted'
]));

