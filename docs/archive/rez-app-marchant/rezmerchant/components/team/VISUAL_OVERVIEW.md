# Team Components - Visual Overview

## Component Gallery

### 1. TeamMemberCard
```
┌──────────────────────────────────────────────┐
│  ╭───╮                                       │
│  │ JD │  John Doe              [Admin 🛡️]   │
│  ╰───╯  john@example.com                    │
│    ●    [Active ●] Last seen 2h ago         │
│                                              │
│  ┌─────────┐ ┌─────────────┐                │
│  │ ✏️ Edit │ │ 🗑️ Remove   │                │
│  └─────────┘ └─────────────┘                │
└──────────────────────────────────────────────┘
```

### 2. InvitationForm
```
┌──────────────────────────────────────────────┐
│  Name *                                      │
│  ┌─────────────────────────────────────┐    │
│  │ Enter team member's full name       │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  Email *                                     │
│  ┌─────────────────────────────────────┐    │
│  │ Enter email address                 │    │
│  └─────────────────────────────────────┘    │
│  An invitation will be sent to this email   │
│                                              │
│  Role *                                      │
│  ┌─────────────────────────────────────┐    │
│  │ [Staff 👤] Staff                  ▼ │    │
│  └─────────────────────────────────────┘    │
│                                              │
│  ┌─────────────────────────────────────┐    │
│  │      📧 Send Invitation             │    │
│  └─────────────────────────────────────┘    │
└──────────────────────────────────────────────┘
```

### 3. RoleSelector Modal
```
┌──────────────────────────────────────────────┐
│  Select Role                          ✕      │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ [🛡️ Admin] Admin            3/65 ✓   │   │
│  │ Full access to manage store, team,   │   │
│  │ and settings                          │   │
│  │ ─────────────────────────────────    │   │
│  │ 🔑 65 permissions                     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ [💼 Manager] Manager          2/45    │   │
│  │ Manage products, orders, and          │   │
│  │ customer interactions                 │   │
│  │ ─────────────────────────────────    │   │
│  │ 🔑 45 permissions                     │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ [👤 Staff] Staff              1/20    │   │
│  │ View and update orders, limited       │   │
│  │ product access                        │   │
│  │ ─────────────────────────────────    │   │
│  │ 🔑 20 permissions                     │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### 4. PermissionMatrix
```
┌──────────────────────────────────────────────┐
│  [💼 Manager] Manager     45 permissions     │
│                                              │
│  🔍 Search permissions...               ✕   │
├──────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐   │
│  │ 📦 Products            6/6        ▲  │   │
│  ├──────────────────────────────────────┤   │
│  │  ┌────────────────────────────────┐ │   │
│  │  │ 📦 Products: View              │ │   │
│  │  │ View all products in catalog ☑️ │ │   │
│  │  └────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────┐ │   │
│  │  │ 📦 Products: Create            │ │   │
│  │  │ Add new products to store    ☑️ │ │   │
│  │  └────────────────────────────────┘ │   │
│  │  ┌────────────────────────────────┐ │   │
│  │  │ 📦 Products: Edit              │ │   │
│  │  │ Modify product details       ☑️ │ │   │
│  │  └────────────────────────────────┘ │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ 🧾 Orders              5/6        ▼  │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ 👥 Team                0/5        ▼  │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### 5. Role Badges
```
[👑 Owner]   [🛡️ Admin]   [💼 Manager]   [👤 Staff]
  Purple        Blue         Green         Gray
```

### 6. Status Badges
```
[● Active]   [● Inactive]   [● Suspended]   [● Pending]
   Green         Gray           Red           Yellow
```

### 7. Invitation Badges
```
[⏰ Pending]          [✓ Accepted]

[⚠️ Expired]  [📧 Resend]
```

### 8. Permission Toggle
```
┌────────────────────────────────────────────┐
│  ┌──┐  Products: Edit                  ☑️  │
│  │📦│  Modify existing product details      │
│  └──┘                                       │
└────────────────────────────────────────────┘
```

### 9. Activity Timeline
```
┌──────────────────────────────────────────────┐
│  ●━━  📧 Invitation Sent         2d ago     │
│  │    by John Doe • charlie@example.com     │
│  │    ┌─────────────────────────────────┐  │
│  │    │ Role: Manager                    │  │
│  │    └─────────────────────────────────┘  │
│  │                                          │
│  ●━━  🔄 Role Changed            7d ago     │
│  │    by John Doe • jane@example.com       │
│  │    ┌─────────────────────────────────┐  │
│  │    │ Old Role: Staff                  │  │
│  │    │ New Role: Manager                │  │
│  │    └─────────────────────────────────┘  │
│  │                                          │
│  ●━━  ✓ Invitation Accepted      4d ago     │
│  │    by Bob Johnson • bob@example.com     │
│  │    ┌─────────────────────────────────┐  │
│  │    │ Role: Staff                      │  │
│  │    └─────────────────────────────────┘  │
│  │                                          │
│  ●    🔄 Status Changed           1d ago     │
│       by John Doe • alice@example.com      │
│       ┌─────────────────────────────────┐  │
│       │ Old Status: Active               │  │
│       │ New Status: Inactive             │  │
│       └─────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

## Color Palette

### Role Colors
```
┌─────────┬──────────┬──────────────┐
│ Role    │ Color    │ Hex          │
├─────────┼──────────┼──────────────┤
│ Owner   │ Purple   │ #7C3AED      │
│ Admin   │ Blue     │ #3B82F6      │
│ Manager │ Green    │ #10B981      │
│ Staff   │ Gray     │ #6B7280      │
└─────────┴──────────┴──────────────┘
```

### Status Colors
```
┌───────────┬──────────┬──────────────┐
│ Status    │ Color    │ Hex          │
├───────────┼──────────┼──────────────┤
│ Active    │ Green    │ #10B981      │
│ Inactive  │ Gray     │ #6B7280      │
│ Suspended │ Red      │ #EF4444      │
│ Pending   │ Yellow   │ #F59E0B      │
└───────────┴──────────┴──────────────┘
```

### Action Colors
```
┌───────────────┬──────────┬──────────────┐
│ Action        │ Color    │ Hex          │
├───────────────┼──────────┼──────────────┤
│ Invite        │ Blue     │ #3B82F6      │
│ Accept        │ Green    │ #10B981      │
│ Role Change   │ Orange   │ #F59E0B      │
│ Status Change │ Indigo   │ #6366F1      │
│ Remove        │ Red      │ #EF4444      │
│ Resend        │ Purple   │ #8B5CF6      │
└───────────────┴──────────┴──────────────┘
```

## Component Sizes

### Badges
```
Small:   [Admin]     12px padding, 14px text
Medium:  [ Admin ]   16px padding, 16px text
Large:   [  Admin  ] 20px padding, 18px text
```

### Avatars
```
Small:   32x32px  (14px text)
Medium:  40x40px  (16px text)
Large:   48x48px  (18px text)
```

### Touch Targets
```
Minimum: 44x44px (iOS/Android guidelines)
Buttons: 48px height recommended
Cards:   Full width, variable height
```

## Layout Patterns

### List View
```
┌────────────────────────────────┐
│ [Search: 🔍 Filter team...]    │
├────────────────────────────────┤
│ [TeamMemberCard 1]             │
│ [TeamMemberCard 2]             │
│ [TeamMemberCard 3]             │
│ [TeamMemberCard 4]             │
│ [TeamMemberCard 5]             │
│ ...                            │
└────────────────────────────────┘
```

### Detail View
```
┌────────────────────────────────┐
│ ← Back                         │
├────────────────────────────────┤
│  ╭───────╮                     │
│  │  JD   │  John Doe           │
│  ╰───────╯  john@example.com   │
│              [Admin] [Active]  │
├────────────────────────────────┤
│ Last Login: 2 hours ago        │
│ Invited: 30 days ago           │
│ Invited By: Owner              │
├────────────────────────────────┤
│ Permissions (65)               │
│ [PermissionMatrix]             │
├────────────────────────────────┤
│ Recent Activity                │
│ [ActivityTimeline]             │
└────────────────────────────────┘
```

### Invite Modal
```
┌────────────────────────────────┐
│ Invite Team Member        ✕    │
├────────────────────────────────┤
│                                │
│ [InvitationForm]               │
│                                │
│                                │
│ ┌────────────────────────────┐ │
│ │  Cancel   Send Invitation  │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

## Icon Reference

### Role Icons
```
Owner:   👑 crown
Admin:   🛡️ shield-checkmark
Manager: 💼 briefcase
Staff:   👤 person
```

### Category Icons
```
Products:      📦 cube-outline
Orders:        🧾 receipt-outline
Team:          👥 people-outline
Analytics:     📊 stats-chart-outline
Settings:      ⚙️ settings-outline
Billing:       💳 card-outline
Customers:     👤 person-outline
Promotions:    🏷️ pricetag-outline
Reviews:       ⭐ star-outline
Notifications: 🔔 notifications-outline
Reports:       📄 document-text-outline
Inventory:     📋 list-outline
Categories:    📱 apps-outline
Profile:       👤 person-circle-outline
Logs:          ⏰ time-outline
API:           </> code-slash-outline
```

### Action Icons
```
Invite:        📧 mail-outline
Accept:        ✓ checkmark-circle-outline
Role Change:   🔄 swap-horizontal-outline
Status Change: 🔘 toggle-outline
Remove:        🗑️ trash-outline
Resend:        🔄 reload-outline
```

## Responsive Behavior

### Mobile (< 768px)
- Full width cards
- Stacked buttons
- Single column layout
- Collapsed categories by default

### Tablet (768px - 1024px)
- 2 column grid for cards
- Side-by-side buttons
- Expanded modal width

### Desktop (> 1024px)
- 3 column grid for cards
- Full width permission matrix
- Split view for details

## Interaction States

### Buttons
```
Default:  [Button]
Hover:    [Button]  (opacity 0.8)
Pressed:  [Button]  (scale 0.98)
Disabled: [Button]  (opacity 0.6)
```

### Cards
```
Default:  Card with shadow
Hover:    Slightly elevated
Pressed:  Scale 0.99
Selected: Border highlight
```

### Toggles
```
Off: ⚪━━━  (gray)
On:  ━━━⚪  (purple)
```

## Animation Timings

```
Fast:   150ms - Badge transitions
Normal: 250ms - Card interactions
Slow:   350ms - Modal slides
Smooth: 500ms - Timeline scrolling
```

---

**Component Tree Structure**
```
TeamMemberCard
├── Avatar (with status indicator)
├── RoleBadge
├── MemberStatusBadge
└── Action Buttons

InvitationForm
├── Text Inputs (name, email)
├── RoleSelector
└── Submit Button

RoleSelector
└── Modal
    └── Role Options
        ├── RoleBadge
        └── Permission Count

PermissionMatrix
├── Role Info
│   └── RoleBadge
├── Search Input
└── Category Cards
    ├── Category Header
    └── PermissionToggle List

ActivityTimeline
└── Activity Items
    ├── Icon Circle
    ├── Timeline Line
    └── Activity Details
```

---

This visual overview provides a comprehensive look at all team management components, their appearance, colors, and layout patterns.
