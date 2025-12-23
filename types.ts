/**
 * Shared type definitions for the application
 * These types are used across multiple components and contexts
 */

export type Task = {
  id: string;
  name: string;
  description: string;
  type: 'scraping' | 'login' | 'registration' | 'testing' | 'screenshot' | 'custom';
  status: 'idle' | 'running' | 'completed' | 'failed';
  script: string;
  targetUrl: string;
  schedule?: string;
  createdAt: Date;
  lastRun?: Date;
  metadata?: {
    source?: 'visual-builder' | 'advanced-builder' | 'smart-builder' | 'task-editor' | 'template';
    stepsData?: string; // JSON string of steps for visual builders
    [key: string]: any;
  };
};

export type ExecutionLog = {
  id: string;
  taskId: string;
  taskName: string;
  status: 'success' | 'failed' | 'running';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  logs: string[];
  screenshot?: string;
  data?: any;
};
