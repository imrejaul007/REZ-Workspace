"use client";

import { useState } from "react";

const jobs = [
  { id: "1", title: "Senior React Developer", company: "TechCorp", location: "Bangalore", salary: "25-40 LPA", match: 94 },
  { id: "2", title: "Product Manager", company: "InnovateCo", location: "Mumbai", salary: "30-45 LPA", match: 89 },
  { id: "3", title: "ML Engineer", company: "AI Labs", location: "Remote", salary: "35-50 LPA", match: 91 },
  { id: "4", title: "Frontend Developer", company: "DesignHub", location: "Pune", salary: "15-25 LPA", match: 87 },
];

export default function JobsPage() {
  const [search, setSearch] = useState("");

  const filtered = jobs.filter(j => {
    if (!search) return true;
    const s = search.toLowerCase();
    return j.title.toLowerCase().includes(s) || j.company.toLowerCase().includes(s);
  });

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Jobs For You</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>AI-matched opportunities</p>
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search jobs..."
        style={{ width: "100%", padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 16 }}
      />
      <p style={{ marginBottom: 16, color: "#6b7280" }}>{filtered.length} jobs found</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(job => (
          <div key={job.id} style={{ background: "white", padding: 24, borderRadius: 12, display: "flex", gap: 20 }}>
            <div style={{ minWidth: 80, textAlign: "center" }}>
              <div style={{ background: "#10b981", color: "white", padding: 12, borderRadius: 10 }}>
                <p style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{job.match}%</p>
                <p style={{ fontSize: 11, margin: 0 }}>match</p>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <h3 style={{ fontSize: 18, marginBottom: 4 }}>{job.title}</h3>
                  <p style={{ color: "#6b7280" }}>{job.company} - {job.location}</p>
                </div>
                <button style={{ padding: "10px 24px", background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 500 }}>
                  Apply
                </button>
              </div>
              <p style={{ fontSize: 13, color: "#6b7280" }}>{job.salary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
