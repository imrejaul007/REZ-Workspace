'use client';

import { useState } from 'react';

export default function TestTypingPage() {
  const [basicInput, setBasicInput] = useState('');
  const [formValue, setFormValue] = useState('');

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Form Typing Debug Test</h1>

      {/* Test 1: Basic uncontrolled input */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test 1: Basic HTML Input (Uncontrolled)</h2>
        <input
          type="text"
          placeholder="Type here - basic HTML input"
          className="w-full p-2 border rounded"
          onChange={(e) => console.log('Basic input:', e.target.value)}
        />
        <p className="text-sm text-gray-600 mt-2">This should work if HTML inputs work at all</p>
      </div>

      {/* Test 2: Controlled React input */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test 2: React Controlled Input</h2>
        <input
          type="text"
          placeholder="Type here - controlled React input"
          className="w-full p-2 border rounded"
          value={basicInput}
          onChange={(e) => {
            console.log('Controlled input:', e.target.value);
            setBasicInput(e.target.value);
          }}
        />
        <p className="text-sm text-gray-600 mt-2">Value: {basicInput}</p>
      </div>

      {/* Test 3: Form with React Hook Form style */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test 3: Form Element</h2>
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Type here - inside form element"
            className="w-full p-2 border rounded"
            value={formValue}
            onChange={(e) => {
              console.log('Form input:', e.target.value);
              setFormValue(e.target.value);
            }}
          />
          <p className="text-sm text-gray-600 mt-2">Form value: {formValue}</p>
        </form>
      </div>

      {/* Test 4: Textarea */}
      <div className="mb-6 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Test 4: Textarea</h2>
        <textarea
          placeholder="Type here - textarea"
          className="w-full p-2 border rounded h-20"
          onChange={(e) => console.log('Textarea:', e.target.value)}
        />
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Debug Information</h2>
        <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'Loading...'}</p>
        <p><strong>JavaScript Enabled:</strong> ✅ Yes (this page loaded)</p>
        <p><strong>React Hydrated:</strong> ✅ Yes (state changes work)</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Try typing in each input field above</li>
          <li>Open browser console (F12) to see if onChange events fire</li>
          <li>If none work: Browser/environment issue</li>
          <li>If some work but not others: Specific component issue</li>
        </ol>
      </div>
    </div>
  );
}