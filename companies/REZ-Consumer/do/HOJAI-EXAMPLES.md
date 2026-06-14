# 📖 DO App HOJAI Integration - Practical Examples

**Version:** 1.0 | **Date:** June 7, 2026

---

## 🚀 Quick Start

```typescript
import { useAI } from '@/hooks';

function MyComponent() {
  const { flow, genie, hybrid } = useAI();
  // Ready to use!
}
```

---

## 🎤 Example 1: Voice Booking

### Code
```typescript
import { useAI } from '@/hooks';

function VoiceBooking() {
  const { flow } = useAI();

  const handleVoiceCommand = async () => {
    // 1. Start listening
    await flow.startListening();

    // 2. Wait for user to speak...

    // 3. Stop and get transcript
    const transcript = await flow.stopListening();

    console.log('User said:', transcript);
    // "Book a table for 2 at Italian restaurant tonight"
  };

  return (
    <Button onPress={handleVoiceCommand}>
      🎤 Speak
    </Button>
  );
}
```

### Flow
```
User presses mic → "Book a table for 2" → transcript returned
```

---

## 🧠 Example 2: Remember Preferences

### Code
```typescript
import { useAI } from '@/hooks';

function PreferenceSaver() {
  const { genie } = useAI();

  // Remember cuisine preference
  const saveCuisine = async () => {
    await genie.rememberCuisine('Italian');
    console.log('Cuisine saved!');
  };

  // Remember dietary restriction
  const saveDietary = async () => {
    await genie.rememberDietary('Vegetarian');
    console.log('Dietary saved!');
  };

  // Remember favorite restaurant
  const saveRestaurant = async () => {
    await genie.rememberFavoriteRestaurant('La Pinoz', {
      cuisine: 'Italian',
      averageBill: 1200,
      visitCount: 5,
    });
    console.log('Restaurant saved!');
  };
}
```

### What Happens
```
User books La Pinoz → Remember("Italian", "Vegetarian", "La Pinoz ₹1200")
     ↓
Genie stores: cuisine=Italian, dietary=Vegetarian, favorite=La Pinoz
     ↓
Next time: "Book my usual" → Genie recalls: La Pinoz, Italian, ₹1200
```

---

## 💬 Example 3: "Order My Usual"

### Code
```typescript
import { useAI } from '@/hooks';

function UsualOrder() {
  const { genie } = useAI();

  const handleUsual = async () => {
    // Get user's "usual"
    const usual = await genie.getUsual();

    if (usual) {
      // Show user's usual
      Alert.alert(
        'Your Usual',
        `${usual.merchant}\n${usual.cuisine}\n₹${usual.amount}`
      );
    } else {
      // No usual yet
      Alert.alert('No usual found', 'Book some restaurants first!');
    }
  };
}
```

### What Happens
```
User: "Order my usual"
     ↓
Genie.getUsual() → analyzes transactions
     ↓
Returns: { merchant: "La Pinoz", cuisine: "Italian", amount: 1200 }
     ↓
UI: "Your usual is La Pinoz, Italian, ₹1200"
```

---

## 🔄 Example 4: Full Hybrid Command

### Code
```typescript
import { useAI } from '@/hooks';

function ChatMessage({ message }) {
  const { hybrid } = useAI();

  const handleSend = async (text) => {
    // Full AI processing
    const response = await hybrid.handleTextCommand(text);

    // response.text = "Your usual is La Pinoz. Should I book it?"
    // response.suggestions = ["Yes, book", "Show menu", "Find another"]

    return response;
  };
}
```

### What Happens
```
User types: "Order my usual"
     ↓
hybrid.handleTextCommand("Order my usual")
     ↓
1. Intent detection: "usual" pattern detected
2. Genie recall: Get user's usual
3. Response: "Your usual is La Pinoz. Should I book it?"
4. Suggestions: ["Yes, book", "Show menu"]
     ↓
UI: Shows message + suggestions
```

---

## 💳 Example 5: Learn from Transaction

### Code
```typescript
import { useAI } from '@/hooks';

function BookingConfirmation({ booking }) {
  const { hybrid } = useAI();

  const handleConfirm = async () => {
    // Book confirmed!

    // Learn from this booking
    await hybrid.handleBookingComplete({
      merchantName: 'La Pinoz',
      cuisine: 'Italian',
      amount: 1200,
      time: '7 PM',
      partySize: 2,
    });

    console.log('Learned from booking!');
  };
}
```

### What Happens
```
User completes booking: La Pinoz, 2 people, ₹1200
     ↓
hybrid.handleBookingComplete(...)
     ↓
Genie remembers:
  - cuisine = Italian
  - favorite = La Pinoz
  - partySize = 2
  - preferredTime = 7 PM
     ↓
Future: "Book my usual" → La Pinoz suggested
```

---

## 🎤 Example 6: Speak Response

### Code
```typescript
import { useAI } from '@/hooks';

function AIBot() {
  const { flow } = useAI();

  const speakConfirmation = async () => {
    // Text to speech
    await flow.speak('Your booking is confirmed! See you at 7 PM.');
  };

  const speakBalance = async (karma) => {
    await flow.speak(`You have ${karma} karma coins.`);
  };
}
```

### Voices Available
```typescript
// Choose voice
await flow.speak('Hello!', { voice: 'shimmer' });  // Female
await flow.speak('Hello!', { voice: 'alloy' });   // Neutral
await flow.speak('Hello!', { voice: 'echo' });    // Male
```

---

## 📊 Example 7: Spending Summary

### Code
```typescript
import { useAI } from '@/hooks';

function SpendingScreen() {
  const { genie } = useAI();

  const showSummary = async () => {
    // Get 30-day spending
    const summary = await genie.getSpendingSummary(30);

    console.log(`
      Total Spent: ₹${summary.totalSpent}
      Transactions: ${summary.transactionCount}
      Average: ₹${summary.averageTransaction}
      Top Merchant: ${summary.topMerchant}
    `);
  };
}
```

### Output
```
Total Spent: ₹15,000
Transactions: 12
Average: ₹1,250
Top Merchant: La Pinoz
```

---

## 🎯 Example 8: Booking Pattern

### Code
```typescript
import { useAI } from '@/hooks';

function Recommendation() {
  const { genie } = useAI();

  const getRecommendation = async () => {
    const pattern = await genie.getBookingPattern();

    console.log(`
      Preferred time: ${pattern.preferredTime}
      Party size: ${pattern.preferredPartySize}
      Cuisine: ${pattern.preferredCuisine}
      Average spend: ₹${pattern.averageSpend}
    `);
  };
}
```

### Output
```
Preferred time: 7 PM
Party size: 2
Cuisine: Italian
Average spend: ₹1,200
```

---

## 🔗 Example 9: Combined Flow

### Code
```typescript
import { useAI } from '@/hooks';

function VoiceShopping() {
  const { flow, genie } = useAI();

  const handleVoiceOrder = async () => {
    // 1. Listen
    await flow.startListening();
    const transcript = await flow.stopListening();

    // 2. Check if "usual"
    if (transcript.includes('usual')) {
      const usual = await genie.getUsual();

      // 3. Speak confirmation
      await flow.speak(
        `Your usual is ${usual.merchant}. Total ₹${usual.amount}. Should I order?`
      );
    } else {
      // Normal flow
      await flow.speak('Let me find that for you.');
    }
  };
}
```

---

## 📱 Example 10: Profile Screen

### Code
```typescript
import { useAI } from '@/hooks';

function ProfileScreen() {
  const { genie, userId } = useAI();

  // Get preferences
  const preferences = await genie.getContext();

  return (
    <View>
      <Text>Your Usual</Text>
      <Text>{preferences.usual?.merchant}</Text>

      <Text>Preferences</Text>
      <Text>Cuisine: {preferences.bookingPattern?.preferredCuisine}</Text>
      <Text>Time: {preferences.bookingPattern?.preferredTime}</Text>

      <Text>Dietary</Text>
      {preferences.preferences
        .filter(p => p.tags.includes('dietary'))
        .map(p => <Text key={p.id}>{p.content}</Text>)
      }
    </View>
  );
}
```

---

## 🔧 Example 11: Error Handling

### Code
```typescript
import { useAI } from '@/hooks';

function SafeBooking() {
  const { hybrid } = useAI();

  const handleOrder = async () => {
    try {
      const response = await hybrid.handleTextCommand("Book my usual");

      if (response.confidence < 0.5) {
        // Low confidence - ask for clarification
        await hybrid.flow.speak(
          "I didn't understand. Could you say that again?"
        );
      }
    } catch (error) {
      console.error('Booking failed:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };
}
```

---

## 🎨 Example 12: UI States

### Code
```typescript
import { useAI } from '@/hooks';

function ChatUI() {
  const { flow, hybrid, genie } = useAI();

  return (
    <View>
      {/* Listening indicator */}
      {flow.isListening && (
        <AnimatedMicButton pulse />
      )}

      {/* Speaking indicator */}
      {flow.isSpeaking && (
        <AnimatedSpeakerButton />
      )}

      {/* Processing */}
      {hybrid.isProcessing && (
        <LoadingSpinner />
      )}

      {/* Genie indicator */}
      {genie.context?.usual && (
        <GenieBadge
          text={`Usual: ${genie.context.usual.merchant}`}
        />
      )}
    </View>
  );
}
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/hooks/useFlowVoice.ts` | Voice STT/TTS |
| `src/hooks/useGenieMemory.ts` | Memory remember/recall |
| `src/hooks/useHybridAI.ts` | Combined AI |
| `src/hooks/useAI.ts` | Convenience hook |
| `src/screens/ChatScreen.tsx` | Example usage |

---

## 🧪 Test Commands

```bash
# Test voice
curl -X POST http://localhost:4033/api/stt \
  -F "audio=@test.m4a"

# Test memory
curl "http://localhost:4540/api/memory/recall?userId=user-1&query=Italian"

# Test TTS
curl -X POST http://localhost:4033/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello!","voice":"shimmer"}'
```

---

**Last Updated:** June 7, 2026
