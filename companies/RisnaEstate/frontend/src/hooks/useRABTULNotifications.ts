/*** RisnaEstate - RABTUL Notifications Integration ***/

import { useEffect, useState } from 'react';

const NOTIFICATIONS_URL = process.env.NEXT_PUBLIC_NOTIFICATIONS_URL || 'https://notifications-service.onrender.com';

interface NotificationPayload {
  userId: string;
  type: 'push' | 'sms' | 'email' | 'whatsapp';
  title?: string;
  message: string;
  data?: Record<string, unknown>;
  scheduledFor?: string;
}

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const interval = setInterval(async () => {
      try {
        const data = await fetch(`${NOTIFICATIONS_URL}/api/notifications/user/${userId}?limit=20`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('risna_token')}` }
        }).then(r => r.json());
        if (data?.data) setNotifications(data.data);
        setUnreadCount(data?.data?.filter((n: Notification) => !n.read).length || 0);
      } catch (e) {
        console.error('Notifications fetch failed', e);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  const send = async (payload: NotificationPayload) => {
    const res = await fetch(`${NOTIFICATIONS_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('risna_token')}` },
      body: JSON.stringify(payload)
    });
    return res.json();
  };

  const markRead = async (id: string) => {
    await fetch(`${NOTIFICATIONS_URL}/api/notifications/${id}/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${localStorage.getItem('risna_token')}` } });
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await fetch(`${NOTIFICATIONS_URL}/api/notifications/user/${userId}/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${localStorage.getItem('risna_token')}` } });
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markRead, markAllRead, send };
}

export async function sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>) {
  return fetch(`${NOTIFICATIONS_URL}/api/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type: 'push', title, message: body, data })
  }).then(r => r.json());
}

export async function sendWhatsApp(phone: string, message: string) {
  return fetch(`${NOTIFICATIONS_URL}/api/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: phone, type: 'whatsapp', message })
  }).then(r => r.json());
}

export async function scheduleNotification(userId: string, title: string, body: string, scheduledFor: string) {
  return fetch(`${NOTIFICATIONS_URL}/api/notifications/schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, title, message: body, scheduledFor })
  }).then(r => r.json());
}
