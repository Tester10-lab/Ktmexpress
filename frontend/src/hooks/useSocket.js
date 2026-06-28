import { useEffect, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import useNotificationSound from './useNotificationSound';

export function useSocket() {
  const { user, activeRole } = useAuth();
  const { showToast } = useToast();
  const { playNotification, playAlert } = useNotificationSound();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    let socketInstance;
    if (user?.role) {
      import('socket.io-client').then(({ io }) => {
        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const socketUrl = rawUrl.replace(/\/api\/?$/, '');
        
        // Use the role-specific token
        const token = localStorage.getItem(`${activeRole}_token`);

        socketInstance = io(socketUrl, {
          withCredentials: true,
          transports: ['websocket'],
          auth: { token }
        });
        
        socketInstance.emit('join_role', user.role);
        if (user._id) socketInstance.emit('join_user', user._id);
        
        socketInstance.on('notification', (data) => {
          showToast(data.message || data.title || 'New Notification', 'info');
          if (data.type === 'alert') playAlert();
          else playNotification();
        });

        setSocket(socketInstance);
      });
    }
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [user, activeRole, playNotification, playAlert, showToast]);

  return socket;
}
