# DO App Voice Integration Guide

**Date:** June 11, 2026 | **Status:** ✅ READY

---

## Overview

DO App uses Genie Services for voice AI, integrated through HOJAI AI.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DO APP                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    VOICE LAYER                                        │   │
│  │  GenieVoiceAssistant.tsx  │  useGenieVoice.ts  │  genieVoiceService.ts│   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                          │
│                                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    SERVICES LAYER                                       │   │
│  │  useWakeWord.ts  │  useFlowVoice.ts  │  useGenieMemory.ts  │  useHybridAI │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES                                      │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   Genie Voice   │    │   HOJAI AI     │    │   Edge STT     │          │
│  │   (4712)        │    │   (4500-4590)  │    │   (4035)       │          │
│  │                 │    │                 │    │                 │          │
│  │  Voice notes    │    │  Intent        │    │  On-device     │          │
│  │  Transcription  │    │  Processing    │    │  Whisper STT   │          │
│  │  TTS            │    │  Memory        │    │                 │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Install Dependencies

```bash
cd REZ-Consumer/do
npm install
```

### 2. Configure Environment

Create `.env`:
```env
# Genie Services
EXPO_PUBLIC_GENIE_MEMORY_URL=http://localhost:4703
EXPO_PUBLIC_GENIE_VOICE_URL=http://localhost:4712

# HOJAI AI
EXPO_PUBLIC_HOJAI_GATEWAY_URL=http://localhost:4500

# Edge STT
EXPO_PUBLIC_EDGE_STT_URL=http://localhost:4035
```

### 3. Use the Component

```tsx
import { GenieVoiceAssistant } from '@/components/GenieVoiceAssistant';

function App() {
  return (
    <>
      {/* ... your app */}
      <GenieVoiceAssistant userId="user_123" />
    </>
  );
}
```

---

## Components

### GenieVoiceAssistant

Floating voice assistant with modal UI.

```tsx
import { GenieVoiceAssistant } from '@/components/GenieVoiceAssistant';

<GenieVoiceAssistant
  userId="user_123"
  language="en-IN"
  variant="floating"
  onCommand={(result) => {
    console.log('Command:', result.text);
  }}
/>
```

### useGenieVoice Hook

React hook for custom voice implementations.

```tsx
import { useGenieVoice } from '@/hooks/useGenieVoice';

function VoiceInput() {
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    speak,
  } = useGenieVoice({ userId: 'user_123' });

  const handlePress = async () => {
    await startListening();
    // User speaks...
    const audioUri = await stopListening();
    await speak('I heard you!');
  };

  return <Button onPress={handlePress} title="Speak" />;
}
```

---

## Services

### genieVoiceService

Central service for all Genie integrations.

```typescript
import { genieVoiceService } from '@/services/genieVoiceService';

// Process voice command
const result = await genieVoiceService.processVoiceCommand(audioUri, {
  language: 'en-IN',
  context: { userId: 'user_123' },
});

// Remember something
await genieVoiceService.remember('user_123', 'Meeting at 3 PM', 'event');

// Get briefing
const briefing = await genieVoiceService.getBriefing('user_123');
```

---

## Genie Services

| Service | Port | Purpose |
|---------|------|---------|
| **genie-memory-service** | 4703 | Memory storage |
| **genie-relationship-service** | 4704 | Relationships |
| **genie-briefing-service** | 4706 | Daily briefings |
| **genie-call-service** | 4707 | Call handling |
| **genie-calendar-service** | 4709 | Calendar sync |
| **genie-email-service** | 4710 | Email sync |
| **genie-voice-service** | 4712 | Voice notes |
| **genie-meeting-service** | 4713 | Meeting notes |

---

## HOJAI AI Integration

| Service | Port | Purpose |
|---------|------|---------|
| **HOJAI Gateway** | 4500 | API Gateway |
| **HOJAI Memory** | 4520 | Vector memory |
| **HOJAI Agents** | 4550 | AI agents |
| **Edge STT** | 4035 | On-device Whisper |

---

## Architecture Flow

```
1. User taps mic button
         │
         ▼
2. startListening() → expo-av records audio
         │
         ▼
3. User speaks
         │
         ▼
4. stopListening() → Returns audio URI
         │
         ▼
5. processVoiceCommand(audioUri)
         │
         ├──► Edge STT (4035) → Transcribe (fast, private)
         │         OR
         └──► Cloud STT (4033) → Transcribe (fallback)
         │
         ▼
6. Transcribe → Get text
         │
         ▼
7. HOJAI AI Intent Processing (4500)
         │
         ▼
8. Genie Memory Context (4703)
         │
         ▼
9. Execute Action
         │
         ▼
10. speak() → TTS Response
```

---

## Testing

### Start Services

```bash
# Edge STT
cd hojai-edge-stt && npm run dev

# Genie Services
cd genie-voice-service && npm run dev

# HOJAI AI
cd hojai-ai && npm run dev
```

### Test Voice Flow

```bash
# Health check
curl http://localhost:4035/health

# Test transcription
curl -X POST http://localhost:4035/api/stt \
  -F "audio=@test.wav" \
  -F "language=en"
```

---

## Environment Variables

```env
# Genie Services
EXPO_PUBLIC_GENIE_MEMORY_URL=http://localhost:4703
EXPO_PUBLIC_GENIE_RELATIONSHIP_URL=http://localhost:4704
EXPO_PUBLIC_GENIE_BRIEFING_URL=http://localhost:4706
EXPO_PUBLIC_GENIE_CALL_URL=http://localhost:4707
EXPO_PUBLIC_GENIE_CALENDAR_URL=http://localhost:4709
EXPO_PUBLIC_GENIE_EMAIL_URL=http://localhost:4710
EXPO_PUBLIC_GENIE_VOICE_URL=http://localhost:4712
EXPO_PUBLIC_GENIE_MEETING_URL=http://localhost:4713

# HOJAI AI
EXPO_PUBLIC_HOJAI_GATEWAY_URL=http://localhost:4500
EXPO_PUBLIC_HOJAI_MEMORY_URL=http://localhost:4520
EXPO_PUBLIC_HOJAI_AGENTS_URL=http://localhost:4550

# STT/TTS
EXPO_PUBLIC_EDGE_STT_URL=http://localhost:4035
EXPO_PUBLIC_CLOUD_STT_URL=http://localhost:4033
EXPO_PUBLIC_CLOUD_TTS_URL=http://localhost:4033
```

---

## Troubleshooting

### "Microphone permission denied"
- Check `Audio.requestPermissionsAsync()` is called
- Ensure permissions requested in app.json

### "STT timeout"
- Check edge-stt service is running
- Fallback to cloud STT

### "No audio playback"
- Check audio session is configured
- Ensure expo-av is properly installed

---

**Last Updated:** June 11, 2026
