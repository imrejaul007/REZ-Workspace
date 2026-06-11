/**
 * Assignment Grader AI Agent
 * LEARNIQ - Education AI Operating System
 * Port: 4933
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

export interface AssignmentSubmission {
  studentId: string;
  assignmentId: string;
  content: string;
  submittedAt: string;
  wordCount: number;
  plagiarismScore?: number;
}

export interface GradingResult {
  submissionId: string;
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string[];
  strengthAreas: string[];
  improvementAreas: string[];
  lineByLineFeedback?: { line: number; comment: string; suggestion?: string }[];
}

class AssignmentGrader {
  async gradeAssignment(submission: AssignmentSubmission, rubric: {
    criteria: { name: string; weight: number; description: string }[];
    maxScore: number;
  }): Promise<GradingResult> {
    const feedback: string[] = [];
    const strengthAreas: string[] = [];
    const improvementAreas: string[] = [];

    // Simulated grading logic
    const content = submission.content.toLowerCase();
    const wordCount = submission.wordCount;

    // Check word count
    if (wordCount < 200) {
      feedback.push('Content is too short. Please elaborate more.');
      improvementAreas.push('Content length');
    } else {
      feedback.push('Good content length.');
      strengthAreas.push('Content length');
    }

    // Check for required keywords (simulated)
    const requiredKeywords = ['analysis', 'research', 'conclusion'];
    const foundKeywords = requiredKeywords.filter(k => content.includes(k));
    if (foundKeywords.length >= 2) {
      strengthAreas.push('Use of key concepts');
    } else {
      improvementAreas.push('Key concept usage');
      feedback.push('Include more analysis and research terminology.');
    }

    // Structure check (simulated)
    const hasIntroduction = content.includes('introduction') || content.includes('this essay');
    const hasConclusion = content.includes('conclusion') || content.includes('in summary');

    if (hasIntroduction && hasConclusion) {
      strengthAreas.push('Structure');
    } else {
      improvementAreas.push('Structure');
      feedback.push('Ensure proper essay structure with introduction and conclusion.');
    }

    // Calculate score
    const baseScore = Math.min(rubric.maxScore, Math.round(wordCount / 20));
    const criteriaScore = Math.round(baseScore * 0.8);
    const finalScore = Math.min(rubric.maxScore, Math.max(0, criteriaScore + (strengthAreas.length * 2) - (improvementAreas.length * 1)));

    return {
      submissionId: submission.assignmentId,
      score: finalScore,
      maxScore: rubric.maxScore,
      percentage: Math.round((finalScore / rubric.maxScore) * 100),
      feedback,
      strengthAreas,
      improvementAreas,
    };
  }

  async checkPlagiarism(text: string): Promise<{ score: number; sources: { text: string; similarity: number }[] }> {
    // Simulated plagiarism check
    const suspiciousPhrases = ['according to research', 'it is known that', 'many experts believe'];
    const foundSources = suspiciousPhrases
      .filter(p => text.toLowerCase().includes(p))
      .map(p => ({ text: p, similarity: 0.3 }));

    const score = Math.min(100, foundSources.length * 15);
    return { score, sources: foundSources };
  }

  async generateSuggestions(topic: string, assignmentType: string): Promise<string[]> {
    const suggestions: Record<string, string[]> = {
      essay: [
        'Start with a clear thesis statement',
        'Use evidence to support your arguments',
        'Include counterarguments',
        'Conclude with a strong summary',
      ],
      report: [
        'Use proper report structure',
        'Include executive summary',
        'Add data visualization',
        'Provide actionable recommendations',
      ],
      research: [
        'Cite credible sources',
        'Follow citation guidelines',
        'Include methodology section',
        'Discuss limitations',
      ],
    };

    return suggestions[assignmentType] || suggestions.essay;
  }

  async provideFeedback(submission: AssignmentSubmission): Promise<{ strengths: string; improvements: string; tips: string[] }> {
    const content = submission.content;
    const tips: string[] = [];

    // Analyze content
    if (content.length > 1000) {
      tips.push('Consider breaking your content into smaller paragraphs for better readability.');
    }

    const hasExamples = content.includes('for example') || content.includes('such as') || content.includes('like');
    if (!hasExamples) {
      tips.push('Adding concrete examples would strengthen your arguments.');
    }

    return {
      strengths: 'Shows good understanding of the topic with clear writing.',
      improvements: 'Content could benefit from more evidence and examples.',
      tips,
    };
  }
}

const grader = new AssignmentGrader();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'learniq-assignment-grader', port: 4933 });
});

app.post('/api/grade', async (req: Request, res: Response) => {
  try {
    const { submission, rubric } = req.body;
    const result = await grader.gradeAssignment(submission, rubric);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to grade assignment' });
  }
});

app.post('/api/plagiarism', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const result = await grader.checkPlagiarism(text);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check plagiarism' });
  }
});

app.get('/api/suggestions', async (req: Request, res: Response) => {
  try {
    const topic = req.query.topic as string || 'general';
    const type = req.query.type as string || 'essay';
    const suggestions = await grader.generateSuggestions(topic, type);
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

app.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    const result = await grader.provideFeedback(req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate feedback' });
  }
});

const PORT = 4933;
app.listen(PORT, () => {
  console.log(`✅ Assignment Grader running on port ${PORT}`);
  console.log(`🎓 LEARNIQ - Education AI Operating System`);
});

export default app;