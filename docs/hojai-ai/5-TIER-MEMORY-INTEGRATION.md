# 🧠 5-Tier Memory Integration - Complete Voice System

**How Memory Tiers Connect Everything**

---

## THE CORE PRINCIPLE

**Always check memory before calling models**

```
User speaks
    │
    ▼
L1 Hot Memory (1-10ms) ────► Response (if found)
    │
    │ Not found
    ▼
L2 Warm Memory (10-50ms) ──► Response (if found)
    │
    │ Not found
    ▼
L3 Personal Cloud (100-300ms) ──► Response (if found)
    │
    │ Not found
    ▼
L4 Org Cloud (300-500ms) ──► Response (if found)
    │
    │ Not found
    ▼
L5 Global Cloud (500ms+) ──► LLM/Model ──► Response
```

---

## 5-TIER MEMORY INTEGRATION WITH VOICE

### L1 Hot Memory (1-10ms) - Device RAM

**Connected to:**
```
L1 Memory ◄──► Genie Voice (4760)
L1 Memory ◄──► VoiceOS (4850)
L1 Memory ◄──► hojai-staybot (4840)
L1 Memory ◄──► Voice QR (4096)
```

**What it stores:**
- Wake word detection
- Current voice session
- Active context
- Voice profile
- Recent transcription
- Hot intent cache

**Integration Code:**
```typescript
// Genie Voice checks L1 first
const result = await memoryTierService.get('L1', userId, 'wake_word');
if (result) return result; // Fast response
```

---

### L2 Warm Memory (10-50ms) - Device SQLite

**Connected to:**
```
L2 Memory ◄──► Genie Voice (4760)
L2 Memory ◄──► VoiceOS (4850)
L2 Memory ◄──► hojai-staybot (4840)
L2 Memory ◄──► Voice QR (4096)
```

**What it stores:**
- Recent conversations
- Recent tasks
- Recent contacts
- Recent orders
- Session history

**Integration Code:**
```typescript
// After L1 miss, check L2
const recentTasks = await memory.get('L2', userId, 'recent_tasks');
```

---

### L3 Personal Cloud (100-300ms)

**Connected to:**
```
L3 Memory ◄──► Genie Voice (4760)
L3 Memory ◄──► VoiceOS (4850)
L3 Memory ◄──► Communication Twin (4700)
L3 Memory ◄──► SkillNet Bridge (4701)
```

**What it stores:**
- Voice style learning
- Preferences
- Personal knowledge
- Cross-device sync
- Briefing data

**Integration Code:**
```typescript
// Check L3 for voice style
const style = await memory.get('L3', userId, 'voice_style');
```

---

### L4 Organization Cloud (300-500ms)

**Connected to:**
```
L4 Memory ◄──► VoiceOS (4850)
L4 Memory ◄──► Voice Agents
L4 Memory ◄──► Merchant services
L4 Memory ◄──► CRM (REZ-crm-hub)
L4 Memory ◄──► QR Services
```

**What it stores:**
- Merchant brain
- Product catalog
- Campaign data
- Employee data
- Policies

---

### L5 Global Cloud (500ms+)

**Connected to:**
```
L5 Memory ◄──► All voice services
L5 Memory ◄──► HOJAI AI (4500)
L5 Memory ◄──► External APIs
```

**What it stores:**
- Public knowledge
- Marketplace data
- Ecosystem graph
- Industry knowledge

---

## INTEGRATION WITH VOICE PRODUCTS

### Genie Voice (4760)

```
Genie Voice (4760)
    │
    ├──► L1 Hot ──► Wake word, session, voice profile
    │
    ├──► L2 Warm ──► Recent conversations, tasks
    │
    ├──► L3 Personal ──► Voice style, preferences
    │
    ├──► Communication Twin (4700) ──► Learning patterns
    │
    └──► SkillNet (4701) ──► Professional skills
```

### VoiceOS (4850)

```
VoiceOS (4850)
    │
    ├──► L1 Hot ──► Agent session, call state
    │
    ├──► L2 Warm ──► Recent calls, tickets
    │
    ├──► L3 Personal ──► Customer preferences
    │
    ├──► L4 Org ──► Products, campaigns
    │
    └──► L5 Global ──► Public knowledge
```

### hojai-staybot (4840)

```
hojai-staybot (4840)
    │
    ├──► L1 Hot ──► Room context, guest session
    │
    ├──► L2 Warm ──► Recent requests
    │
    ├──► L3 Personal ──► Guest preferences
    │
    └──► L4 Org ──► Hotel services, menu
```

### Voice QR (4096)

```
Voice QR (4096)
    │
    ├──► L1 Hot ──► Current order
    │
    ├──► L2 Warm ──► Recent orders
    │
    ├──► L3 Personal ──► Preferences, dietary
    │
    └──► L4 Org ──► Menu, restaurant data
```

---

## INTEGRATION WITH SUPPORT SERVICES

### Support Hub (4057)

```
Support Hub (4057)
    │
    ├──► L2 Warm ──► Recent tickets
    │
    ├──► L3 Personal ──► Customer history
    │
    └──► L4 Org ──► Knowledge base, policies
```

### REZ Chat (4103)

```
REZ Chat (4103)
    │
    ├──► L1 Hot ──► Active chat context
    │
    ├──► L2 Warm ──► Conversation history
    │
    └──► L3 Personal ──► User preferences
```

---

## INTEGRATION WITH TRAINING

```
All Voice Services
    │
    ├──► L1-L5 Memory tiers
    │
    └──► Training Data ──► HOJAI Voice Studio
                   │
                   ▼
            Train models
                   │
                   ▼
            Deploy to Edge STT
                   │
                   ▼
            L1-L5 Memory improves
                   │
                   ▼
            All services benefit
```

---

## INTEGRATION WITH HOJAI AI SERVICES

```
HOJAI AI Gateway (4500)
    │
    ├──► Memory (4520) ◄──► L3-L5
    │
    ├──► Intelligence (4530) ◄──► L4-L5
    │
    ├──► Agents (4550) ◄──► L1-L3
    │
    └──► Workflows (4560) ◄──► L1-L2
```

---

## INTEGRATION MAP

```
                    L1 HOT (1-10ms)
                    ────────────────
                    Genie Voice
                    VoiceOS
                    hojai-staybot
                    Voice QR
                    Support Hub

                    L2 WARM (10-50ms)
                    ─────────────────
                    Genie Voice
                    VoiceOS
                    hojai-staybot
                    Voice QR
                    REZ Chat
                    Support Hub

                    L3 PERSONAL (100-300ms)
                    ─────────────────────
                    Genie Voice
                    Communication Twin
                    SkillNet Bridge
                    VoiceOS
                    REZ Chat

                    L4 ORGANIZATION (300-500ms)
                    ──────────────────────
                    VoiceOS
                    Voice Agents
                    QR Services
                    Support Hub
                    CRM (4056)

                    L5 GLOBAL (500ms+)
                    ─────────────────
                    All services
                    External APIs
                    HOJAI AI (4500)
                    Knowledge bases
```

---

## CODE EXAMPLE: INTEGRATION

```typescript
// Genie Voice - Memory integration
class GenieVoice {
  private memoryTier: MemoryTierService;

  async processVoice(audio: Buffer) {
    // 1. Check L1 Hot (fastest)
    const session = await this.memoryTier.get('L1', userId, 'session');
    if (session) return this.handleFromCache(session);

    // 2. Check L2 Warm
    const recent = await this.memoryTier.get('L2', userId, 'recent');
    if (recent) return this.handleFromHistory(recent);

    // 3. Check L3 Personal
    const style = await this.memoryTier.get('L3', userId, 'voice_style');
    if (style) return this.handleWithStyle(style);

    // 4. Call model (slowest)
    const response = await this.ai.process(audio);

    // 5. Store in L3 Personal
    await this.memoryTier.set('L3', userId, 'voice_style', response.style);

    return response;
  }
}
```

---

## PORTS & CONNECTIONS

| Service | Port | L1 | L2 | L3 | L4 | L5 |
|---------|------|:--:|:--:|:--:|:--:|:--:|
| Genie Voice | 4760 | ✅ | ✅ | ✅ | - | - |
| VoiceOS | 4850 | ✅ | ✅ | ✅ | ✅ | - |
| hojai-staybot | 4840 | ✅ | ✅ | ✅ | ✅ | - |
| Voice QR | 4096 | ✅ | ✅ | ✅ | - | - |
| REZ Chat | 4103 | ✅ | ✅ | ✅ | - | - |
| Support Hub | 4057 | - | ✅ | ✅ | ✅ | - |
| HOJAI AI | 4500 | - | - | - | ✅ | ✅ |
| External APIs | - | - | - | - | - | ✅ |

---

## FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                  USER SPEAKS                                  │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   Wake Word      │
              │   Detection     │
              │   (L1 check)   │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   STT + Intent  │
              │   (L1-L3 check) │
              └────────┬────────┘
                       │
              ┌────────┴────────┐
              │                   │
        Found in cache     Not found
              │                   │
              ▼                   ▼
        Return cached      ┌─────────────┐
        response           │ Call LLM    │
              │           └──────┬──────┘
              │                  │
              │                  ▼
              │          ┌─────────────┐
              │          │ LLM Response │
              │          └──────┬──────┘
              │                  │
              └────────┬─────────┘
                       │
                       ▼
              ┌─────────────────────────────────┐
              │ Store in L3 Personal             │
              │ (voice_style, preferences)      │
              └────────────────┬────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ TTS + Response  │
                      │ Genie Voice    │
                      └─────────────────┘
                               │
                               ▼
                      ┌─────────────────┐
                      │ Collect for     │
                      │ Training       │
                      │ HOJAI Studio  │
                      └─────────────────┘
                               │
                               ▼
                      Better models
                               │
                               ▼
                      All services improve
```

---

## SUMMARY

| Tier | Latency | Speed | Connected To |
|------|---------|-------|-----------|
| L1 Hot | 1-10ms | ⚡⚡⚡⚡⚡ | Genie, VoiceOS, staybot, QR |
| L2 Warm | 10-50ms | ⚡⚡⚡⚡ | Genie, VoiceOS, Chat, Support |
| L3 Personal | 100-300ms | ⚡⚡⚡ | Twin, SkillNet, VoiceOS |
| L4 Org | 300-500ms | ⚡⚡ | VoiceOS, Agents, QR |
| L5 Global | 500ms+ | ⚡ | All services |

---

**Memory tiers connect all voice services for fast, personalized responses**
