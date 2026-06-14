'use client';

import { useState } from 'react';

const announcements = [
  {
    id: '1',
    title: 'Team Outing - June 15th',
    content: 'Annual team outing to Goa. All employees must register by May 30th.',
    type: 'event',
    date: '2 hours ago',
    pinned: true,
  },
  {
    id: '2',
    title: 'New Attendance Policy Update',
    content: 'WFH policy updated. Check HR policies for details.',
    type: 'policy',
    date: '1 day ago',
    pinned: false,
  },
  {
    id: '3',
    title: 'Birthday: Rahul Verma',
    content: 'Happy Birthday Rahul!',
    type: 'celebration',
    date: '2 days ago',
    pinned: false,
  },
];

export default function AnnouncementsPage() {
  const [show, setShow] = useState(false);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Announcements</h1>
        <button
          onClick={() => setShow(true)}
          style={{
            padding: '8px 16px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          + New Announcement
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {announcements.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              borderLeft: `4px solid ${
                item.pinned ? '#10b981' : item.type === 'policy' ? '#3b82f6' : '#f59e0b'
              }`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '20px' }}>
                {item.type === 'event' ? '📅' : item.type === 'policy' ? '📋' : '🎉'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontWeight: '600' }}>{item.title}</h3>
                  {item.pinned && (
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      background: '#dcfce7',
                      color: '#15803d',
                      borderRadius: '12px',
                      fontWeight: '500',
                    }}>
                      Pinned
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
                  {item.date}
                </p>
              </div>
            </div>
            <p style={{ marginLeft: '32px', color: '#4b5563', lineHeight: 1.6 }}>
              {item.content}
            </p>
            <div style={{ marginLeft: '32px', marginTop: '12px', display: 'flex', gap: '12px' }}>
              <button style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                Read More
              </button>
              <button style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', cursor: 'pointer' }}>
                {item.pinned ? 'Unpin' : 'Pin'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
