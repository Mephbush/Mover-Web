import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Brain,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

interface TrainingPhase {
  name: string;
  description: string;
  duration: number;
  completed: boolean;
  currentProgress: number;
}

interface TrainingSession {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed';
  totalPhases: number;
  completedPhases: number;
  improvementPercent: number;
  optimizations: string[];
}

export function AIBrainTrainer() {
  const [activeTab, setActiveTab] = useState('overview');
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'paused'>('idle');
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [trainingPhases, setTrainingPhases] = useState<TrainingPhase[]>([
    {
      name: 'Data Analysis',
      description: 'Analyze existing experiences and patterns',
      duration: 5000,
      completed: false,
      currentProgress: 0,
    },
    {
      name: 'Pattern Clustering',
      description: 'Group similar patterns for better learning',
      duration: 10000,
      completed: false,
      currentProgress: 0,
    },
    {
      name: 'Knowledge Injection',
      description: 'Feed structured knowledge to improve performance',
      duration: 15000,
      completed: false,
      currentProgress: 0,
    },
    {
      name: 'Anti-Detection Training',
      description: 'Train evasion strategies',
      duration: 8000,
      completed: false,
      currentProgress: 0,
    },
    {
      name: 'Performance Optimization',
      description: 'Optimize execution performance',
      duration: 12000,
      completed: false,
      currentProgress: 0,
    },
    {
      name: 'Validation & Testing',
      description: 'Validate improvements',
      duration: 10000,
      completed: false,
      currentProgress: 0,
    },
  ]);

  const handleStartTraining = async () => {
    setTrainingStatus('training');
    const session: TrainingSession = {
      id: `session_${Date.now()}`,
      name: `Training Session ${trainingSessions.length + 1}`,
      startTime: new Date(),
      status: 'active',
      totalPhases: trainingPhases.length,
      completedPhases: 0,
      improvementPercent: 0,
      optimizations: [],
    };

    setCurrentSession(session);

    // Simulate training phases
    for (let i = 0; i < trainingPhases.length; i++) {
      if (trainingStatus === 'paused') {
        break;
      }

      const duration = trainingPhases[i].duration;
      const startTime = Date.now();

      while (Date.now() - startTime < duration && trainingStatus !== 'paused') {
        const elapsed = Date.now() - startTime;
        const progress = (elapsed / duration) * 100;

        setTrainingPhases(prev => {
          const updated = [...prev];
          updated[i].currentProgress = Math.min(progress, 100);
          return updated;
        });

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (trainingStatus !== 'paused') {
        setTrainingPhases(prev => {
          const updated = [...prev];
          updated[i].completed = true;
          return updated;
        });

        session.completedPhases = i + 1;
        session.optimizations.push(`${trainingPhases[i].name} completed`);
      }
    }

    if (trainingStatus === 'training') {
      session.status = 'completed';
      session.endTime = new Date();
      session.improvementPercent = 15.7; // Simulated improvement
      setTrainingSessions([...trainingSessions, session]);
      setTrainingStatus('idle');
    }
  };

  const handlePauseTraining = () => {
    setTrainingStatus('paused');
  };

  const handleResetTraining = () => {
    setTrainingStatus('idle');
    setCurrentSession(null);
    setTrainingPhases(
      trainingPhases.map(phase => ({
        ...phase,
        completed: false,
        currentProgress: 0,
      }))
    );
  };

  const completedPhases = trainingPhases.filter(p => p.completed).length;
  const overallProgress = (completedPhases / trainingPhases.length) * 100;

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Brain Trainer</h1>
          <p className="text-gray-600 text-sm mt-1">
            Comprehensive training and optimization management
          </p>
        </div>
        <div className="flex gap-2">
          {trainingStatus === 'idle' ? (
            <Button
              onClick={handleStartTraining}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Training
            </Button>
          ) : (
            <>
              <Button onClick={handlePauseTraining} variant="outline" size="lg">
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button onClick={handleResetTraining} variant="destructive" size="lg">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Training Status Alert */}
      {currentSession && (
        <Alert className={`border-l-4 ${
          currentSession.status === 'completed'
            ? 'border-green-500 bg-green-50'
            : 'border-blue-500 bg-blue-50'
        }`}>
          <Brain className="h-4 w-4" />
          <AlertTitle>
            {currentSession.status === 'completed'
              ? '✅ Training Completed!'
              : '🚀 Training in Progress...'}
          </AlertTitle>
          <AlertDescription>
            {currentSession.status === 'completed' ? (
              <div className="space-y-1">
                <p>Performance improved by {currentSession.improvementPercent.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">
                  Session: {currentSession.id}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p>
                  Phase {currentSession.completedPhases + 1} of {currentSession.totalPhases}
                </p>
                <Progress value={overallProgress} />
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Training Overview</TabsTrigger>
          <TabsTrigger value="phases">Training Phases</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold capitalize">{trainingStatus}</p>
                <p className="text-xs text-gray-600 mt-2">
                  {trainingStatus === 'idle'
                    ? 'Ready to start training'
                    : trainingStatus === 'training'
                    ? 'Training is running'
                    : 'Training paused'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{overallProgress.toFixed(0)}%</p>
                <Progress value={overallProgress} className="mt-2 h-2" />
                <p className="text-xs text-gray-600 mt-2">
                  {completedPhases}/{trainingPhases.length} phases completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {currentSession?.improvementPercent.toFixed(1) || '0'}%
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {currentSession?.status === 'completed'
                    ? 'Last session improvement'
                    : 'No improvement yet'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Training Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Training Options</CardTitle>
              <CardDescription>
                Run specific training scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start" disabled={trainingStatus !== 'idle'}>
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Optimize (5min)
                </Button>
                <Button variant="outline" className="justify-start" disabled={trainingStatus !== 'idle'}>
                  <Brain className="w-4 h-4 mr-2" />
                  Full Training (60min)
                </Button>
                <Button variant="outline" className="justify-start" disabled={trainingStatus !== 'idle'}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Performance Boost
                </Button>
                <Button variant="outline" className="justify-start" disabled={trainingStatus !== 'idle'}>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Fix Weak Points
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phases Tab */}
        <TabsContent value="phases" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Phases</CardTitle>
              <CardDescription>
                Detailed view of each training phase and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4 pr-4">
                  {trainingPhases.map((phase, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold flex items-center gap-2">
                            {phase.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                            {phase.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {phase.description}
                          </p>
                        </div>
                        {phase.completed && (
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        )}
                      </div>

                      {trainingStatus === 'training' && !phase.completed && phase.currentProgress > 0 && (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{phase.currentProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={phase.currentProgress} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Session History</CardTitle>
              <CardDescription>
                All completed training sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {trainingSessions.length === 0 ? (
                <p className="text-center text-gray-600 py-8">
                  No training sessions yet. Start a training session to see history.
                </p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {trainingSessions.map((session) => (
                      <div
                        key={session.id}
                        className="border rounded-lg p-4 space-y-2 bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{session.name}</h4>
                            <p className="text-xs text-gray-600">
                              {session.startTime.toLocaleString()}
                            </p>
                          </div>
                          <Badge
                            className={
                              session.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }
                          >
                            {session.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t">
                          <div>
                            <span className="text-gray-600">Phases: </span>
                            <span className="font-medium">
                              {session.completedPhases}/{session.totalPhases}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Improvement: </span>
                            <span className="font-medium text-green-600">
                              +{session.improvementPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Optimizations: </span>
                            <span className="font-medium">{session.optimizations.length}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AIBrainTrainer;
