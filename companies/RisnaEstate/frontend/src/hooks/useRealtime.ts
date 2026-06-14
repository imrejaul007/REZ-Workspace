/*** RisnaEstate - Real-time Subscriptions via RABTUL Event Bus ***/

import { useEffect, useRef, useState } from 'react';

const EVENT_BUS_URL = process.env.NEXT_PUBLIC_EVENT_BUS_URL || 'wss://event-bus.realtime.app';
const EVENT_BUS_REST = process.env.NEXT_PUBLIC_EVENT_BUS_REST || 'https://events.rez.app';

type EventHandler = (data: unknown) => void;

interface EventSubscription {
  unsubscribe: () => void;
}

type HandlerMap = Map<string, Set<EventHandler>>;

export function useEventBus() {
  const handlers = useRef<HandlerMap>(new Map());

  useEffect(() => {
    // For demo, use polling; production: connect WebSocket here
    // const ws = new WebSocket(EVENT_BUS_URL);
    // ws.onmessage = ({ data }) => {
    //   const { event, payload } = JSON.parse(data);
    //   handlers.current.get(event)?.forEach(h => h(payload));
    // };
    return () => {/* ws.close() */};
  }, []);

  const subscribe = (event: string, handler: EventHandler): EventSubscription => {
    if (!handlers.current.has(event)) handlers.current.set(event, new Set());
    handlers.current.get(event)!.add(handler);
    return { unsubscribe: () => handlers.current.get(event)?.delete(handler) };
  };

  const publish = (event: string, data: unknown) => {
    fetch(`${EVENT_BUS_REST}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, data })
    });
    handlers.current.get(event)?.forEach(h => h(data));
  };

  return { subscribe, publish };
}

// Pre-built subscriptions
export function usePropertyUpdates(onUpdate: (id: string, update: unknown) => void) {
  const { subscribe } = useEventBus();
  useEffect(() => {
    const sub = subscribe('property.updated', (data) => onUpdate((data as {id: string}).id, data));
    return sub.unsubscribe;
  }, [onUpdate]);
}

export function useLeadUpdates(onNewLead: (lead: unknown) => void) {
  const { subscribe } = useEventBus();
  useEffect(() => {
    const sub = subscribe('lead.created', onNewLead);
    return sub.unsubscribe;
  }, [onNewLead]);
}

export function useBookingUpdates(onBooking: (booking: unknown) => void) {
  const { subscribe } = useEventBus();
  useEffect(() => {
    const sub = subscribe('booking.status_changed', onBooking);
    return sub.unsubscribe;
  }, [onBooking]);
}
