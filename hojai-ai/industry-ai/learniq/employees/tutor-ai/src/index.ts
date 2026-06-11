/**
 * Tutor AI Agent
 * LEARNIQ - Education AI Operating System
 * Port: 4930
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

export interface LessonPlan {
  id: string;
  subject: string;
  topic: string;
  subtopics: string[];
  objectives: string[];
  duration: number;
  activities: { name: string; type: string; duration: number }[];
  resources: string[];
  assessment: string[];
}

export interface StudentProgress {
  studentId: string;
  subject: string;
  topic: string;
  understandingLevel: number;
  completedLessons: number;
  quizScores: number[];
  weakAreas: string[];
  strengths: string[];
}

class TutorAI {
  private lessonPlans: Map<string, LessonPlan> = new Map();
  private progress: Map<string, StudentProgress[]> = new Map();

  async generateLessonPlan(data: {
    subject: string;
    topic: string;
    duration: number;
    studentLevel: 'beginner' | 'intermediate' | 'advanced';
  }): Promise<LessonPlan> {
    const subtopics = this.getSubtopics(data.topic, data.studentLevel);
    const activities = this.generateActivities(data.duration, data.studentLevel);

    return {
      id: `lesson-${Date.now()}`,
      subject: data.subject,
      topic: data.topic,
      subtopics,
      objectives: this.generateObjectives(subtopics),
      duration: data.duration,
      activities,
      resources: this.suggestResources(data.subject, data.topic),
      assessment: this.suggestAssessment(subtopics),
    };
  }

  private getSubtopics(topic: string, level: string): string[] {
    const topicMap: Record<string, string[]> = {
      'mathematics': ['basics', 'algebra', 'geometry', 'statistics', 'probability'],
      'science': ['physics', 'chemistry', 'biology', 'earth science'],
      'english': ['grammar', 'vocabulary', 'reading', 'writing', 'speaking'],
      'history': ['ancient', 'medieval', 'modern', 'contemporary'],
    };

    const base = topicMap[topic.toLowerCase()] || [topic];
    const topicSubtopics: Record<string, string[]> = {
      mathematics: ['Numbers', 'Operations', 'Equations', 'Word Problems'],
      science: ['Matter', 'Energy', 'Forces', 'Ecosystems'],
      english: ['Parts of Speech', 'Sentences', 'Paragraphs', 'Essays'],
    };

    return topicSubtopics[topic] || base;
  }

  private generateObjectives(subtopics: string[]): string[] {
    return subtopics.map(st => `Student will understand ${st.toLowerCase()}`);
  }

  private generateActivities(duration: number, level: string): { name: string; type: string; duration: number }[] {
    const ratio = level === 'beginner' ? 1 : level === 'intermediate' ? 0.8 : 0.6;
    const activities = [
      { name: 'Warm-up Quiz', type: 'interactive', duration: Math.round(5 * ratio) },
      { name: 'Concept Explanation', type: 'lecture', duration: Math.round(15 * ratio) },
      { name: 'Guided Practice', type: 'exercise', duration: Math.round(15 * ratio) },
      { name: 'Group Discussion', type: 'collaborative', duration: Math.round(10 * ratio) },
      { name: 'Independent Practice', type: 'exercise', duration: Math.round(10 * ratio) },
    ];

    return activities.slice(0, Math.ceil(duration / 15));
  }

  private suggestResources(subject: string, topic: string): string[] {
    return [
      `https://learniq.example.com/books/${subject}/${topic}`,
      `https://learniq.example.com/videos/${topic}`,
      `https://learniq.example.com/workshits/${topic}`,
    ];
  }

  private suggestAssessment(subtopics: string[]): string[] {
    return [
      'Quick quiz on key concepts',
      'Exit ticket with open-ended questions',
      'Apply concepts in problem-solving',
    ];
  }

  async answerQuestion(question: string, context?: { subject?: string; topic?: string }): Promise<{ answer: string; confidence: number; relatedTopics?: string[] }> {
    const lowerQ = question.toLowerCase();

    // Simple keyword matching for demo
    if (lowerQ.includes('how') || lowerQ.includes('what')) {
      return {
        answer: `That's a great question about ${context?.topic || 'this topic'}. Let me explain...`,
        confidence: 0.85,
        relatedTopics: context?.topic ? [context.topic] : undefined,
      };
    }

    return {
      answer: 'Thank you for your question. I will need a moment to provide a detailed answer.',
      confidence: 0.7,
    };
  }

  async trackProgress(studentId: string, data: {
    subject: string;
    topic: string;
    quizScore: number;
    completed: boolean;
  }): Promise<StudentProgress> {
    const key = studentId;
    const existing = this.progress.get(key) || [];
    const subjectProgress = existing.find(p => p.subject === data.subject) || {
      studentId,
      subject: data.subject,
      topic: data.topic,
      understandingLevel: 0,
      completedLessons: 0,
      quizScores: [],
      weakAreas: [],
      strengths: [],
    };

    subjectProgress.quizScores.push(data.quizScore);
    if (data.completed) subjectProgress.completedLessons++;

    const avgScore = subjectProgress.quizScores.reduce((a, b) => a + b, 0) / subjectProgress.quizScores.length;
    subjectProgress.understandingLevel = Math.round(avgScore);

    if (avgScore < 60) {
      subjectProgress.weakAreas.push(data.topic);
    } else {
      subjectProgress.strengths.push(data.topic);
    }

    const existingIndex = existing.findIndex(p => p.subject === data.subject);
    if (existingIndex >= 0) {
      existing[existingIndex] = subjectProgress;
    } else {
      existing.push(subjectProgress);
    }

    this.progress.set(key, existing);
    return subjectProgress;
  }

  async getRecommendations(studentId: string): Promise<{ courses: string[]; topics: string[]; message: string }> {
    const progress = this.progress.get(studentId) || [];

    const weakSubjects = progress.filter(p => p.understandingLevel < 70).map(p => p.subject);
    const strongSubjects = progress.filter(p => p.understandingLevel >= 80).map(p => p.subject);

    return {
      courses: weakSubjects.map(s => `Remedial ${s}`),
      topics: weakSubjects.flatMap(s => progress.filter(p => p.subject === s).flatMap(p => p.weakAreas)),
      message: weakSubjects.length > 0
        ? `Focus on improving ${weakSubjects.join(', ')}. Consider extra practice sessions.`
        : `Great progress! Explore advanced courses in ${strongSubjects.join(', ')}.`,
    };
  }
}

const tutorAI = new TutorAI();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'learniq-tutor-ai', port: 4930 });
});

app.post('/api/lessons', async (req: Request, res: Response) => {
  try {
    const plan = await tutorAI.generateLessonPlan(req.body);
    res.status(201).json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate lesson plan' });
  }
});

app.post('/api/ask', async (req: Request, res: Response) => {
  try {
    const { question, context } = req.body;
    const answer = await tutorAI.answerQuestion(question, context);
    res.json({ success: true, ...answer });
  } catch (error) {
    res.status(500).json({ error: 'Failed to answer question' });
  }
});

app.post('/api/progress', async (req: Request, res: Response) => {
  try {
    const { studentId, ...data } = req.body;
    const progress = await tutorAI.trackProgress(studentId, data);
    res.json({ success: true, progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track progress' });
  }
});

app.get('/api/recommendations/:studentId', async (req: Request, res: Response) => {
  try {
    const recommendations = await tutorAI.getRecommendations(req.params.studentId);
    res.json({ success: true, ...recommendations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

const PORT = 4930;
app.listen(PORT, () => {
  console.log(`📚 Tutor AI running on port ${PORT}`);
  console.log(`🎓 LEARNIQ - Education AI Operating System`);
});

export default app;