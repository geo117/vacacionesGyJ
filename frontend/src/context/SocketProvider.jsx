import { useState, useEffect } from 'react';
import { socket } from '../services/socket';
import { SocketContext } from './SocketContext';

export const SocketProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      /*console.log('Socket conectado');*/
      setIsConnected(true);
      socket.emit('request_notifications');
    };

    const onDisconnect = () => {
      /*console.log('Socket desconectado');*/
      setIsConnected(false);
    };

    const onConnected = (data) => {
      const mensaje = `Conectado al servidor: ${data.message}`;
      /*console.log(mensaje);*/
    };

    const onNotifications = (data) => {
      /*console.log('Notificaciones recibidas:', data);*/
      setNotifications(data);
    };

    const onNewNotification = (data) => {
      /*console.log('Nueva notificación:', data);*/
      setNotifications(prev => [data, ...prev]);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connected', onConnected);
    socket.on('notifications', onNotifications);
    socket.on('new_notification', onNewNotification);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connected', onConnected);
      socket.off('notifications', onNotifications);
      socket.off('new_notification', onNewNotification);
    };
  }, []);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <SocketContext.Provider value={{ 
      socket, 
      notifications, 
      isConnected, 
      addNotification,
      clearNotifications 
    }}>
      {children}
    </SocketContext.Provider>
  );
};
