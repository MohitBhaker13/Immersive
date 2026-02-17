import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

const Calendar = () => {
  const [calendarData, setCalendarData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    loadCalendar();
  }, []);

  const loadCalendar = async () => {
    try {
      const response = await api.get('/calendar');
      setCalendarData(response.data);
    } catch (error) {
      console.error('Failed to load calendar:', error);
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getIntensity = (minutes) => {
    if (minutes === 0) return 'bg-white';
    if (minutes < 15) return 'bg-[#F4F1EA]';
    if (minutes < 30) return 'bg-[#D4C4AB]';
    if (minutes < 60) return 'bg-[#B89A78]';
    return 'bg-[#A68A64]';
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentDate);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F6F1]">
        <Navigation currentPage="calendar" />
        <div className="flex items-center justify-center h-96">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#A68A64] border-r-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F6F1] paper-texture pb-20 md:pb-0">
      <Navigation currentPage="calendar" />
      
      <div className="max-w-[920px] mx-auto px-4 md:px-8 py-6 md:py-12">
        <h1 
          className="text-3xl md:text-5xl font-bold text-[#2C2A27] mb-8 md:mb-12"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Reading Calendar
        </h1>

        <div className="card-paper p-5 md:p-8">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <button
              data-testid="prev-month-btn"
              onClick={() => changeMonth(-1)}
              className="btn-paper px-3 md:px-4 py-2 text-sm md:text-base"
            >
              ← <span className="hidden md:inline">Previous</span>
            </button>
            <h2 
              className="text-lg md:text-2xl font-bold text-[#2C2A27]"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {monthName}
            </h2>
            <button
              data-testid="next-month-btn"
              onClick={() => changeMonth(1)}
              className="btn-paper px-3 md:px-4 py-2 text-sm md:text-base"
            >
              <span className="hidden md:inline">Next</span> →
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-3 md:mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs md:text-sm font-medium text-[#6A645C] py-2">
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{day.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {days.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              
              const dateStr = day.toISOString().split('T')[0];
              const dayData = calendarData[dateStr] || { sessions: 0, minutes: 0 };
              const intensity = getIntensity(dayData.minutes);
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div
                  key={dateStr}
                  data-testid={`calendar-day-${day.getDate()}`}
                  className={`aspect-square rounded-md border flex flex-col items-center justify-center ${
                    intensity
                  } ${
                    isToday ? 'border-[#A68A64] border-2' : 'border-[#E8E3D9]'
                  } transition-colors active:border-[#A68A64]`}
                >
                  <div className="text-xs md:text-sm font-medium text-[#2C2A27]">{day.getDate()}</div>
                  {dayData.sessions > 0 && (
                    <div className="text-[10px] md:text-xs text-[#6A645C] mt-0.5 md:mt-1">
                      {dayData.minutes}m
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-[#E8E3D9]">
            <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs md:text-sm text-[#6A645C]">
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-white border border-[#E8E3D9]"></div>
                <span>None</span>
              </div>
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-[#F4F1EA] border border-[#E8E3D9]"></div>
                <span>&lt;15m</span>
              </div>
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-[#D4C4AB] border border-[#E8E3D9]"></div>
                <span>15-30m</span>
              </div>
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-[#B89A78] border border-[#E8E3D9]"></div>
                <span>30-60m</span>
              </div>
              <div className="flex items-center space-x-1.5 md:space-x-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-[#A68A64] border border-[#E8E3D9]"></div>
                <span>60m+</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;