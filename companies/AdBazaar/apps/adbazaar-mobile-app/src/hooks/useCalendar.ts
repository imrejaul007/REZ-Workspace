import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { api } from '../services/api';
import { CalendarEvent } from '../types';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';

export function useCalendar() {
  const {
    calendarEvents,
    setCalendarEvents,
    addCalendarEvent,
    selectedDate,
    setSelectedDate,
  } = useAppStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      const events = await api.getCalendarEvents(start, end);
      setCalendarEvents(events);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth, setCalendarEvents]);

  const createEvent = useCallback(
    async (event: Partial<CalendarEvent>): Promise<CalendarEvent | null> => {
      setError(null);
      try {
        const newEvent = await api.createCalendarEvent(event);
        addCalendarEvent(newEvent);
        return newEvent;
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [addCalendarEvent]
  );

  const nextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1));
  }, [currentMonth]);

  const prevMonth = useCallback(() => {
    setCurrentMonth(subMonths(currentMonth, 1));
  }, [currentMonth]);

  const goToToday = useCallback(() => {
    setCurrentMonth(new Date());
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  }, [setSelectedDate]);

  const getEventsForDate = useCallback(
    (date: string): CalendarEvent[] => {
      return calendarEvents.filter((event) => event.date === date);
    },
    [calendarEvents]
  );

  const hasEventsOnDate = useCallback(
    (date: string): boolean => {
      return calendarEvents.some((event) => event.date === date);
    },
    [calendarEvents]
  );

  useEffect(() => {
    fetchEvents();
  }, [currentMonth]);

  return {
    events: calendarEvents,
    currentMonth,
    selectedDate,
    isLoading,
    error,
    setSelectedDate,
    createEvent,
    nextMonth,
    prevMonth,
    goToToday,
    getEventsForDate,
    hasEventsOnDate,
    fetchEvents,
  };
}
