/**
 * Career Counselor AI Agent
 * LEARNIQ - Education AI Operating System
 * Port: 4932
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

export interface CareerPath {
  title: string;
  description: string;
  requiredSkills: string[];
  educationPath: string[];
  avgSalary: { min: number; max: number };
  growthPotential: 'low' | 'medium' | 'high';
  demand: 'low' | 'medium' | 'high';
}

export interface StudentProfile {
  studentId: string;
  interests: string[];
  skills: string[];
  academicStrengths: string[];
  weaknesses: string[];
  preferredWorkStyle: string;
}

class CareerCounselor {
  private readonly careerPaths: Map<string, CareerPath> = new Map();

  constructor() {
    this.initializeCareerPaths();
  }

  private initializeCareerPaths(): void {
    const careers: CareerPath[] = [
      {
        title: 'Software Engineer',
        description: 'Design, develop, and maintain software applications',
        requiredSkills: ['Programming', 'Problem Solving', 'Algorithms', 'Teamwork'],
        educationPath: ['B.Tech Computer Science', 'M.Tech (Optional)', 'Certifications'],
        avgSalary: { min: 600000, max: 2000000 },
        growthPotential: 'high',
        demand: 'high',
      },
      {
        title: 'Data Scientist',
        description: 'Analyze data to extract insights and build predictive models',
        requiredSkills: ['Statistics', 'Python/R', 'Machine Learning', 'Data Visualization'],
        educationPath: ['B.Sc Statistics/Maths', 'M.Sc Data Science', 'PhD (Optional)'],
        avgSalary: { min: 800000, max: 2500000 },
        growthPotential: 'high',
        demand: 'high',
      },
      {
        title: 'Chartered Accountant',
        description: 'Financial reporting, auditing, and tax advisory',
        requiredSkills: ['Accounting', 'Attention to Detail', 'Analytical Thinking', 'Ethics'],
        educationPath: ['B.Com', 'CA Foundation', 'CA Intermediate', 'CA Final'],
        avgSalary: { min: 500000, max: 1500000 },
        growthPotential: 'medium',
        demand: 'medium',
      },
      {
        title: 'Doctor',
        description: 'Patient care and medical treatment',
        requiredSkills: ['Biology', 'Communication', 'Empathy', 'Continuous Learning'],
        educationPath: ['PCB in 12th', 'MBBS', 'MD/MS', 'Specialization'],
        avgSalary: { min: 800000, max: 5000000 },
        growthPotential: 'high',
        demand: 'high',
      },
      {
        title: 'Graphic Designer',
        description: 'Create visual content for branding and communication',
        requiredSkills: ['Creativity', 'Adobe Suite', 'Typography', 'Color Theory'],
        educationPath: ['B.Des', 'Portfolio Building', 'Certifications'],
        avgSalary: { min: 300000, max: 1000000 },
        growthPotential: 'medium',
        demand: 'medium',
      },
      {
        title: 'Marketing Manager',
        description: 'Develop and execute marketing strategies',
        requiredSkills: ['Communication', 'Analytics', 'Creativity', 'Digital Marketing'],
        educationPath: ['BBA/MBA', 'Digital Marketing Cert', 'Experience'],
        avgSalary: { min: 400000, max: 2000000 },
        growthPotential: 'high',
        demand: 'high',
      },
    ];

    careers.forEach(c => this.careerPaths.set(c.title, c));
  }

  async assessAptitude(profile: {
    interests: string[];
    skills: string[];
    academicScores?: Record<string, number>;
  }): Promise<{ strengths: string[]; careerSuggestions: CareerPath[]; message: string }> {
    const strengths: string[] = [];
    const suggestions: CareerPath[] = [];

    if (profile.academicScores) {
      if ((profile.academicScores.maths || 0) > 80) strengths.push('Strong in Mathematics');
      if ((profile.academicScores.science || 0) > 80) strengths.push('Strong in Science');
      if ((profile.academicScores.english || 0) > 80) strengths.push('Strong in Communication');
    }

    for (const [, career] of this.careerPaths) {
      const matchScore = this.calculateMatch(career, profile);
      if (matchScore > 0.6) {
        suggestions.push(career);
      }
    }

    suggestions.sort((a, b) => b.demand.localeCompare(a.demand));

    return {
      strengths,
      careerSuggestions: suggestions.slice(0, 3),
      message: `Based on your profile, you show aptitude for ${suggestions.slice(0, 2).map(s => s.title).join(' and ')}.`,
    };
  }

  private calculateMatch(career: CareerPath, profile: { interests: string[]; skills: string[] }): number {
    let matches = 0;
    const profileText = [...profile.interests, ...profile.skills].join(' ').toLowerCase();

    if (profileText.includes('math') || profileText.includes('coding')) {
      if (career.requiredSkills.some(s => s.toLowerCase().includes('problem'))) matches++;
    }
    if (profileText.includes('creative') || profileText.includes('design')) {
      if (career.title.toLowerCase().includes('design')) matches++;
    }
    if (profileText.includes('health') || profileText.includes('biology')) {
      if (career.title.toLowerCase().includes('doctor')) matches++;
    }

    return Math.min(1, matches / 2);
  }

  async suggestCourses(careerTitle: string): Promise<{ courses: { title: string; provider: string; duration: string }[]; message: string }> {
    const courses: Record<string, { title: string; provider: string; duration: string }[]> = {
      'Software Engineer': [
        { title: 'Full Stack Web Development', provider: 'Coursera', duration: '6 months' },
        { title: 'Data Structures & Algorithms', provider: 'GeeksforGeeks', duration: '3 months' },
        { title: 'AWS Cloud Practitioner', provider: 'AWS', duration: '2 months' },
      ],
      'Data Scientist': [
        { title: 'Machine Learning', provider: 'Stanford Online', duration: '3 months' },
        { title: 'Python for Data Science', provider: 'IBM', duration: '2 months' },
        { title: 'Deep Learning', provider: 'DeepLearning.AI', duration: '3 months' },
      ],
      'Graphic Designer': [
        { title: 'UI/UX Design', provider: 'Google', duration: '3 months' },
        { title: 'Adobe Creative Suite', provider: 'Adobe', duration: '2 months' },
      ],
    };

    return {
      courses: courses[careerTitle] || [],
      message: `Recommended courses for ${careerTitle}`,
    };
  }

  async generateRoadmap(careerTitle: string, currentStage: 'school' | 'college' | 'working'): Promise<{ steps: { year: string; action: string; milestone: string }[] }> {
    const roadmaps: Record<string, Record<string, { year: string; action: string; milestone: string }[]>> = {
      'Software Engineer': {
        school: [
          { year: 'Year 1', action: 'Learn basic programming with Python', milestone: 'Build simple games' },
          { year: 'Year 2', action: 'Study data structures', milestone: 'Solve 100 coding problems' },
          { year: 'Year 3', action: 'Build web projects', milestone: 'Portfolio with 3 projects' },
          { year: 'College', action: 'Computer Science degree', milestone: 'Internship at tech company' },
          { year: 'Year 5', action: 'Job search & interviews', milestone: 'First software job' },
        ],
        college: [
          { year: 'Year 1', action: 'Master programming fundamentals', milestone: 'Competitive programming' },
          { year: 'Year 2', action: 'Learn frameworks & build projects', milestone: 'GitHub portfolio' },
          { year: 'Year 3', action: 'Internships & certifications', milestone: 'Summer internship' },
          { year: 'Year 4', action: 'Campus placements', milestone: 'Job offer' },
        ],
        working: [
          { year: 'Year 1', action: 'Strengthen fundamentals', milestone: 'Contribute to open source' },
          { year: 'Year 2', action: 'Specialize in domain', milestone: 'Promotion to Senior' },
          { year: 'Year 3', action: 'Leadership skills', milestone: 'Tech lead role' },
        ],
      },
    };

    return {
      steps: roadmaps[careerTitle]?.[currentStage] || roadmaps['Software Engineer']?.['school'] || [],
    };
  }
}

const careerCounselor = new CareerCounselor();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'learniq-career-counselor', port: 4932 });
});

app.post('/api/aptitude', async (req: Request, res: Response) => {
  try {
    const result = await careerCounselor.assessAptitude(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to assess aptitude' });
  }
});

app.get('/api/careers', async (req: Request, res: Response) => {
  const careers = Array.from((careerCounselor as any).careerPaths.values());
  res.json({ success: true, careers, count: careers.length });
});

app.post('/api/courses', async (req: Request, res: Response) => {
  try {
    const { careerTitle } = req.body;
    const result = await careerCounselor.suggestCourses(careerTitle);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to suggest courses' });
  }
});

app.post('/api/roadmap', async (req: Request, res: Response) => {
  try {
    const { careerTitle, currentStage } = req.body;
    const roadmap = await careerCounselor.generateRoadmap(careerTitle, currentStage);
    res.json({ success: true, ...roadmap });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate roadmap' });
  }
});

const PORT = 4932;
app.listen(PORT, () => {
  console.log(`🎯 Career Counselor running on port ${PORT}`);
  console.log(`🎓 LEARNIQ - Education AI Operating System`);
});

export default app;