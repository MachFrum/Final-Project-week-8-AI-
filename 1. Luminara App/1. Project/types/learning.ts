export interface ProblemEntry {
  id: string;
  title: string;
  description: string;
  type: 'text' | 'image' | 'voice';
  content: string; // text content, image URL, or voice transcript
  imageUrl?: string;
  voiceUrl?: string;
  solution: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solvedAt: string;
  timeSpent: number; // in minutes
  tags: string[];
}

export interface InputMethod {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  type: 'text' | 'voice' | 'camera';
}