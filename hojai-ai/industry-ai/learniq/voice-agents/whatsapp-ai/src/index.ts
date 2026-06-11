/**
 * WhatsApp AI Agent
 * LEARNIQ - Education AI Operating System
 * Port: 4935
 */

import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

export interface WhatsAppMessage {
  from: string;
  messageId: string;
  text?: string;
  type: 'text' | 'image' | 'document';
}

export interface WhatsAppResponse {
  to: string;
  message: string;
  buttons?: { id: string; title: string }[];
  list?: { title: string; rows: { id: string; title: string; description?: string }[] };
}

class WhatsAppAI {
  private readonly greeting = 'Namaste! Welcome to LEARNIQ. Your smart education assistant. How can I help you today?';

  private readonly menuOptions = [
    { id: '1', title: 'Courses' },
    { id: '2', title: 'Admissions' },
    { id: '3', title: 'Study Help' },
    { id: '4', title: 'Assignments' },
  ];

  async processMessage(message: WhatsAppMessage): Promise<WhatsAppResponse> {
    const text = message.text?.toLowerCase().trim() || '';

    if (this.isGreeting(text)) {
      return this.sendMenu(message.from);
    }

    if (this.menuOptions.some(o => o.id === text)) {
      return this.handleOption(text, message.from);
    }

    if (text.includes('course') || text.includes('class')) {
      return this.handleCourses(message.from);
    }

    if (text.includes('admission') || text.includes('enroll')) {
      return this.handleAdmissions(message.from);
    }

    if (text.includes('study') || text.includes('tutor')) {
      return this.handleStudy(message.from);
    }

    if (text.includes('assignment') || text.includes('homework')) {
      return this.handleAssignments(message.from);
    }

    return this.sendMenu(message.from);
  }

  private isGreeting(text: string): boolean {
    const greetings = ['hi', 'hello', 'namaste', 'hey', 'good morning'];
    return greetings.some(g => text.includes(g));
  }

  private sendMenu(to: string): WhatsAppResponse {
    return {
      to,
      message: `${this.greeting}\n\nPlease select an option:`,
      list: {
        title: 'Services',
        rows: this.menuOptions.map(o => ({
          id: o.id,
          title: o.title,
        })),
      },
    };
  }

  private handleOption(option: string, from: string): WhatsAppResponse {
    const handlers: Record<string, () => WhatsAppResponse> = {
      '1': () => this.handleCourses(from),
      '2': () => this.handleAdmissions(from),
      '3': () => this.handleStudy(from),
      '4': () => this.handleAssignments(from),
    };

    return handlers[option]?.() || this.sendMenu(from);
  }

  private handleCourses(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '📚 Course Information\n\nWe offer courses in:\n• Science (Physics, Chemistry, Biology)\n• Mathematics\n• Commerce\n• Computer Science\n• Languages\n\nReply with your interest area\nor visit learniq.example.com/courses',
      buttons: [
        { id: 'science', title: 'Science Courses' },
        { id: 'maths', title: 'Math Courses' },
        { id: 'cs', title: 'Computer Science' },
      ],
    };
  }

  private handleAdmissions(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '🎓 Admissions\n\nTo apply for a course:\n1. Visit learniq.example.com/admissions\n2. Select your course\n3. Fill the application form\n4. Pay application fee\n\nNeed help? Reply with your questions.',
      buttons: [
        { id: 'online', title: 'Apply Online' },
        { id: 'contact', title: 'Contact Admissions' },
      ],
    };
  }

  private handleStudy(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '📖 Study Help\n\nOur AI tutors can help you with:\n• Concept explanations\n• Practice problems\n• Doubt clearing\n\nJust send your question!',
      buttons: [
        { id: 'ask_tutor', title: 'Ask a Tutor' },
        { id: 'practice', title: 'Practice Problems' },
      ],
    };
  }

  private handleAssignments(from: string): WhatsAppResponse {
    return {
      to: from,
      message: '📝 Assignment Help\n\nUpload your assignment and get:\n• Automated grading\n• Feedback\n• Improvement suggestions\n\nSend a photo or text of your assignment.',
      buttons: [
        { id: 'submit', title: 'Submit Assignment' },
        { id: 'check_grades', title: 'Check Grades' },
      ],
    };
  }

  async sendCourseConfirmation(to: string, courseName: string, nextStep: string): Promise<WhatsAppResponse> {
    return {
      to,
      message: `✅ Course Enrollment Received\n\nCourse: ${courseName}\n\n${nextStep}\n\nOur team will contact you within 24 hours.`,
    };
  }

  async sendStudyReminder(to: string, topic: string, task: string): Promise<WhatsAppResponse> {
    return {
      to,
      message: `📚 Study Reminder\n\nTopic: ${topic}\nTask: ${task}\n\nStay consistent with your studies! Reply if you need help.`,
    };
  }
}

const whatsappAI = new WhatsAppAI();

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', service: 'learniq-whatsapp-ai', port: 4935 });
});

app.post('/api/webhook', async (req: Request, res: Response) => {
  try {
    const { from, messageId, text, type } = req.body;
    const message: WhatsAppMessage = { from, messageId, text, type: type || 'text' };
    const response = await whatsappAI.processMessage(message);
    res.json({ success: true, ...response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process message' });
  }
});

const PORT = 4935;
app.listen(PORT, () => {
  console.log(`💬 WhatsApp AI running on port ${PORT}`);
  console.log(`🎓 LEARNIQ - Education AI Operating System`);
});

export default app;