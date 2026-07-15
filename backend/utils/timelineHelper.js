/**
 * DO NOT write directly to pkg.timeline anywhere else.
 * All timeline events must be created through appendTimelineEvent().
 */

import { nowStr } from './helpers.js';

export const appendTimelineEvent = (pkg, {
  status,
  message = '',
  user = 'System',
  role = '',
  type = 'System',
  location = '',
  scannedBy = null,
  scanEventId = null,
  changes = []
}) => {
  if (!pkg.timeline) {
    pkg.timeline = [];
  }

  pkg.timeline.push({
    time: nowStr(),
    status,
    message,
    user,
    role,
    type,
    location,
    scannedBy,
    scanEventId,
    changes
  });
};
