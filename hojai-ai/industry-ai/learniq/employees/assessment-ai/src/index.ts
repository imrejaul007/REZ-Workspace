/**
 * Assessment AI Agent
 * LEARNIQ - Education AI Operating System
 * Port: 4931
 */

import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

export interface Question {
  id: string;
  type: 'mcq' | 'true-false' | 'short' | 'long';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  marks: number;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  topic: string;
  questions: Question[];
  totalMarks: number;
  duration: number;
  passingMarks: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: { questionId: string; answer: string; isCorrect: boolean; marks: number }[];
  score: number;
  percentage: number;
  status: 'in-progress' | 'completed';
  startedAt: string;
  completedAt?: string;
}

class AssessmentAI {
  private quizzes: Map<string, Quiz> = new Map();
  private attempts: Map<string, QuizAttempt> = new Map();

  async createQuiz(data: {
    title: string;
    subject: string;
    topic: string;
    questionCount: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
    duration: number;
  }): Promise<Quiz> {
    const questions = await this.generateQuestions(
      data.subject,
      data.topic,
      data.questionCount,
      data.difficulty
    );

    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    const quiz: Quiz = {
      id: uuidv4(),
      title: data.title,
      subject: data.subject,
      topic: data.topic,
      questions,
      totalMarks,
      duration: data.duration,
      passingMarks: Math.round(totalMarks * 0.4),
    };

    this.quizzes.set(quiz.id, quiz);
    return quiz;
  }

  private async generateQuestions(
    subject: string,
    topic: string,
    count: number,
    difficulty: string
  ): Promise<Question[]> {
    const questions: Question[] = [];

    // Generate sample questions based on subject
    const samples: Record<string, Question[]> = {
      mathematics: [
        { id: '1', type: 'mcq', question: `What is the value of x in 2x + 5 = 15?`, options: ['3', '5', '7', '10'], correctAnswer: '5', marks: 5, topic: 'algebra', difficulty: 'easy' },
        { id: '2', type: 'mcq', question: 'Calculate: 15 × 8 = ?', options: ['120',115','130','125'], correctAnswer: '120', marks: 3, topic: 'arithmetic', difficulty: 'easy' },
        { id: '3', type: 'short', question: 'Find the square root of 144', correctAnswer: '12', marks: 4, topic: 'arithmetic', difficulty: 'easy' },
      ],
      science: [
        { id: '1', type: 'mcq', question: 'What is the chemical symbol for water?', options: ['H2O', 'CO2', 'NaCl', 'O2'], correctAnswer: 'H2O', marks: 5, topic: 'chemistry', difficulty: 'easy' },
        { id: '2', type: 'true-false', question: 'The Earth revolves around the Sun.', correctAnswer: 'true', marks: 3, topic: 'astronomy', difficulty: 'easy' },
        { id: '3', type: 'short', question: 'Name the process by which plants make food.', correctAnswer: 'photosynthesis', marks: 4, topic: 'biology', difficulty: 'medium' },
      ],
    };

    const subjectQuestions = samples[subject.toLowerCase()] || samples.science;

    for (let i = 0; i < Math.min(count, subjectQuestions.length); i++) {
      questions.push({ ...subjectQuestions[i], id: uuidv4() });
    }

    return questions;
  }

  async startQuiz(quizId: string, studentId: string): Promise<QuizAttempt> {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) throw new Error('Quiz not found');

    const attempt: QuizAttempt = {
      id: uuidv4(),
      quizId,
      studentId,
      answers: [],
      score: 0,
      percentage: 0,
      status: 'in-progress',
      startedAt: new Date().toISOString(),
    };

    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  async submitAnswer(attemptId: string, questionId: string, answer: string): Promise<QuizAttempt | undefined> {
    const attempt = this.attempts.get(attemptId);
    if (!attempt || attempt.status === 'completed') return undefined;

    const quiz = this.quizzes.get(attempt.quizId);
    if (!quiz) return undefined;

    const question = quiz.questions.find(q => q.id === questionId);
    if (!question) return undefined;

    const isCorrect = this.checkAnswer(question, answer);
    const marks = isCorrect ? question.marks : 0;

    const existingAnswer = attempt.answers.findIndex(a => a.questionId === questionId);
    if (existingAnswer >= 0) {
      attempt.answers[existingAnswer] = { questionId, answer, isCorrect, marks };
    } else {
      attempt.answers.push({ questionId, answer, isCorrect, marks });
    }

    attempt.score = attempt.answers.reduce((sum, a) => sum + a.marks, 0);
    attempt.percentage = Math.round((attempt.score / quiz.totalMarks) * 100);

    this.attempts.set(attemptId, attempt);
    return attempt;
  }

  private checkAnswer(question: Question, answer: string): boolean {
    if (Array.isArray(question.correctAnswer)) {
      return question.correctAnswer.includes(answer.toLowerCase());
    }
    return answer.toLowerCase() === question.correctAnswer.toLowerCase();
  }

  async completeQuiz(attemptId: string): Promise<QuizAttempt | undefined> {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) return undefined;

    attempt.status = 'completed';
    attempt.completedAt = new Date().toISOString();

    this.attempts.set(attemptId, attempt);
    return attempt;
  }

  async getAnalytics(quizId: string): Promise<{
    totalAttempts: number;
    avgScore: number;
    passRate: number;
    scoreDistribution: { range: string; count: number }[];
    difficultQuestions: string[];
  }> {
    const quiz = this.quizzes.get(quizId);
    if (!quiz) throw new Error('Quiz not found');

    const attempts = Array.from(this.attempts.values()).filter(a => a.quizId === quizId && a.status === 'completed');

    if (attempts.length === 0) {
      return {
        totalAttempts: 0,
        avgScore: 0,
        passRate: 0,
        scoreDistribution: [],
        difficultQuestions: [],
      };
    }

    const avgScore = Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length);
    const passCount = attempts.filter(a => a.percentage >= 40).length;
    const passRate = Math.round((passCount / attempts.length) * 100);

    const difficultyMap: Record<string, number> = {};
    attempts.forEach(a => {
      a.answers.filter(ans => !ans.isCorrect).forEach(ans => {
        difficultyMap[ans.questionId] = (difficultyMap[ans.questionId] || 0) + 1;
      });
    });

    return {
      totalAttempts: attempts.length,
      avgScore,
      passRate,
      scoreDistribution: [
        { range: '0-40%', count: attempts.filter(a => a.percentage < 40).length },
        { range: '40-60%', count: attempts.filter(a => a.percentage >= 40 && a.percentage < 60).length },
        { range: '60-80%', count: attempts.filter(a => a.percentage >= 60 && a.percentage < 80).length },
        { range: '80-100%', count: attempts.filter(a => a.percentage >= 80).length },
      ],
      difficultQuestions: Object.entries(difficultyMap)
        .filter(([, count]) => count > attempts.length * 0.3)
        .map(([qId]) => qId),
    };
  }
}

const assessmentAI = new AssessmentAI();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'learniq-assessment-ai', port: 4931 });
});

app.post('/api/quizzes', async (req: Request, res: Response) => {
  try {
    const quiz = await assessmentAI.createQuiz(req.body);
    res.status(201).json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

app.get('/api/quizzes/:id', async (req: Request, res: Response) => {
  const quiz = (assessmentAI as any).quizzes?.get(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  res.json({ success: true, quiz });
});

app.post('/api/attempts', async (req: Request, res: Response) => {
  try {
    const { quizId, studentId } = req.body;
    const attempt = await assessmentAI.startQuiz(quizId, studentId);
    res.status(201).json({ success: true, attempt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start quiz' });
  }
});

app.post('/api/attempts/:id/answer', async (req: Request, res: Response) => {
  try {
    const { questionId, answer } = req.body;
    const attempt = await assessmentAI.submitAnswer(req.params.id, questionId, answer);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    res.json({ success: true, attempt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

app.post('/api/attempts/:id/complete', async (req: Request, res: Response) => {
  try {
    const attempt = await assessmentAI.completeQuiz(req.params.id);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
    res.json({ success: true, attempt });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete quiz' });
  }
});

app.get('/api/quizzes/:id/analytics', async (req: Request, res: Response) => {
  try {
    const analytics = await assessmentAI.getAnalytics(req.params.id);
    res.json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

const PORT = 4931;
app.listen(PORT, () => {
  console.log(`📝 Assessment AI running on port ${PORT}`);
  console.log(`🎓 LEARNIQ - Education AI Operating System`);
});

export default app;