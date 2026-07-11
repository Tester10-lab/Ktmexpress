export const VALID_PREDECESSORS = {
  'In Warehouse': {
    dispatcher: ['Pending', 'Pick Up Requested', 'Picked Up']
  },
  'Out for Delivery': {
    dispatcher: ['In Warehouse', 'Sorted', 'Postponed']
  },
  'Picked Up': {
    rider: ['Pick Up Requested']
  },
  'Delivered': {
    rider: ['Out for Delivery']
  },
  'Postponed': {
    rider: ['Out for Delivery']
  },
  'Cancelled': {
    rider: ['Out for Delivery', 'Pick Up Requested', 'Picked Up']
  },
  'Returned': {
    rider: ['Out for Delivery']
  },
  'Exchanged': {
    rider: ['Out for Delivery']
  }
};

export const TRANSITIONS = {
  dispatcher: {
    'Pick Up Requested': 'Picked Up',
    'Picked Up':         'In Warehouse',
    'In Warehouse':      'Sorted',
    'Returned':          'Returned to Vendor',
  },
  rider: {
    'Sorted':            'Out for Delivery',
    'Out for Delivery':  'Delivered',
  },
};

export const RIDER_RETURN = {
  'Out for Delivery': ['Returned', 'Cancelled', 'Exchanged'],
};

/**
 * Checks if a status transition is allowed for a given role.
 * Reconciles explicit explicit overrides (like 'In Warehouse') with default linear transitions.
 */
export function canTransition(fromStatus, toStatus, role) {
  if (role === 'admin') return { allowed: true };

  // Rider return special case
  if (role === 'rider' && ['Returned', 'Cancelled', 'Exchanged'].includes(toStatus)) {
    const validRiderActions = RIDER_RETURN[fromStatus];
    if (validRiderActions && validRiderActions.includes(toStatus)) {
      return { allowed: true };
    }
    // Cancelled is also explicitly allowed in VALID_PREDECESSORS from Pick Up Requested/Picked Up
    if (toStatus === 'Cancelled' && ['Pick Up Requested', 'Picked Up'].includes(fromStatus)) {
       return { allowed: true };
    }
    return { allowed: false, reason: `Cannot transition to ${toStatus} from "${fromStatus}"` };
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
