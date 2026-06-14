import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { useCalendar } from '../../src/hooks/useCalendar';
import { CalendarEvent } from '../../src/types';
import { format, isToday, isSameDay } from 'date-fns';

const EVENT_COLORS = {
  post: '#6366f1',
  draft: '#f59e0b',
  meeting: '#10b981',
  reminder: '#ec4899',
};

export default function CalendarScreen() {
  const router = useRouter();
  const {
    events,
    currentMonth,
    selectedDate,
    setSelectedDate,
    nextMonth,
    prevMonth,
    getEventsForDate,
    hasEventsOnDate,
  } = useCalendar();

  const selectedEvents = getEventsForDate(selectedDate);

  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};

    events.forEach((event) => {
      marked[event.date] = {
        marked: true,
        dotColor: event.color || EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] || '#6366f1',
      };
    });

    // Mark selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      selected: true,
      selectedColor: '#6366f1',
    };

    return marked;
  }, [events, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const handleEventPress = (event: CalendarEvent) => {
    if (event.postId) {
      router.push(`/post/${event.postId}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Calendar</Text>
        <Text className="text-sm text-gray-500">
          Manage your scheduled posts
        </Text>
      </View>

      <ScrollView className="flex-1">
        {/* Calendar */}
        <View className="bg-white p-4">
          {/* Month Navigation */}
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity
              onPress={prevMonth}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-xl text-gray-600">‹</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </Text>
            <TouchableOpacity
              onPress={nextMonth}
              className="p-2"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-xl text-gray-600">›</Text>
            </TouchableOpacity>
          </View>

          <Calendar
            current={format(currentMonth, 'yyyy-MM-dd')}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            markingType="dot"
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#6b7280',
              selectedDayBackgroundColor: '#6366f1',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#6366f1',
              dayTextColor: '#374151',
              textDisabledColor: '#d1d5db',
              dotColor: '#6366f1',
              arrowColor: '#6366f1',
              monthTextColor: '#374151',
              textDayFontWeight: '400',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '500',
            }}
          />
        </View>

        {/* Legend */}
        <View className="px-4 py-3 bg-white mt-2">
          <View className="flex-row flex-wrap">
            {Object.entries(EVENT_COLORS).map(([type, color]) => (
              <View key={type} className="flex-row items-center mr-4 mb-2">
                <View
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: color }}
                />
                <Text className="text-xs text-gray-600 capitalize">{type}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Selected Date Events */}
        <View className="p-4 mt-2">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-gray-900">
              {isToday(new Date(selectedDate))
                ? 'Today'
                : format(new Date(selectedDate), 'EEEE, MMM d')}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/create')}
              className="bg-indigo-600 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-sm font-medium">+ Add</Text>
            </TouchableOpacity>
          </View>

          {selectedEvents.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Text className="text-4xl mb-3">📅</Text>
              <Text className="text-gray-600 text-center">
                No posts scheduled for this day
              </Text>
            </View>
          ) : (
            selectedEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() => handleEventPress(event)}
                className="bg-white rounded-2xl p-4 mb-3 shadow-sm border-l-4"
                style={{
                  borderLeftColor:
                    event.color ||
                    EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] ||
                    '#6366f1',
                }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <View
                    className="px-2 py-1 rounded-full"
                    style={{
                      backgroundColor:
                        (event.color ||
                          EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] ||
                          '#6366f1') + '20',
                    }}
                  >
                    <Text
                      className="text-xs font-medium capitalize"
                      style={{
                        color:
                          event.color ||
                          EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] ||
                          '#6366f1',
                      }}
                    >
                      {event.type}
                    </Text>
                  </View>
                  {event.time && (
                    <Text className="text-sm text-gray-500">{event.time}</Text>
                  )}
                </View>
                <Text className="text-base font-medium text-gray-900 mb-1">
                  {event.title}
                </Text>
                {event.description && (
                  <Text className="text-sm text-gray-500" numberOfLines={2}>
                    {event.description}
                  </Text>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Upcoming Posts */}
        <View className="p-4 pt-0">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Upcoming This Week
          </Text>
          {events
            .filter((e) => {
              const eventDate = new Date(e.date);
              const now = new Date();
              const weekEnd = new Date();
              weekEnd.setDate(now.getDate() + 7);
              return eventDate >= now && eventDate <= weekEnd && e.postId;
            })
            .slice(0, 5)
            .map((event) => (
              <View
                key={event.id}
                className="bg-white rounded-xl p-3 mb-2 flex-row items-center"
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{
                    backgroundColor:
                      (event.color ||
                        EVENT_COLORS[event.type as keyof typeof EVENT_COLORS] ||
                        '#6366f1') + '20',
                  }}
                >
                  <Text className="text-lg font-bold text-gray-600">
                    {format(new Date(event.date), 'd')}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>
                    {event.title}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {event.time || format(new Date(event.date), 'h:mm a')}
                  </Text>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
