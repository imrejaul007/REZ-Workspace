// RisaCare Web - Dashboard App

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/records" element={<Records />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/booking" element={<Booking />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900">RisaCare Dashboard</h1>
      <p className="mt-2 text-gray-600">Your health at a glance</p>
      <div className="mt-8 grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-4xl font-bold text-blue-600">78</h3>
          <p className="text-gray-500 mt-2">Health Score</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-4xl font-bold text-green-600">12</h3>
          <p className="text-gray-500 mt-2">Reports</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-4xl font-bold text-purple-600">5</h3>
          <p className="text-gray-500 mt-2">Appointments</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-4xl font-bold text-orange-600">7</h3>
          <p className="text-gray-500 mt-2">Day Streak</p>
        </div>
      </div>
    </div>
  );
}

function Records() {
  return <div className="p-8"><h1 className="text-2xl font-bold">Health Records</h1></div>;
}

function AIAssistant() {
  return <div className="p-8"><h1 className="text-2xl font-bold">AI Assistant</h1></div>;
}

function Wellness() {
  return <div className="p-8"><h1 className="text-2xl font-bold">Wellness</h1></div>;
}

function Booking() {
  return <div className="p-8"><h1 className="text-2xl font-bold">Book Appointment</h1></div>;
}
