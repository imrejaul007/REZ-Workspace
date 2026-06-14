# REZ Forms SDK

JavaScript/TypeScript SDK for REZ Forms

## Installation

```bash
npm install @rez/forms-sdk
```

## Usage

```typescript
import { createClient } from '@rez/forms-sdk';

const client = createClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.rez.money'
});

// Create a form
const form = await client.forms.create({
  title: 'Contact Form',
  description: 'Get in touch with us'
});

// Get form
const myForm = await client.forms.get('form-id');

// Submit form
const submission = await client.submissions.submit('form-id', {
  answers: [
    { fieldId: 'name', value: 'John' },
    { fieldId: 'email', value: 'john@example.com' }
  ]
});
```

## API Reference

### Forms

```typescript
// List forms
client.forms.list()

// Get form
client.forms.get(id)

// Create form
client.forms.create(data)

// Update form
client.forms.update(id, data)

// Delete form
client.forms.delete(id)

// Publish form
client.forms.publish(id)

// Enable QR
client.forms.enableQR(id, settings)
```

### Submissions

```typescript
// Submit form
client.submissions.submit(formId, data)

// Get submission
client.submissions.get(id)

// List form submissions
client.submissions.list(formId)

// Export to CSV
client.submissions.exportCSV(formId)
```

### AI

```typescript
// Generate form from text
client.ai.generate('Create a contact form for my business')

// Generate and save
client.ai.generateAndSave({
  prompt: 'Create a contact form',
  title: 'My Contact Form'
})
```

## React Components

```tsx
import { FormEmbed, FormWidget } from '@rez/forms-sdk/react';

// Embed form
<FormEmbed formId="xxx" />

// Interactive widget
<FormWidget username="salon" slug="booking" />
```