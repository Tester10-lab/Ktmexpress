export const VALID_PREDECESSORS = {
  'In Warehouse': {
    dispatcher: ['Pending', 'Pick Up Requested', 'Picked Up', 'Warehouse', 'In Warehouse', 'Arrived', 'Dispatched', 'Sorted']
  },
  'Warehouse': {
    dispatcher: ['Pending', 'Pick Up Requested', 'Picked Up', 'Warehouse', 'In Warehouse', 'Arrived', 'Dispatched', 'Sorted', 'Postponed']
  },
  'Out for Delivery': {
    dispatcher: ['Warehouse', 'In Warehouse', 'Sorted', 'Postponed', 'Arrived', 'Dispatched', 'Picked Up', 'Pending', 'Pick Up Requested']
  },
  'Out of Delivery': {
    dispatcher: ['Warehouse', 'In Warehouse', 'Sorted', 'Postponed', 'Arrived', 'Dispatched', 'Picked Up', 'Pending', 'Pick Up Requested']
  },
  'Picked Up': {
    rider: ['Pick Up Requested', 'Pending'],
    dispatcher: ['Pick Up Requested', 'Pending', 'Warehouse', 'In Warehouse']
  },
  'Arrived': {
    dispatcher: ['Warehouse', 'In Warehouse', 'Dispatched', 'Picked Up', 'Out for Delivery'],
    rider: ['Warehouse', 'In Warehouse', 'Dispatched']
  },
  'Dispatched': {
    dispatcher: ['Warehouse', 'In Warehouse', 'Arrived', 'Out for Delivery'],
  },
  'Delivered': {
    rider: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse', 'Dispatched', 'Postponed'],
    dispatcher: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse', 'Dispatched', 'Postponed']
  },
  'Postponed': {
    rider: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse'],
    dispatcher: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse']
  },
  'Cancelled': {
    rider: ['Out for Delivery', 'Out of Delivery', 'Pick Up Requested', 'Picked Up', 'Warehouse', 'In Warehouse'],
    dispatcher: ['Pending', 'Pick Up Requested', 'Picked Up', 'Warehouse', 'In Warehouse', 'Out for Delivery', 'Out of Delivery']
  },
  'Returned': {
    rider: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse', 'Postponed'],
    dispatcher: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse', 'Postponed', 'Returned to Vendor']
  },
  'Exchange': {
    rider: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse', 'Postponed'],
    dispatcher: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse', 'Postponed']
  },
  'Exchanged': {
    rider: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse', 'Postponed'],
    dispatcher: ['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse', 'Postponed']
  }
};

export const TRANSITIONS = {
  dispatcher: {
    'Pick Up Requested': 'Picked Up',
    'Picked Up':         'Warehouse',
    'Warehouse':         'Out for Delivery',
    'In Warehouse':      'Out for Delivery',
    'Returned':          'Returned to Vendor',
  },
  rider: {
    'Warehouse':         'Out for Delivery',
    'In Warehouse':      'Out for Delivery',
    'Sorted':            'Out for Delivery',
    'Out for Delivery':  'Delivered',
  },
};

export const RIDER_RETURN = {
  'Out for Delivery': ['Returned', 'Cancelled', 'Exchanged', 'Exchange', 'Postponed'],
  'Out of Delivery':  ['Returned', 'Cancelled', 'Exchanged', 'Exchange', 'Postponed'],
};

/**
 * Checks if a status transition is allowed for a given role.
 * Reconciles explicit explicit overrides (like 'In Warehouse') with default linear transitions.
 */
export function canTransition(fromStatus, toStatus, role) {
  if (role === 'admin') return { allowed: true };
  if (fromStatus === toStatus) return { allowed: true };

  // Dispatcher is allowed to assign riders and move to Out for Delivery or Warehouse or Dispatched or Picked Up
  if (role === 'dispatcher') {
    if (['Out for Delivery', 'Out of Delivery', 'Warehouse', 'In Warehouse', 'Dispatched', 'Arrived', 'Picked Up', 'Postponed', 'Returned', 'Exchange'].includes(toStatus)) {
      return { allowed: true };
    }
  }

  // Rider return special case
  if (role === 'rider' && ['Returned', 'Cancelled', 'Exchanged', 'Exchange', 'Postponed', 'Delivered'].includes(toStatus)) {
    return { allowed: true };
  }

  // Check explicit overrides in VALID_PREDECESSORS
  const validForRole = VALID_PREDECESSORS[toStatus]?.[role];
  if (validForRole) {
    if (validForRole.includes(fromStatus)) {
      return { allowed: true };
    } else {
      return { allowed: false, reason: `Cannot transition to ${toStatus} from "${fromStatus}"` };
    }
  }

  // Default linear transition path
  const map = TRANSITIONS[role] || {};
  const expectedTo = map[fromStatus];

  if (expectedTo && expectedTo === toStatus) {
    return { allowed: true };
  }

  // Generic rejection
  return { allowed: false, reason: `Your role cannot transition package from "${fromStatus}" to "${toStatus}"` };
}

/**
 * Gets the default expected next status for a linear workflow.
 * Useful when the request doesn't specify a target action.
 */
export function getDefaultNextStatus(fromStatus, role) {
  if (role === 'admin') return null; // Admin has no "default" linear next step

  const map = TRANSITIONS[role] || {};
  return map[fromStatus];
}

/**
 * Gets all allowed actions/statuses a role can take from a current status.
 * Used primarily for UI lookup responses.
 */
export function getAllowedActions(fromStatus, role) {
  if (role === 'admin') return ['Any'];
  
  const actions = [];
  const defaultNext = getDefaultNextStatus(fromStatus, role);
  if (defaultNext) actions.push(defaultNext);
  
  if (role === 'rider' && RIDER_RETURN[fromStatus]) {
    RIDER_RETURN[fromStatus].forEach(action => {
      if (!actions.includes(action)) actions.push(action);
    });
  }
  
  // Check explicit actions from VALID_PREDECESSORS
  for (const [targetStatus, roleMap] of Object.entries(VALID_PREDECESSORS)) {
    const validFrom = roleMap[role];
    if (validFrom && validFrom.includes(fromStatus)) {
      if (!actions.includes(targetStatus)) {
        actions.push(targetStatus);
      }
    }
  }
  
  return actions;
}
