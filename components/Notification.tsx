import React, { useEffect, useState, useContext } from 'react';
import { Notification as NotificationType, LanguageContextType } from '../types';
import { LanguageContext } from '../App';

interface NotificationProps {
    notification: NotificationType | null;
    onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
    const { language } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (notification) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                handleClose();
            }, 5000); // Auto-close after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleClose = () => {
        setIsVisible(false);
        // Allow time for fade-out animation before clearing notification data
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!notification) return null;

    const positionClass = language === 'ar' ? 'left-5' : 'right-5';
    const baseClasses = `fixed top-5 w-full max-w-sm p-4 rounded-lg shadow-lg text-white z-[100] transform transition-all duration-300 ${positionClass}`;
    const typeClasses = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
    };
    const visibilityClass = isVisible ? 'opacity-100 translate-x-0' : `opacity-0 ${language === 'ar' ? '-translate-x-10' : 'translate-x-10'}`;

    return (
        <div className={`${baseClasses} ${typeClasses[notification.type]} ${visibilityClass}`}>
            <div className="flex items-start justify-between">
                <p className="flex-grow pe-4">{notification.message}</p>
                <button onClick={handleClose} className="-mt-1 -ms-1 flex-shrink-0 text-2xl leading-none">&times;</button>
            </div>
        </div>
    );
};

export default Notification;