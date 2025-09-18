import React, { useContext } from 'react';
import { AppTitle, DashboardIcon, PlusCircleIcon, LibraryIcon, CalendarIcon, SettingsIcon } from '../constants';
import { LanguageContext } from '../App';
import { LanguageContextType } from '../types';

interface SidebarProps {
    currentView: string;
    setCurrentView: (view: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
    const { t } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const navItems = [
        { id: 'dashboard', label: t('dashboard'), icon: <DashboardIcon /> },
        { id: 'new-content', label: t('createNewContent'), icon: <PlusCircleIcon /> },
        { id: 'library', label: t('libraryTitle'), icon: <LibraryIcon /> },
        { id: 'calendar', label: t('calendarTitle'), icon: <CalendarIcon /> },
        { id: 'settings', label: t('settingsTitle'), icon: <SettingsIcon /> },
    ];

    return (
        <aside className="w-64 bg-gray-800 text-gray-300 flex flex-col">
            <div className="h-16 flex items-center justify-center text-white font-bold text-xl border-b border-gray-700">
                {AppTitle}
            </div>
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            currentView === item.id 
                                ? 'bg-blue-600 text-white' 
                                : 'hover:bg-gray-700 hover:text-white'
                        }`}
                    >
                        {item.icon}
                        <span className="ms-3">{item.label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
