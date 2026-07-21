import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  ChevronDown, 
  ChevronRight, 
  CheckCheck, 
  Package, 
  Truck, 
  Bike, 
  Building2, 
  ShieldCheck, 
  Inbox, 
  Coins, 
  Store, 
  Settings,
  Check
} from 'lucide-react';

export const MODULE_TYPES = {
  PACKAGES: 'Packages',
  DISPATCH: 'Dispatch',
  RIDERS: 'Riders',
  WAREHOUSE: 'Warehouse',
  VERIFICATION: 'Verification',
  PICKUP_REQUESTS: 'Pickup Requests',
  COD: 'COD',
  VENDORS: 'Vendors',
  SYSTEM: 'System'
};

const MODULE_META = {
  [MODULE_TYPES.PACKAGES]: { label: 'Packages', icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  [MODULE_TYPES.DISPATCH]: { label: 'Dispatch', icon: Truck, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
  [MODULE_TYPES.RIDERS]: { label: 'Riders', icon: Bike, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  [MODULE_TYPES.WAREHOUSE]: { label: 'Warehouse', icon: Building2, color: 'text-purple-600 bg-purple-50 border-purple-100' },
  [MODULE_TYPES.VERIFICATION]: { label: 'Verification', icon: ShieldCheck, color: 'text-amber-600 bg-amber-50 border-amber-100' },
  [MODULE_TYPES.PICKUP_REQUESTS]: { label: 'Pickup Requests', icon: Inbox, color: 'text-sky-600 bg-sky-50 border-sky-100' },
  [MODULE_TYPES.COD]: { label: 'COD', icon: Coins, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
  [MODULE_TYPES.VENDORS]: { label: 'Vendors', icon: Store, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  [MODULE_TYPES.SYSTEM]: { label: 'System', icon: Settings, color: 'text-slate-600 bg-slate-50 border-slate-100' }
};

export const getNotificationModule = (n) => {
  if (n.module && Object.values(MODULE_TYPES).includes(n.module)) {
    return n.module;
  }
  const text = `${n.title || ''} ${n.message || ''} ${n.path || ''} ${n.type || ''}`.toLowerCase();

  if (text.includes('pickup')) return MODULE_TYPES.PICKUP_REQUESTS;
  if (text.includes('verification') || text.includes('verify')) return MODULE_TYPES.VERIFICATION;
  if (text.includes('cod') || text.includes('settlement') || text.includes('handover')) return MODULE_TYPES.COD;
  if (text.includes('rider') || text.includes('expense')) return MODULE_TYPES.RIDERS;
  if (text.includes('warehouse') || text.includes('ready for delivery')) return MODULE_TYPES.WAREHOUSE;
  if (text.includes('dispatch') || text.includes('delivery') || text.includes('out for delivery')) return MODULE_TYPES.DISPATCH;
  if (text.includes('vendor') || text.includes('shop')) return MODULE_TYPES.VENDORS;
  if (text.includes('package') || text.includes('order') || text.includes('tracking') || text.includes('pkg')) return MODULE_TYPES.PACKAGES;

  return MODULE_TYPES.SYSTEM;
};

const parseNotificationTimestamp = (n) => {
  if (n.timestamp) return n.timestamp;
  if (n.createdAt) return new Date(n.createdAt).getTime();
  if (n.date) return new Date(n.date).getTime();
  if (n.time) {
    const parsed = Date.parse(n.time);
    if (!isNaN(parsed)) return parsed;
  }
  return Date.now();
};

const NotificationsDropdown = ({ notifications = [], onNotificationClick, onClose }) => {
  const [readIds, setReadIds] = useState(new Set());
  const [collapsedModules, setCollapsedModules] = useState({});

  const isRead = (n) => Boolean(n.read || readIds.has(n.id));

  // Process and group notifications
  const { groupedNotifications, totalUnread } = useMemo(() => {
    const map = {};
    let unreadCount = 0;

    notifications.forEach(n => {
      const moduleName = getNotificationModule(n);
      if (!map[moduleName]) {
        map[moduleName] = [];
      }

      const itemRead = isRead(n);
      if (!itemRead) unreadCount++;

      map[moduleName].push({
        ...n,
        computedModule: moduleName,
        timestamp: parseNotificationTimestamp(n),
        isReadItem: itemRead
      });
    });

    // Sort items within each group newest first
    Object.keys(map).forEach(mod => {
      map[mod].sort((a, b) => b.timestamp - a.timestamp);
    });

    // Convert map to sorted array of groups
    const groups = Object.keys(map).map(mod => {
      const items = map[mod];
      const unreadInGroup = items.filter(i => !i.isReadItem).length;
      const newestTimestamp = items[0]?.timestamp || 0;

      return {
        module: mod,
        items,
        unreadCount: unreadInGroup,
        totalCount: items.length,
        newestTimestamp,
        meta: MODULE_META[mod] || MODULE_META[MODULE_TYPES.SYSTEM]
      };
    });

    // Sort groups: groups with unread items first, then by newest timestamp descending
    groups.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      return b.newestTimestamp - a.newestTimestamp;
    });

    return { groupedNotifications: groups, totalUnread: unreadCount };
  }, [notifications, readIds]);

  const toggleGroupCollapse = (moduleName) => {
    setCollapsedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const markGroupAsRead = (e, group) => {
    e.stopPropagation();
    const newRead = new Set(readIds);
    group.items.forEach(item => newRead.add(item.id));
    setReadIds(newRead);
  };

  const markAllAsRead = () => {
    const newRead = new Set(readIds);
    notifications.forEach(n => newRead.add(n.id));
    setReadIds(newRead);
  };

  const handleItemClick = (n) => {
    setReadIds(prev => new Set(prev).add(n.id));
    if (onClose) onClose();
    if (onNotificationClick) {
      onNotificationClick(n);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 md:w-[420px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50">
      
      {/* Popover Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
          {totalUnread > 0 ? (
            <span className="bg-brand-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {totalUnread} new
            </span>
          ) : (
            <span className="bg-slate-200 text-slate-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
              All read
            </span>
          )}
        </div>
        {totalUnread > 0 && (
          <button 
            onClick={markAllAsRead}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Popover Body - Scrollable */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100">
        {groupedNotifications.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No notifications yet</p>
            <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          groupedNotifications.map(group => {
            const Icon = group.meta.icon;
            const isCollapsed = Boolean(collapsedModules[group.module]);

            return (
              <div key={group.module} className="bg-white">
                
                {/* Module Group Header */}
                <div 
                  onClick={() => toggleGroupCollapse(group.module)}
                  className="px-4 py-3 bg-slate-50/60 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between transition-colors group select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button className="text-slate-400 group-hover:text-slate-600 transition-colors">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    <div className={`p-1.5 rounded-lg border flex items-center justify-center ${group.meta.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-xs text-slate-800 truncate">
                      {group.meta.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({group.totalCount})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {group.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        {group.unreadCount} unread
                      </span>
                    )}

                    {group.unreadCount > 0 && (
                      <button
                        onClick={(e) => markGroupAsRead(e, group)}
                        title="Mark group as read"
                        className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-white transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 text-slate-500 hover:text-brand-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Module Group Notification Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-50">
                    {group.items.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleItemClick(n)}
                        className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${
                          n.isReadItem 
                            ? 'bg-white hover:bg-slate-50 opacity-65' 
                            : 'bg-brand-50/20 hover:bg-brand-50/40 font-medium'
                        }`}
                      >
                        {/* Status Icon or Emoji */}
                        <div className="text-lg shrink-0 mt-0.5 select-none">
                          {n.icon || '🔔'}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 pr-2">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className={`text-xs font-semibold truncate ${n.isReadItem ? 'text-slate-700' : 'text-slate-900'}`}>
                              {n.title}
                            </p>
                            {n.time && (
                              <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                                {n.time}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>

                        {/* Unread Indicator Dot */}
                        {!n.isReadItem && (
                          <div className="w-2 h-2 rounded-full bg-brand-500 shrink-0 self-center"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default NotificationsDropdown;
