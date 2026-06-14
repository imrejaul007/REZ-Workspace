import { NextResponse } from 'next/server';

export async function GET() {
  const insights = {
    marketTrend: [
      { month: 'Jan', jobs: 1200, applications: 3400 },
      { month: 'Feb', jobs: 1350, applications: 3800 },
      { month: 'Mar', jobs: 1420, applications: 4100 },
      { month: 'Apr', jobs: 1380, applications: 3900 },
      { month: 'May', jobs: 1550, applications: 4500 },
    ],
    topSkills: [
      { skill: 'React', demand: 95, salary: 18 },
      { skill: 'Python', demand: 92, salary: 16 },
      { skill: 'Node.js', demand: 88, salary: 15 },
      { skill: 'AWS', demand: 85, salary: 20 },
      { skill: 'TypeScript', demand: 82, salary: 17 },
      { skill: 'Docker', demand: 78, salary: 18 },
      { skill: 'Machine Learning', demand: 75, salary: 22 },
      { skill: 'Go', demand: 72, salary: 19 },
    ],
    salaryRanges: [
      { role: 'Frontend Developer', min: 8, max: 18, avg: 12 },
      { role: 'Backend Developer', min: 10, max: 22, avg: 15 },
      { role: 'Full Stack', min: 12, max: 25, avg: 17 },
      { role: 'DevOps Engineer', min: 15, max: 28, avg: 20 },
      { role: 'Data Scientist', min: 12, max: 30, avg: 18 },
      { role: 'ML Engineer', min: 18, max: 40, avg: 25 },
    ],
    companies: [
      { name: 'Google', openings: 245, growth: 15 },
      { name: 'Microsoft', openings: 198, growth: 12 },
      { name: 'Amazon', openings: 312, growth: 8 },
      { name: 'Meta', openings: 156, growth: 18 },
      { name: 'Netflix', openings: 89, growth: 5 },
    ],
    stats: {
      activeJobs: 12450,
      avgSalary: 18.5,
      newToday: 342,
      companiesHiring: 1245,
    },
  };

  return NextResponse.json({
    success: true,
    data: insights,
  });
}
