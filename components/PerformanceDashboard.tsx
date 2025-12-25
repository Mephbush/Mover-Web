import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Gauge,
  BarChart3,
  LineChart,
  Activity,
  Globe,
  TaskSquare,
  RefreshCw,
  Download,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface PerformanceMetricsData {
  totalExperiences: number;
  successfulExperiences: number;
  failedExperiences: number;
  overallSuccessRate: number;
  averageExecutionTime: number;
  averageRetryCount: number;
  websiteMetrics: Map<string, any>;
  taskTypeMetrics: Map<string, any>;
  topErrors: any[];
  learningVelocity: number;
  recentSuccessRate: number;
  lastUpdated: Date;
}

interface PerformanceReport {
  summary: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
}

export function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [metrics, setMetrics] = useState<PerformanceMetricsData | null>(null);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  useEffect(() => {
    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadPerformanceData = async () => {
    setIsLoading(true);
    try {
      // Import AIBrainIntegration locally to avoid bundle issues
      const { AIBrainIntegration } = await import('../utils/ai-brain-integration');
      
      // Note: In a real scenario, you'd get the userId from auth context
      const userId = localStorage.getItem('userId') || 'anonymous';
      const brain = new AIBrainIntegration();
      
      // This would work if the brain is already initialized
      const performanceMetrics = brain.getPerformanceMetrics();
      const performanceReport = brain.getPerformanceReport();
      
      if (performanceMetrics) {
        setMetrics(performanceMetrics);
      }
      
      if (performanceReport) {
        setReport(performanceReport);
      }
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuccessRateColor = (rate: number): string => {
    if (rate >= 0.9) return 'text-green-600';
    if (rate >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateBadge = (rate: number): string => {
    if (rate >= 0.9) return 'bg-green-100 text-green-800';
    if (rate >= 0.7) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getLearningVelocityColor = (velocity: number): string => {
    if (velocity > 10) return 'text-green-600';
    if (velocity > 0) return 'text-blue-600';
    return 'text-orange-600';
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const websiteMetricsArray = metrics?.websiteMetrics 
    ? Array.from(metrics.websiteMetrics.values())
    : [];

  const taskTypeMetricsArray = metrics?.taskTypeMetrics 
    ? Array.from(metrics.taskTypeMetrics.values())
    : [];

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Performance Dashboard</h1>
          <p className="text-gray-600 text-sm mt-1">
            AI Brain System Metrics & Analytics
          </p>
        </div>
        <Button 
          onClick={loadPerformanceData} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Performance Report Alert */}
      {report && (
        <Alert className={`border-l-4 ${
          report.concerns.length === 0 ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'
        }`}>
          <AlertTitle className="flex items-center gap-2">
            {report.concerns.length === 0 ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            )}
            System Status
          </AlertTitle>
          <AlertDescription>
            <p className="font-medium mb-2">{report.summary}</p>
            {report.highlights.length > 0 && (
              <div className="mb-2">
                {report.highlights.map((h, i) => (
                  <p key={i} className="text-sm">{h}</p>
                ))}
              </div>
            )}
            {report.concerns.length > 0 && (
              <div>
                {report.concerns.map((c, i) => (
                  <p key={i} className="text-sm text-orange-700">{c}</p>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="websites">Websites</TabsTrigger>
          <TabsTrigger value="tasks">Task Types</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {metrics && (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Success Rate */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Success Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className={`text-2xl font-bold ${getSuccessRateColor(metrics.overallSuccessRate)}`}>
                        {(metrics.overallSuccessRate * 100).toFixed(1)}%
                      </div>
                      <Progress 
                        value={metrics.overallSuccessRate * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-600">
                        {metrics.successfulExperiences} of {metrics.totalExperiences} successful
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Learning Velocity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Learning Velocity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className={`text-2xl font-bold ${getLearningVelocityColor(metrics.learningVelocity)}`}>
                        {metrics.learningVelocity > 0 ? '+' : ''}{metrics.learningVelocity.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-600">
                        {metrics.learningVelocity > 0 ? 'Improving' : 'Declining'} trend
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Avg Execution Time */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Avg Execution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {formatTime(metrics.averageExecutionTime)}
                      </div>
                      <p className="text-xs text-gray-600">
                        Avg per task
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Experiences */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      Total Tasks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {metrics.totalExperiences}
                      </div>
                      <p className="text-xs text-gray-600">
                        {metrics.failedExperiences} failed
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Success Rate vs Overall */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Success Rate Trend</CardTitle>
                  <CardDescription>Recent vs Overall Performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Overall Success Rate</span>
                        <span className="text-sm font-bold">{(metrics.overallSuccessRate * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.overallSuccessRate * 100} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Recent (Last 100)</span>
                        <span className="text-sm font-bold">{(metrics.recentSuccessRate * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.recentSuccessRate * 100} />
                    </div>
                    <p className="text-xs text-gray-600 pt-2">
                      {metrics.recentSuccessRate > metrics.overallSuccessRate ? (
                        <span className="text-green-600">↑ Performance improving</span>
                      ) : (
                        <span className="text-orange-600">↓ Performance declining</span>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {report?.recommendations && report.recommendations.length > 0 && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {report.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-blue-600 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Websites Tab */}
        <TabsContent value="websites" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Website Performance
              </CardTitle>
              <CardDescription>
                Success rates and metrics by website
              </CardDescription>
            </CardHeader>
            <CardContent>
              {websiteMetricsArray.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {websiteMetricsArray.map((metric, i) => (
                      <Card key={i} className="bg-gray-50">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium truncate">{metric.website}</h4>
                                <p className="text-xs text-gray-600">
                                  {metric.totalAttempts} attempts
                                </p>
                              </div>
                              <Badge className={getSuccessRateBadge(metric.successRate)}>
                                {(metric.successRate * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <Progress value={metric.successRate * 100} className="h-2" />
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600">Avg Time: </span>
                                <span className="font-medium">{formatTime(metric.averageExecutionTime)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Successful: </span>
                                <span className="font-medium">{metric.successfulAttempts}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Trend: </span>
                                <span className={`font-medium ${metric.trendingImprovement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {metric.trendingImprovement > 0 ? '+' : ''}{metric.trendingImprovement.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            {metric.topErrors && metric.topErrors.length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-gray-600 mb-1">Common Errors:</p>
                                <div className="text-xs space-y-1">
                                  {metric.topErrors.slice(0, 2).map((err, j) => (
                                    <p key={j} className="text-gray-700">• {err}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-gray-600 py-8">No website data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Task Types Tab */}
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TaskSquare className="w-4 h-4" />
                Task Type Performance
              </CardTitle>
              <CardDescription>
                Success rates and metrics by task type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taskTypeMetricsArray.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {taskTypeMetricsArray.map((metric, i) => (
                      <Card key={i} className="bg-gray-50">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{metric.taskType}</h4>
                                <p className="text-xs text-gray-600">
                                  {metric.totalAttempts} attempts
                                </p>
                              </div>
                              <Badge className={getSuccessRateBadge(metric.successRate)}>
                                {(metric.successRate * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <Progress value={metric.successRate * 100} className="h-2" />
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <span className="text-gray-600">Avg Time: </span>
                                <span className="font-medium">{formatTime(metric.averageExecutionTime)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Avg Retries: </span>
                                <span className="font-medium">{metric.averageRetryCount.toFixed(1)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Improvement: </span>
                                <span className={`font-medium ${metric.improvement > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {metric.improvement > 0 ? '+' : ''}{metric.improvement.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            {metric.topFailingWebsites && metric.topFailingWebsites.length > 0 && (
                              <div className="pt-2 border-t">
                                <p className="text-xs font-medium text-gray-600 mb-1">Top Failing Sites:</p>
                                <div className="text-xs space-y-1">
                                  {metric.topFailingWebsites.slice(0, 2).map((site, j) => (
                                    <p key={j} className="text-gray-700">• {site.website} ({site.failures} failures)</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-gray-600 py-8">No task type data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Error Analysis
              </CardTitle>
              <CardDescription>
                Most frequent errors and affected systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics?.topErrors && metrics.topErrors.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 pr-4">
                    {metrics.topErrors.map((error, i) => (
                      <Card key={i} className="border-red-200 bg-red-50">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-red-900 break-words">{error.error}</h4>
                                <p className="text-sm text-red-700 mt-1">
                                  Occurred {error.count} times
                                </p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Last Occurred:</p>
                                <p className="text-sm">
                                  {new Date(error.lastOccurred).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-600 mb-1">Success Rate When Error Occurs:</p>
                                <Progress 
                                  value={error.successRateWhenErrorOccurs * 100} 
                                  className="h-2"
                                />
                                <p className="text-xs mt-1">
                                  {(error.successRateWhenErrorOccurs * 100).toFixed(1)}%
                                </p>
                              </div>
                              {error.affectedWebsites && error.affectedWebsites.length > 0 && (
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Affected Websites:</p>
                                  <div className="text-xs space-y-1">
                                    {error.affectedWebsites.slice(0, 3).map((site, j) => (
                                      <p key={j} className="text-gray-700">• {site}</p>
                                    ))}
                                    {error.affectedWebsites.length > 3 && (
                                      <p className="text-gray-700">• +{error.affectedWebsites.length - 3} more</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-center text-gray-600 py-8">No error data available yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      {metrics && (
        <div className="text-xs text-gray-600 text-center pt-4">
          Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default PerformanceDashboard;
