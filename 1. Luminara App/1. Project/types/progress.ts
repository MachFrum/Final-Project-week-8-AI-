export interface ProgressStats {
  problemsSolved: number;
  hoursLearned: number;
  dayStreak: number;
  totalPoints: number;
  level: number;
  rank: string;
}

export interface DailyActivity {
  date: string;
  problems: number;
  minutes: number;
  completed: boolean;
}

export interface SubjectProgress {
  id: string;
  name: string;
  progress: number;
  color: string;
  problems: number;
  totalProblems: number;
  icon: string;
  lastActivity: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  maxProgress?: number;
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  deadline: string;
  type: 'daily' | 'weekly' | 'monthly';
  icon: string;
  color: string;
}

export interface ProgressScreenData {
  stats: ProgressStats;
  activities: DailyActivity[];
  subjects: SubjectProgress[];
  achievements: Achievement[];
  goals: LearningGoal[];
}