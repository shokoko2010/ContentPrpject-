import React, { useState, useContext } from 'react';
import { GeneratedContent, LanguageContextType } from '../types';
import { LanguageContext } from '../App';

interface CalendarViewProps {
    library: GeneratedContent[];
    onEditItem: (content: GeneratedContent) => void;
    onUpdateItem: (id: string, updates: Partial<GeneratedContent>) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ library, onEditItem }) => {
    const { t, language } = useContext(LanguageContext as React.Context<LanguageContextType>);
    const [currentDate, setCurrentDate] = useState(new Date());

    const scheduledItems = library.filter(item => item.status === 'scheduled' && item.scheduledFor);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    const endDate = new Date(endOfMonth);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    let day = startDate;

    while (day <= endDate) {
        days.push(new Date(day));
        day.setDate(day.getDate() + 1);
    }
    
    const getItemsForDay = (date: Date) => {
        return scheduledItems.filter(item => {
            if (!item.scheduledFor) return false;
            const itemDate = new Date(item.scheduledFor);
            return itemDate.getFullYear() === date.getFullYear() &&
                   itemDate.getMonth() === date.getMonth() &&
                   itemDate.getDate() === date.getDate();
        });
    };

    const changeMonth = (amount: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + amount, 1));
    };

    const weekDays = language === 'ar' 
        ? ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="p-8 h-full">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('calendarTitle')}</h1>
                    <p className="text-gray-400 mt-1">{t('calendarHint')}</p>
                </div>
            </header>
            
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="text-white p-2 rounded-full hover:bg-gray-700">&lt;</button>
                    <h2 className="text-xl font-semibold text-white">
                        {currentDate.toLocaleString(language, { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="text-white p-2 rounded-full hover:bg-gray-700">&gt;</button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-400">
                    {weekDays.map(wd => <div key={wd} className="py-2">{wd}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1">
                    {days.map(d => {
                        const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                        const isToday = new Date().toDateString() === d.toDateString();
                        const dayItems = getItemsForDay(d);
                        return (
                            <div key={d.toString()} className={`h-32 p-2 border border-gray-700/50 rounded-md flex flex-col ${isCurrentMonth ? 'bg-gray-800' : 'bg-gray-900/50 text-gray-500'}`}>
                                <div className={`font-bold ${isToday ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : ''}`}>
                                    {d.getDate()}
                                </div>
                                <div className="mt-1 flex-grow overflow-y-auto text-xs space-y-1">
                                    {dayItems.map(item => (
                                         <div key={item.id} onClick={() => onEditItem(item)} className="bg-blue-900/70 p-1 rounded-md text-white cursor-pointer hover:bg-blue-800 truncate">
                                            {item.title}
                                         </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
