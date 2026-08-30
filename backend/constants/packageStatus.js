export const PACKAGE_STATUS = {
  OUT_OF_DELIVERY: 'Out of Delivery',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  ARRIVE: 'Arrive',
  ARRIVED: 'Arrived',
  WAREHOUSE: 'Warehouse',
  IN_WAREHOUSE: 'In Warehouse',
  DELIVERED: 'Delivered',
  PENDING: 'Pending',
  PICKED_UP: 'Picked Up',
  PICKUP_REQUESTED: 'Pick Up Requested',
  POSTPONED: 'Postponed',
  RETURNED: 'Returned',
  RETURNED_TO_VENDOR: 'Returned to Vendor',
  EXCHANGE: 'Exchange',
  EXCHANGED: 'Exchanged',
  DISPATCH: 'Dispatch',
  DISPATCHED: 'Dispatched',
  CANCELLED: 'Cancelled',
  SORTED: 'Sorted',
};

export const PACKAGE_STATUSES = Array.from(new Set(Object.values(PACKAGE_STATUS)));

