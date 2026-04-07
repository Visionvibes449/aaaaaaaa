import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../context/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      
      // Join user-specific room
      newSocket.emit('join_user', user.id);
    });

    newSocket.on('notification', (notification) => {
      console.log('New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png'
        });
      }
    });

    newSocket.on('ticket_update', (data) => {
      console.log('Ticket updated:', data);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, isAuthenticated]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const joinTicketRoom = (ticketId) => {
    if (socket) {
      socket.emit('join_ticket', ticketId);
    }
  };

  const leaveTicketRoom = (ticketId) => {
    if (socket) {
      socket.leave(`ticket:${ticketId}`);
    }
  };

  const markNotificationRead = (index) => {
    setNotifications((prev) => 
      prev.map((n, i) => i === index ? { ...n, isRead: true } : n)
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    socket,
    notifications,
    joinTicketRoom,
    leaveTicketRoom,
    markNotificationRead,
    clearNotifications,
    unreadCount: notifications.filter(n => !n.isRead).length
  };
};

export default useSocket;
