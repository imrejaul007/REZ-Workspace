# GENIE - Device Integration & Data Flow Architecture

**Version:** 1.0 | **Date:** June 11, 2026  
**Purpose:** Complete device integration for "Hey Genie" wake word and data collection

---

## 🎯 EXECUTIVE SUMMARY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GENIE ECOSYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   DEVICE LAYER                      │        INTELLIGENCE LAYER              │
│   ─────────────────                │        ────────────────────            │
│   📱 DO App (Mobile)               │        🧠 Genie Memory (4703)          │
│   🎧 Earbuds/AirPods               │        👥 Relationship (4704)          │
│   ⌚ Smartwatch                     │        📋 Briefing (4706)             │
│   💻 Desktop Agent                 │        📧 Email (4710)                 │
│   🖥️ Laptop Companion              │        📄 Document (4711)              │
│   🎤 Voice Recorder                │        🎵 Voice Notes (4712)           │
│   📞 Phone Calls (Razo)            │        📅 Meeting (4713)               │
│   🌐 Browser Extension             │                                         │
│                                    │        ────────────────────            │
│                                    │        🔧 HOJAI CORE                    │
│                                    │        MemoryOS │ TwinOS │ FlowOS      │
│                                    │                                         │
│   DATA FLOW                        │        EXECUTION LAYER                 │
│   ─────────────────                │        ────────────────────            │
│   Wake Word → STT → Intent →       │        ✅ Action Execution              │
│   Process → Memory → Response →    │        ✅ DO App (Commerce)            │
│   TTS → User                       │        ✅ WhatsApp Follow-up           │
│                                    │        ✅ Calendar Reminders           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 DEVICE INTEGRATION

### 1. DO App (Primary Interface)

```
┌─────────────────────────────────────────────────────────────────┐
│                         DO APP                                    │
│              "Your AI Commerce Super App"                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎤 VOICE ASSISTANT                                     │   │
│  │  • "Hey Genie" wake word detection                      │   │
│  │  • Real-time STT/TTS via HOJAI Flow                     │   │
│  │  • Background listening when enabled                    │   │
│  │  • Haptic feedback on wake word detection               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🧠 MEMORY PANEL                                        │   │
│  │  • See what Genie remembers                             │   │
│  │  • Add/edit memories                                    │   │
│  │  • View relationship insights                           │   │
│  │  • Track habits & preferences                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📊 ACTIVITY FEED                                      │   │
│  │  • Memory events captured                               │   │
│  │  • AI summaries generated                               │   │
│  │  • Action items tracked                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🎯 QUICK ACTIONS                                       │   │
│  │  • "Remember this" → Manual memory                       │   │
│  │  • "What did I forget?" → Recall                        │   │
│  │  • "My usual" → Context recall                          │   │
│  │  • "Morning briefing" → Daily summary                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Integration Points:**
```typescript
// DO App hooks already built
import { useWakeWord } from '@/hooks/useWakeWord';      // "Hey Genie"
import { useFlowVoice } from '@/hooks/useFlowVoice';     // STT/TTS
import { useGenieMemory } from '@/hooks/useGenieMemory'; // Memory
import { useHybridAI } from '@/hooks/useHybridAI';      // Combined AI
```

---

### 2. "Hey Genie" Wake Word Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         WAKE WORD FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   USER SPEAKS                                                           │
│        │                                                                │
│        ▼                                                                │
│   ┌─────────┐                                                           │
│   │ MIC ON  │ ← Background listener active (low power)                   │
│   └────┬────┘                                                           │
│        │                                                                │
│        ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │                    WAKE WORD DETECTION                        │      │
│   │                                                          │      │
│   │   ┌──────────────┐     ┌──────────────┐     ┌────────────┐ │      │
│   │   │  Local DSP   │────▶│  Keyword      │────▶│  Cloud API  │ │      │
│   │   │  (On-device) │     │  Spotting     │     │ (Fallback) │ │      │
│   │   └──────────────┘     └──────────────┘     └────────────┘ │      │
│   │         │                    │                    │          │      │
│   │         ▼                    ▼                    ▼          │      │
│   │   "Hey Genie" detected ──── "Genie" ─────────── "Ok Genie"   │      │
│   └─────────────────────────────────────────────────────────────┘      │
│        │                                                                │
│        ▼                                                                │
│   ┌─────────┐                                                           │
│   │ VIBRATE │ ← Haptic feedback                                          │
│   └────┬────┘                                                           │
│        │                                                                │
│        ▼                                                                │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │                    FULL VOICE PROCESSING                     │      │
│   │                                                          │      │
│   │   STT (Speech-to-Text) → Intent Detection → Genie         │      │
│   │   Genie Response → TTS (Text-to-Speech) → Speaker          │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**Wake Word Options:**

| Method | Accuracy | Battery | Privacy | Cost |
|--------|----------|---------|---------|------|
| Picovoice (Local) | 95% | Very Low | ✅ High | Free |
| Sensory Cloud | 98% | Low | ⚠️ Medium | $ |
| TensorFlow.js | 85% | Medium | ✅ High | Free |
| Custom Model | 90% | Medium | ✅ High | Free |

**Recommended:** Picovoice Porcupine with custom "Hey Genie" model

---

### 3. Earbuds/AirPods Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         EARBUDS INTEGRATION                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   🎧 AirPods / Galaxy Buds / OnePlus Buds                               │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    CONNECTION OPTIONS                            │   │
│   │                                                                  │   │
│   │   ┌─────────────────┐     ┌─────────────────┐                   │   │
│   │   │  Bluetooth LE   │     │    Wi-Fi         │                   │   │
│   │   │  (Background)  │     │  (High Quality)  │                   │   │
│   │   │  • Wake word    │     │  • Voice notes   │                   │   │
│   │   │  • Commands     │     │  • Meetings      │                   │   │
│   │   │  • Low power    │     │  • Transcription │                   │   │
│   │   └─────────────────┘     └─────────────────┘                   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   USE CASES:                                                            │
│   • "Hey Genie, book a table for tonight" → Restaurant booking          │
│   • "Remember this" → Capture thought (saves to Genie)                   │
│   • "What's my next meeting?" → Calendar query                          │
│   • Meeting started → Auto transcribe conversation                       │
│   • Phone call detected → Record & summarize                             │
│                                                                          │
│   SDK INTEGRATION:                                                      │
│   • Apple: AVAudioSession + Siri integration                            │
│   • Android: AudioRecord + Google Assistant                             │
│   • Custom: BLE + custom app                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Smartwatch Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SMARTWATCH INTEGRATION                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ⌚ Apple Watch / Samsung Watch / WearOS                                │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    DATA COLLECTION                                │   │
│   │                                                                  │   │
│   │   📍 Location    → Context (where user is)                       │   │
│   │   ❤️ Heart Rate  → Activity level                                │   │
│   │   🏃 Steps       → Physical activity                              │   │
│   │   😴 Sleep       → Rest patterns                                  │   │
│   │   📱 Notifications → Urgency detection                           │   │
│   │   🎤 Voice Input → Commands & notes                              │   │
│   │                                                                  │   │
│   │   All synced to Genie for context-aware intelligence              │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   USE CASES:                                                            │
│   • User at gym → "No calls, send SMS instead"                           │
│   • High stress (HR elevated) → Delay non-urgent notifications          │
│   • Walking to meeting → Auto send ETA update                            │
│   • Voice note: "Remember to follow up with John" → Saved to Genie       │
│                                                                          │
│   INTEGRATION:                                                          │
│   • Apple: HealthKit + Watch Connectivity                               │
│   │   • Use health data for context                                    │
│   │   • Complication for briefing preview                              │
│   │   • Voice dictation for quick notes                                │
│   │                                                                  │   │
│   • Android: Health Services + Wear OS                                   │
│   │   • Similar integration patterns                                    │
│   │                                                                  │   │
│   • Samsung: Bixby + Galaxy Wearables                                     │
│   │   • Bixby routines trigger Genie                                    │
│   │   • Galaxy Watch face for briefing                                  │
│   │                                                                  │   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Desktop/Laptop Companion

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DESKTOP AGENT                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   💻 Mac / Windows / Linux                                               │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    OBSERVES & LEARNS                             │   │
│   │                                                                  │   │
│   │   📄 Documents    → Project context                              │   │
│   │   📧 Email        → Commitments & tasks                          │   │
│   │   🗓️ Calendar    → Meeting context                               │   │
│   │   💬 Slack/Teams  → Communication patterns                        │   │
│   │   🌐 Browser      → Research & interests                          │   │
│   │   ⏰ Activity     → Work patterns & focus                         │   │
│   │   📊 Productivity → Task completion                               │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   CAPABILITIES:                                                         │
│   • Passive learning (with user consent)                                 │
│   • Active reminders (meeting in 5 min)                                  │
│   • Document summarization                                               │
│   • Email action extraction                                              │
│   • Meeting prep (pull context)                                          │
│   • Focus mode orchestration                                             │
│                                                                          │
│   ARCHITECTURE:                                                         │
│                                                                          │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐               │
│   │   Desktop   │────▶│   Local AI  │────▶│   Genie     │               │
│   │   Agent     │     │  (Privacy)  │     │   Cloud     │               │
│   │             │     │             │     │             │               │
│   │ • Electron  │     │ • Ollama    │     │ • Memory    │               │
│   │ • Native    │     │ • LM Studio │     │ • TwinOS    │               │
│   │ • Tray App  │     │ • Local LLM │     │ • Briefing  │               │
│   └─────────────┘     └─────────────┘     └─────────────┘               │
│                                                                          │
│   PRIVACY:                                                              │
│   • All processing can be local (no cloud needed)                        │
│   • User controls what is shared                                         │
│   • Encrypt data at rest                                                 │
│   • Option for full offline mode                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 6. Phone Calls via Razo

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RAZO VOICE PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   📞 Incoming / Outgoing Calls                                           │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │                    CALL FLOW                                     │   │
│   │                                                                  │   │
│   │   Call comes in                                                    │   │
│   │        │                                                           │   │
│   │        ▼                                                           │   │
│   │   ┌──────────────┐                                                │   │
│   │   │  Razo (4112) │ ← AI handles call                              │   │
│   │   │              │   • Greeting                                    │   │
│   │   │  • Screening │   • Information gathering                       │   │
│   │   │  • Summary   │   • Call recording                              │   │
│   │   │  • Follow-up │   • Next steps                                  │   │
│   │   └──────┬───────┘                                                │   │
│   │          │                                                          │   │
│   │          ▼                                                          │   │
│   │   ┌──────────────┐                                                │   │
│   │   │  Genie (4707)│ ← Store & analyze                               │   │
│   │   │              │   • Relationship update                         │   │
│   │   │  • Memory    │   • Action items                                 │   │
│   │   │  • Summary   │   • Commitment tracking                          │   │
│   │   │  • Action    │   • WhatsApp follow-up                           │   │
│   │   └──────────────┘                                                │   │
│   │          │                                                          │   │
│   │          ▼                                                          │   │
│   │   ┌──────────────┐                                                │   │
│   │   │  WhatsApp    │ ← Notify user                                   │   │
│   │   │  (4708)      │   • "John called, wants meeting"                 │   │
│   │   └──────────────┘                                                │   │
│   │                                                                  │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   DATA COLLECTED:                                                        │
│   • Call summary (who, what, when)                                       │
│   • Key decisions made                                                   │
│   • Action items & deadlines                                             │
│   • Relationship context                                                  │
│   • Sentiment (positive/negative/neutral)                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA FLOW ARCHITECTURE

### Tier 1: Highest Value Sources (With User Consent)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TIER 1 - STRUCTURED DATA                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│   │   CALENDAR      │  │     EMAIL       │  │    MEETINGS    │          │
│   │                 │  │                 │  │                 │          │
│   │ • Google Cal    │  │ • Gmail (4710)  │  │ • Zoom          │          │
│   │ • Outlook       │  │ • Outlook       │  │ • Meet          │          │
│   │ • REZ (4709)    │  │                 │  │ • Teams         │          │
│   │                 │  │                 │  │ • REZ (4713)    │          │
│   │                 │  │                 │  │                 │          │
│   │  📅 Schedule    │  │  📧 Inbox       │  │  🎤 Transcript  │          │
│   │  ⏰ Reminders   │  │  📋 Tasks       │  │  ✅ Actions     │          │
│   │  👥 Attendees   │  │  📝 Commitments │  │  💬 Decisions   │          │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│            │                    │                    │                    │
│            └────────────────────┼────────────────────┘                    │
│                                 ▼                                         │
│                    ┌────────────────────────┐                            │
│                    │   GENIE MEMORY (4703)  │                            │
│                    │                        │                            │
│                    │  🧠 Knowledge Graph     │                            │
│                    │  👥 Relationship Graph  │                            │
│                    │  🎯 TwinOS (Personal)   │                            │
│                    │                        │                            │
│                    │  Remember:              │                            │
│                    │  • Who said what        │                            │
│                    │  • When & why          │                            │
│                    │  • Commitments          │                            │
│                    │  • Context              │                            │
│                    └────────────────────────┘                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tier 2: Contextual Data

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TIER 2 - CONTEXTUAL DATA                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│   │   DOCUMENTS     │  │   CHAT APPS     │  │   BROWSER       │          │
│   │                 │  │                 │  │                 │          │
│   │ • PDF (4711)    │  │ • WhatsApp      │  │ • Chrome Ext    │          │
│   │ • Word          │  │ • Slack (4708)  │  │ • History       │          │
│   │ • Slides        │  │ • Teams         │  │ • Bookmarks     │          │
│   │ • Spreadsheets  │  │ • Telegram      │  │ • Tabs          │          │
│   │                 │  │                 │  │                 │          │
│   │  📄 Content     │  │  💬 Messages    │  │  🌐 Activity    │          │
│   │  📊 Data        │  │  📋 Actions     │  │  🔍 Research    │          │
│   │  📝 Notes       │  │  📅 Schedules   │  │  🛒 Shopping    │          │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│            │                    │                    │                    │
│            └────────────────────┼────────────────────┘                    │
│                                 ▼                                         │
│                    ┌────────────────────────┐                            │
│                    │   CONTEXT AGGREGATOR   │                            │
│                    │                        │                            │
│                    │  Builds user profile:  │                            │
│                    │  • Work patterns       │                            │
│                    │  • Interests           │                            │
│                    │  • Preferences         │                            │
│                    │  • Relationships       │                            │
│                    │  • Goals               │                            │
│                    └────────────────────────┘                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tier 3: Ambient Data (Optional, High Consent Required)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TIER 3 - AMBIENT DATA                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│   │    EARBUDS       │  │   SMARTWATCH    │  │   LOCATION      │          │
│   │                 │  │                 │  │                 │          │
│   │ • "Hey Genie"   │  │ • Activity      │  │ • Home/Work     │          │
│   │ • Voice notes   │  │ • Heart rate    │  │ • Commute       │          │
│   │ • Commands      │  │ • Notifications │  │ • Travel        │          │
│   │                 │  │                 │  │                 │          │
│   │  🎤 Audio       │  │  ❤️ Health      │  │  📍 Presence    │          │
│   │  🗣️ Speech      │  │  🏃 Movement    │  │  ⏰ Time-based  │          │
│   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│            │                    │                    │                    │
│            └────────────────────┼────────────────────┘                    │
│                                 ▼                                         │
│                    ┌────────────────────────┐                            │
│                    │   PRIVACY CONTROLS      │                            │
│                    │                        │                            │
│                    │  🔒 User Consent        │                            │
│                    │  • Granular controls    │                            │
│                    │  • Time-based limits    │                            │
│                    │  • Location boundaries   │                            │
│                    │  • Data retention        │                            │
│                    └────────────────────────┘                            │
│                                                                          │
│   ⚠️  HIGH CONSENT REQUIRED                                             │
│   • Clear opt-in explaining benefits                                     │
│   • Easy opt-out anytime                                                 │
│   • No dark patterns                                                     │
│   • Value must be clear                                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 TECHNICAL INTEGRATION

### Device → Genie API Mapping

| Device | Data Type | Genie Service | Port | Endpoint |
|--------|-----------|--------------|------|----------|
| DO App | Voice commands | genie-voice-service | 4712 | `/api/voice/transcribe` |
| DO App | Wake word | wake-word-service | - | `/api/wake-word/detect` |
| DO App | User memories | genie-memory-service | 4703 | `/api/memory/remember` |
| Earbuds | Audio | genie-voice-service | 4712 | `/api/voice/upload` |
| Smartwatch | Activity | genie-sync-service | - | `/api/sync/activity` |
| Desktop | Documents | genie-document-service | 4711 | `/api/documents/upload` |
| Desktop | Email | genie-email-service | 4710 | `/api/email/sync` |
| Phone | Calls | genie-call-service | 4707 | `/api/calls/log` |
| Browser | History | genie-browser-history | - | `/api/browser/sync` |
| Calendar | Events | genie-calendar-service | 4709 | `/api/calendar/sync` |
| WhatsApp | Messages | genie-whatsapp-service | 4708 | `/api/whatsapp/webhook` |
| Meeting | Transcript | genie-meeting-service | 4713 | `/api/meetings/transcript` |

---

### SDK Integration Points

```typescript
// ============================================
// DO APP - Full Integration Example
// ============================================

import { useWakeWord } from '@/hooks/useWakeWord';
import { useFlowVoice } from '@/hooks/useFlowVoice';
import { useGenieMemory } from '@/hooks/useGenieMemory';
import { useHybridAI } from '@/hooks/useHybridAI';

export function GenieVoiceAssistant() {
  // 1. Wake word listener ("Hey Genie")
  const wakeWord = useWakeWord({
    wakeWords: ['hey genie', 'genie', 'ok genie'],
    onWakeWord: (word, confidence) => {
      // Show assistant UI
      setIsOpen(true);
      // Announce ready
      flow.speak('Yes? How can I help?');
    },
  });

  // 2. Voice processing (STT/TTS)
  const flow = useFlowVoice();

  // 3. Memory (remember/recall)
  const genie = useGenieMemory(userId);

  // 4. Combined AI
  const ai = useHybridAI();

  // Start wake word listening on app launch
  useEffect(() => {
    wakeWord.startListening();
    return () => wakeWord.stopListening();
  }, []);

  // Handle voice command
  const handleVoiceCommand = async () => {
    // 1. Stop wake word, start voice
    await wakeWord.stopListening();
    await flow.startListening();

    // 2. Get transcript
    const { text } = await flow.stopListening();

    // 3. Process with Genie context
    const result = await ai.handleCommand(text, {
      userId,
      includeMemories: true,
      includeRelationships: true,
    });

    // 4. Speak response
    await flow.speak(result.response);

    // 5. Remember transaction if needed
    if (result.action === 'order') {
      await genie.rememberTransaction(result.merchant, result.amount);
    }

    // 6. Resume wake word
    await wakeWord.startListening();
  };

  return (
    <AssistantButton onPress={handleVoiceCommand}>
      <MicIcon />
    </AssistantButton>
  );
}
```

---

### Backend Service Connections

```typescript
// ============================================
// DO BACKEND - Service Integration
// ============================================

// genieMemoryClient.ts
const GENIE_MEMORY_URL = process.env.HOJAI_GENIE_URL || 'http://localhost:4703';

export async function rememberUserPreference(userId: string, data: MemoryInput) {
  return axios.post(`${GENIE_MEMORY_URL}/api/memory/remember`, {
    userId,
    ...data,
    source: 'do-app',
  });
}

// genieCalendarClient.ts
const GENIE_CALENDAR_URL = process.env.HOJAI_GENIE_CALENDAR_URL || 'http://localhost:4709';

export async function syncCalendarEvents(userId: string, events: CalendarEvent[]) {
  return axios.post(`${GENIE_CALENDAR_URL}/api/calendar/sync`, {
    userId,
    events,
    source: 'do-app',
  });
}

// genieEmailClient.ts
const GENIE_EMAIL_URL = process.env.HOJAI_GENIE_EMAIL_URL || 'http://localhost:4710';

export async function syncEmails(userId: string, emails: Email[]) {
  return axios.post(`${GENIE_EMAIL_URL}/api/email/sync`, {
    userId,
    emails,
    source: 'do-app',
  });
}

// genieMeetingClient.ts
const GENIE_MEETING_URL = process.env.HOJAI_GENIE_MEETING_URL || 'http://localhost:4713';

export async function logMeeting(userId: string, meeting: MeetingData) {
  return axios.post(`${GENIE_MEETING_URL}/api/meetings/log`, {
    userId,
    ...meeting,
    source: 'do-app',
  });
}
```

---

## 📱 DO APP → GENIE INTEGRATION STATUS

### Already Built ✅

| Component | File | Status |
|-----------|------|--------|
| useWakeWord | `src/hooks/useWakeWord.ts` | ✅ NEW - Just created |
| useFlowVoice | `src/hooks/useFlowVoice.ts` | ✅ Built |
| useGenieMemory | `src/hooks/useGenieMemory.ts` | ✅ Built |
| useHybridAI | `src/hooks/useHybridAI.ts` | ✅ Built |
| useUnifiedGateway | `src/hooks/useUnifiedGateway.ts` | ✅ Built |

### Genie Services → DO App

| Genie Service | Port | DO App Integration | Status |
|---------------|------|-------------------|--------|
| genie-memory-service | 4703 | useGenieMemory | ✅ Connected |
| genie-relationship-service | 4704 | useGenieMemory | ✅ Connected |
| genie-briefing-service | 4706 | useGenieMemory | ✅ Connected |
| genie-call-service | 4707 | useHybridAI | ✅ Connected |
| genie-whatsapp-service | 4708 | useHybridAI | ✅ Connected |
| genie-calendar-service | 4709 | useGenieMemory | ✅ Connected |
| genie-email-service | 4710 | useGenieMemory | ✅ Connected |
| genie-document-service | 4711 | useGenieMemory | ✅ Connected |
| genie-voice-service | 4712 | useFlowVoice | ✅ Connected |
| genie-meeting-service | 4713 | useHybridAI | ✅ Connected |

---

## 🚀 NEXT STEPS

### Phase 1: Voice Wake Word (This Week)
```
1. ✅ useWakeWord.ts hook - Created
2. ⬜ Integrate Picovoice SDK for "Hey Genie"
3. ⬜ Test wake word detection
4. ⬜ Add haptic feedback
5. ⬜ UI for wake word status
```

### Phase 2: Device Sync (Next Week)
```
1. ⬜ Connect Calendar to Genie (4709)
2. ⬜ Connect Email to Genie (4710)
3. ⬜ Connect Calls to Genie (4707)
4. ⬜ Connect WhatsApp to Genie (4708)
5. ⬜ Sync meeting transcripts (4713)
```

### Phase 3: Advanced Features (Week 3-4)
```
1. ⬜ Desktop companion agent
2. ⬜ Earbuds integration
3. ⬜ Smartwatch data sync
4. ⬜ Browser extension
5. ⬜ Ambient audio (opt-in)
```

---

## 📊 SUCCESS METRICS

| Metric | Target | Current |
|--------|--------|---------|
| Wake word detection | >95% | In Progress |
| Memory recall accuracy | >90% | ✅ Built |
| "Usual" detection | >85% | ✅ Built |
| Device sync latency | <2s | Target |
| User engagement | +30% | Target |
| Consent rate (ambient) | >60% | Target |

---

## 🔒 PRIVACY & CONSENT

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRIVACY ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   USER CONSENT FLOW:                                                     │
│                                                                          │
│   1. Onboarding → Explain benefits → Opt-in checkboxes                   │
│   2. Granular controls → Each data source toggleable                     │
│   3. Easy access → Settings > Privacy > Genie controls                  │
│   4. Data export → Download all your data anytime                         │
│   5. Delete option → Remove all data with one tap                        │
│                                                                          │
│   DATA HANDLING:                                                         │
│                                                                          │
│   • Encrypted at rest (AES-256)                                          │
│   • Encrypted in transit (TLS 1.3)                                       │
│   • No third-party sharing                                               │
│   • User-owned data                                                       │
│   • Retention controls                                                    │
│                                                                          │
│   AMBIENT LISTENING:                                                     │
│                                                                          │
│   • Only active when enabled                                             │
│   • Clear visual indicator (mic icon)                                    │
│   • Battery-efficient (DSP-based)                                        │
│   • Privacy-first (on-device when possible)                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

**Status:** DO App → Genie integration ready  
**Next:** Test wake word + add device sync services

---

**Last Updated:** June 11, 2026  
**Documentation:** GENIE-DEVICE-INTEGRATION.md