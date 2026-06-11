/**
 * FITMIND AI Brain Service
 * Real AI-powered fitness intelligence using Claude
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
});

const MODEL = process.env.AI_MODEL || 'claude-sonnet-4-20250514';

interface WorkoutRecommendationInput {
  memberId?: string;
  memberName?: string;
  goal: string;
  fitness: string;
  daysPerWeek?: number;
  injuries?: string[];
  equipment?: string[];
}

interface NutritionPlanInput {
  goal: string;
  weight: number;
  height?: number;
  age?: number;
  dietary: string;
  allergies?: string[];
  mealsPerDay?: number;
}

interface ProgressAnalysisInput {
  memberId: string;
  memberName?: string;
  progressData: {
    date: string;
    weight?: number;
    measurements?: { chest?: number; waist?: number; hips?: number; arms?: number };
    workoutsCompleted?: number;
    energyLevel?: number;
  }[];
}

interface InjuryPreventionInput {
  exercise: string;
  form: string;
  memberHistory?: string[];
}

interface MotivationInput {
  memberId?: string;
  memberName?: string;
  mood: string;
  streak?: number;
  recentAchievements?: string[];
}

// ============================================
// WORKOUT RECOMMENDATION AI
// ============================================

export async function recommendWorkouts(input: WorkoutRecommendationInput): Promise<{
  workouts: Array<{ exercise: string; sets: number; reps: string; restSeconds: number; reason: string; alternative?: string }>;
  schedule: Array<{ day: string; focus: string; duration: string; exercises: string[] }>;
  aiMessage: string;
}> {
  const prompt = `You are FitMind, an expert fitness AI coach. Generate a personalized workout plan.

Member: ${input.memberName || 'New Member'}
Goal: ${input.goal}
Fitness Level: ${input.fitness}
Days per week: ${input.daysPerWeek || 4}
Injuries to avoid: ${input.injuries?.join(', ') || 'None'}
Available equipment: ${input.equipment?.join(', ') || 'Standard gym'}

Generate a weekly workout schedule with:
1. 4-6 exercises per day
2. Sets, reps, and rest periods
3. Why each exercise is recommended
4. Alternatives for each exercise

Return a JSON object with this exact structure:
{
  "workouts": [
    {
      "exercise": "Exercise Name",
      "sets": 3,
      "reps": "10-12",
      "restSeconds": 60,
      "reason": "Why this exercise helps their goal",
      "alternative": "Easier version if needed"
    }
  ],
  "schedule": [
    {
      "day": "Day 1 - Push",
      "focus": "Chest, shoulders, triceps",
      "duration": "45-60 minutes",
      "exercises": ["exercise1", "exercise2", "exercise3"]
    }
  ],
  "aiMessage": "Encouraging personalized message about their workout plan"
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      return parsed;
    }
    throw new Error('Invalid AI response');
  } catch (error: any) {
    // Fallback to intelligent rule-based response
    return generateWorkoutFallback(input);
  }
}

// ============================================
// NUTRITION PLANNING AI
// ============================================

export async function planNutrition(input: NutritionPlanInput): Promise<{
  calories: number;
  macros: { protein: number; carbs: number; fat: number };
  meals: Array<{ name: string; time: string; items: Array<{ food: string; calories: number; protein: number; carbs: number; fat: number }> }>;
  restrictions: string[];
  aiMessage: string;
}> {
  const prompt = `You are FitMind, an expert nutrition advisor AI. Create a personalized meal plan.

Goal: ${input.goal}
Weight: ${input.weight} kg
Height: ${input.height || 170} cm
Age: ${input.age || 30}
Dietary preference: ${input.dietary}
Allergies to avoid: ${input.allergies?.join(', ') || 'None'}
Meals per day: ${input.mealsPerDay || 4}

Calculate:
1. Daily calorie target based on goal
2. Macro breakdown (protein, carbs, fat in grams)
3. Detailed meal plan with specific foods
4. Total calories and macros per meal

Return a JSON object:
{
  "calories": 2500,
  "macros": { "protein": 180, "carbs": 250, "fat": 70 },
  "meals": [
    {
      "name": "Breakfast",
      "time": "7:00 AM",
      "items": [
        { "food": "Oats with banana and honey", "calories": 350, "protein": 12, "carbs": 55, "fat": 8 }
      ]
    }
  ],
  "restrictions": ["Avoid dairy if lactose intolerant"],
  "aiMessage": "Encouraging message about the nutrition plan"
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      return parsed;
    }
    throw new Error('Invalid AI response');
  } catch (error: any) {
    return generateNutritionFallback(input);
  }
}

// ============================================
// PROGRESS ANALYSIS AI
// ============================================

export async function analyzeProgress(input: ProgressAnalysisInput): Promise<{
  trends: Array<{ metric: string; direction: string; change: string }>;
  improvements: string[];
  concerns: string[];
  suggestions: string[];
  confidence: number;
  aiMessage: string;
}> {
  const progressSummary = input.progressData.map(p =>
    `Date: ${p.date}, Weight: ${p.weight}kg, Workouts: ${p.workoutsCompleted}, Energy: ${p.energyLevel}/10`
  ).join('\n');

  const prompt = `You are FitMind, an AI fitness analyst. Analyze this member's progress over time.

Member: ${input.memberName || input.memberId}
Progress Data:
${progressSummary}

Analyze:
1. Trends in weight, measurements, workout consistency
2. What's improving
3. What needs attention
4. Specific suggestions for next steps
5. Confidence level (0-100) in your analysis

Return JSON:
{
  "trends": [
    { "metric": "weight", "direction": "down", "change": "-2.5kg in 4 weeks" }
  ],
  "improvements": ["Workout consistency increased", "Energy levels up"],
  "concerns": ["Weight loss plateau"],
  "suggestions": ["Add progressive overload", "Increase protein intake"],
  "confidence": 85,
  "aiMessage": "Personalized message about their progress journey"
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      return parsed;
    }
    throw new Error('Invalid AI response');
  } catch (error: any) {
    return analyzeProgressFallback(input);
  }
}

// ============================================
// INJURY PREVENTION AI
// ============================================

export async function preventInjury(input: InjuryPreventionInput): Promise<{
  risk: 'low' | 'medium' | 'high';
  corrections: Array<{ issue: string; fix: string; priority: string }>;
  warmup: string[];
  alternative?: string;
  aiMessage: string;
}> {
  const prompt = `You are FitMind, an expert in exercise form and injury prevention. Analyze this movement.

Exercise: ${input.exercise}
Reported Form Issue: ${input.form}
${input.memberHistory ? `Member's injury history: ${input.memberHistory.join(', ')}` : ''}

Assess:
1. Risk level (low/medium/high)
2. Specific corrections needed
3. Recommended warmup for this exercise
4. Alternative exercise if needed

Return JSON:
{
  "risk": "medium",
  "corrections": [
    { "issue": "Knees caving inward", "fix": "Push knees out over toes, engage glutes", "priority": "high" }
  ],
  "warmup": ["Foam roll quads", "Hip circles", "Bodyweight squats"],
  "alternative": "If pain occurs, try leg press instead",
  "aiMessage": "Reassuring message about form correction"
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      return parsed;
    }
    throw new Error('Invalid AI response');
  } catch (error: any) {
    return preventInjuryFallback(input);
  }
}

// ============================================
// MOTIVATION AI
// ============================================

export async function motivate(input: MotivationInput): Promise<{
  message: string;
  challenge?: string;
  reward?: string;
  streakMessage?: string;
  tip?: string;
}> {
  const streakContext = input.streak ? `They have a ${input.streak} day streak!` : '';
  const achievements = input.recentAchievements?.length ? `Recent achievements: ${input.recentAchievements.join(', ')}` : '';

  const prompt = `You are FitMind, a motivating fitness AI coach. A member needs encouragement.

Member: ${input.memberName || 'Fitness Enthusiast'}
Current mood: ${input.mood}
${streakContext}
${achievements}

Generate:
1. A motivating message tailored to their mood
2. A fun challenge to boost engagement (optional)
3. A reward for completing the challenge (optional)
4. A streak celebration if applicable
5. A helpful tip for the day

Return JSON:
{
  "message": "Your personalized motivational message",
  "challenge": "7-day plank challenge - 30 seconds today!",
  "reward": "Unlock the 'Iron Will' badge",
  "streakMessage": "You're on fire! 5 days strong!",
  "tip": "Remember: progress > perfection"
}`;

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text);
      return parsed;
    }
    throw new Error('Invalid AI response');
  } catch (error: any) {
    return motivateFallback(input);
  }
}

// ============================================
// FALLBACK FUNCTIONS (Rule-based when AI unavailable)
// ============================================

function generateWorkoutFallback(input: WorkoutRecommendationInput) {
  const goal = input.goal.toLowerCase();
  const level = input.fitness.toLowerCase();

  const exercises = {
    weightLoss: [
      { exercise: 'Burpees', sets: 3, reps: '15', restSeconds: 30, reason: 'Full-body cardio for maximum calorie burn', alternative: 'Jump rope' },
      { exercise: 'Mountain Climbers', sets: 3, reps: '20 each side', restSeconds: 30, reason: 'Core and cardio combined', alternative: 'Plank holds' },
      { exercise: 'Jump Squats', sets: 4, reps: '12', restSeconds: 45, reason: 'Explosive leg power burns fat', alternative: 'Regular squats' },
      { exercise: 'Kettlebell Swings', sets: 3, reps: '15', restSeconds: 30, reason: 'Hip hinge movement burns calories', alternative: 'Dumbbell swings' },
      { exercise: 'Push-ups', sets: 3, reps: '10-12', restSeconds: 45, reason: 'Upper body strength without equipment', alternative: 'Knee push-ups' },
    ],
    muscleGain: [
      { exercise: 'Bench Press', sets: 4, reps: '8-10', restSeconds: 90, reason: 'Primary chest builder for mass', alternative: 'Dumbbell press' },
      { exercise: 'Deadlift', sets: 4, reps: '6-8', restSeconds: 120, reason: 'Total body mass builder', alternative: 'Romanian deadlift' },
      { exercise: 'Pull-ups', sets: 4, reps: '8-10', restSeconds: 90, reason: 'Back width and V-taper', alternative: 'Lat pulldown' },
      { exercise: 'Overhead Press', sets: 3, reps: '8-10', restSeconds: 90, reason: 'Shoulder mass and strength', alternative: 'Arnold press' },
      { exercise: 'Barbell Rows', sets: 4, reps: '8-10', restSeconds: 90, reason: 'Back thickness and thickness', alternative: 'T-bar row' },
    ],
    endurance: [
      { exercise: 'Circuit Training', sets: 3, reps: '30 seconds each', restSeconds: 15, reason: 'Builds cardiovascular endurance', alternative: 'Running' },
      { exercise: 'Battle Ropes', sets: 4, reps: '30 seconds', restSeconds: 30, reason: 'High-intensity cardio blast', alternative: 'Jump rope' },
      { exercise: 'Box Jumps', sets: 3, reps: '12', restSeconds: 45, reason: 'Power and cardio combined', alternative: 'Step ups' },
    ]
  };

  const schedule = {
    weightLoss: [
      { day: 'Day 1 - Full Body', focus: 'Cardio & Strength', duration: '45 min', exercises: ['Burpees', 'Mountain Climbers', 'Jump Squats'] },
      { day: 'Day 2 - Active Recovery', focus: 'Mobility', duration: '30 min', exercises: ['Yoga flows', 'Foam rolling', 'Light walk'] },
      { day: 'Day 3 - HIIT', focus: 'Fat Burn', duration: '40 min', exercises: ['Kettlebell Swings', 'Burpees', 'Push-ups'] },
      { day: 'Day 4 - Rest', focus: 'Recovery', duration: '0 min', exercises: ['Rest day'] },
    ],
    muscleGain: [
      { day: 'Day 1 - Push', focus: 'Chest, Shoulders, Triceps', duration: '60 min', exercises: ['Bench Press', 'Overhead Press', 'Push-ups'] },
      { day: 'Day 2 - Pull', focus: 'Back, Biceps', duration: '60 min', exercises: ['Deadlift', 'Pull-ups', 'Barbell Rows'] },
      { day: 'Day 3 - Legs', focus: 'Quads, Hamstrings, Glutes', duration: '55 min', exercises: ['Jump Squats', 'Lunges', 'Leg Press'] },
      { day: 'Day 4 - Rest', focus: 'Recovery', duration: '0 min', exercises: ['Rest day'] },
    ]
  };

  return {
    workouts: exercises[goal as keyof typeof exercises] || exercises.weightLoss,
    schedule: schedule[goal as keyof typeof schedule] || schedule.weightLoss,
    aiMessage: `Based on your ${input.goal} goal and ${input.fitness} fitness level, I've created a personalized workout plan just for you!`
  };
}

function generateNutritionFallback(input: NutritionPlanInput) {
  const goal = input.goal.toLowerCase();
  const calorieMap: Record<string, number> = {
    weightLoss: 1800,
    muscleGain: 2800,
    maintenance: 2200,
    toning: 2000
  };

  const baseCalories = calorieMap[goal] || 2000;
  const protein = Math.round(input.weight * 2.2);

  const mealTemplates = {
    vegetarian: [
      { name: 'Breakfast', time: '7:00 AM', items: [{ food: 'Paneer omelette with toast', calories: 400, protein: 28, carbs: 30, fat: 18 }] },
      { name: 'Mid-Morning', time: '10:30 AM', items: [{ food: 'Mixed nuts and banana', calories: 250, protein: 8, carbs: 35, fat: 10 }] },
      { name: 'Lunch', time: '1:00 PM', items: [{ food: 'Dal tadka with brown rice and salad', calories: 550, protein: 25, carbs: 70, fat: 12 }] },
      { name: 'Evening Snack', time: '4:00 PM', items: [{ food: 'Greek yogurt with honey', calories: 200, protein: 15, carbs: 20, fat: 5 }] },
      { name: 'Dinner', time: '8:00 PM', items: [{ food: 'Paneer tikka with roti and vegetables', calories: 500, protein: 30, carbs: 45, fat: 18 }] },
    ],
    vegan: [
      { name: 'Breakfast', time: '7:00 AM', items: [{ food: 'Overnight oats with berries', calories: 380, protein: 12, carbs: 60, fat: 10 }] },
      { name: 'Mid-Morning', time: '10:30 AM', items: [{ food: 'Protein shake with almond milk', calories: 280, protein: 25, carbs: 30, fat: 8 }] },
      { name: 'Lunch', time: '1:00 PM', items: [{ food: 'Chickpea curry with quinoa', calories: 520, protein: 22, carbs: 75, fat: 15 }] },
      { name: 'Evening Snack', time: '4:00 PM', items: [{ food: 'Hummus with vegetables', calories: 200, protein: 8, carbs: 25, fat: 8 }] },
      { name: 'Dinner', time: '8:00 PM', items: [{ food: 'Tofu stir-fry with brown rice', calories: 480, protein: 28, carbs: 50, fat: 16 }] },
    ],
    nonVeg: [
      { name: 'Breakfast', time: '7:00 AM', items: [{ food: 'Eggs and toast with avocado', calories: 420, protein: 30, carbs: 28, fat: 22 }] },
      { name: 'Mid-Morning', time: '10:30 AM', items: [{ food: 'Chicken breast sandwich', calories: 350, protein: 35, carbs: 30, fat: 10 }] },
      { name: 'Lunch', time: '1:00 PM', items: [{ food: 'Grilled chicken with brown rice', calories: 550, protein: 45, carbs: 55, fat: 12 }] },
      { name: 'Evening Snack', time: '4:00 PM', items: [{ food: 'Whey protein shake', calories: 180, protein: 30, carbs: 10, fat: 3 }] },
      { name: 'Dinner', time: '8:00 PM', items: [{ food: 'Salmon with sweet potato', calories: 520, protein: 40, carbs: 45, fat: 18 }] },
    ]
  };

  const dietary = input.dietary.toLowerCase();
  const meals = mealTemplates[dietary as keyof typeof mealTemplates] || mealTemplates.nonVeg;

  return {
    calories: baseCalories,
    macros: {
      protein,
      carbs: Math.round((baseCalories * 0.4) / 4),
      fat: Math.round((baseCalories * 0.25) / 9)
    },
    meals,
    restrictions: input.allergies || [],
    aiMessage: `Your ${goal} nutrition plan is ready with ${baseCalories} calories and ${protein}g protein daily!`
  };
}

function analyzeProgressFallback(input: ProgressAnalysisInput) {
  const data = input.progressData;
  if (data.length < 2) {
    return {
      trends: [],
      improvements: ['Started tracking progress - great job!'],
      concerns: ['Need more data points for trend analysis'],
      suggestions: ['Log workouts consistently for 4 weeks'],
      confidence: 30,
      aiMessage: `You've started tracking! Keep logging daily for better insights.`
    };
  }

  const latestWeight = data[data.length - 1].weight;
  const firstWeight = data[0].weight;
  const weightChange = latestWeight - firstWeight;

  return {
    trends: [
      { metric: 'weight', direction: weightChange < 0 ? 'down' : 'up', change: `${Math.abs(weightChange).toFixed(1)}kg over ${data.length} weeks` },
      { metric: 'workouts', direction: 'up', change: `${data[data.length - 1].workoutsCompleted || 0} workouts last week` }
    ],
    improvements: ['Consistency in workout logging', 'Energy levels trending up'],
    concerns: weightChange > 0 ? ['Weight trending up - review nutrition'] : [],
    suggestions: ['Increase protein intake', 'Add progressive overload', 'Prioritize sleep'],
    confidence: 70,
    aiMessage: `Great progress tracking! ${weightChange < 0 ? 'You\'re making progress!' : 'Keep pushing - consistency is key!'}`
  };
}

function preventInjuryFallback(input: InjuryPreventionInput) {
  const riskFactors = ['pain', 'sharp', 'uncomfortable', 'wrong'];
  const hasRisk = riskFactors.some(r => input.form.toLowerCase().includes(r));

  return {
    risk: hasRisk ? 'medium' : 'low',
    corrections: [
      { issue: 'Form breakdown detected', fix: 'Focus on controlled movement, reduce weight if needed', priority: 'high' }
    ],
    warmup: ['Dynamic stretching', 'Light cardio', 'Activation exercises'],
    alternative: 'Try a modified version or alternative exercise',
    aiMessage: `Good catch on your form! Let\'s fix it to prevent injury.`
  };
}

function motivateFallback(input: MotivationInput) {
  const streak = input.streak || 0;

  const messages = {
    low: `I know motivation can be tough right now, but every small step counts. You've got this!`,
    medium: `You're doing great! A little push today leads to big results tomorrow.`,
    high: `You're on fire! Keep that energy going!`
  };

  return {
    message: messages[input.mood as keyof typeof messages] || messages.medium,
    challenge: streak > 3 ? 'Complete 5 workouts this week!' : 'Do one more workout than last week',
    reward: streak > 3 ? 'Earn the "Consistency King/Queen" badge' : 'Treat yourself to new workout gear',
    streakMessage: streak > 0 ? `🔥 ${streak} day streak! You're unstoppable!` : undefined,
    tip: 'Remember: showing up is half the battle.'
  };
}

// ============================================
// HEALTH CHECK
// ============================================

export async function checkAIHealth(): Promise<{ available: boolean; model: string; latency: number }> {
  const start = Date.now();
  try {
    await anthropic.messages.create({
      model: MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Hi' }]
    });
    return { available: true, model: MODEL, latency: Date.now() - start };
  } catch {
    return { available: false, model: MODEL, latency: -1 };
  }
}