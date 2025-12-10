import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: number;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
    link: string | null;
    isRead: boolean;
    time_ago: string;
}

export default function NotificationWidget() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch('https://127.0.0.1:8000/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch (e) {
            console.error("Erreur notif", e);
        }
    };

    // 1. Polling toutes les 30 secondes
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    // 2. Gestion du clic extérieur pour fermer
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: number, link: string | null) => {
        const token = localStorage.getItem('token');
        // Optimistic UI update (on met à jour l'interface tout de suite)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        // Appel API
        fetch(`https://127.0.0.1:8000/api/notifications/${id}/read`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (link) {
            setIsOpen(false);
            navigate(link);
        }
    };

    const markAllRead = async () => {
        const token = localStorage.getItem('token');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        
        fetch(`https://127.0.0.1:8000/api/notifications/read-all`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    };

    const getIconColor = (type: string) => {
        switch(type) {
            case 'WARNING': return 'bg-orange-100 text-orange-600';
            case 'SUCCESS': return 'bg-green-100 text-green-600';
            case 'DANGER': return 'bg-red-100 text-red-600';
            default: return 'bg-blue-100 text-blue-600';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full hover:bg-gray-100 relative transition-colors text-gray-600"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-sm text-gray-700">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                                <Check className="h-3 w-3 mr-1" /> Tout marquer comme lu
                            </button>
                        )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm">
                                Aucune notification pour le moment.
                            </div>
                        ) : (
                            <ul>
                                {notifications.map(notif => (
                                    <li 
                                        key={notif.id}
                                        onClick={() => markAsRead(notif.id, notif.link)}
                                        className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors flex items-start gap-3 ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                                        <div className="flex-1">
                                            <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                                                {notif.message}
                                            </p>
                                            <span className="text-xs text-gray-400 mt-1 block">{notif.time_ago}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}