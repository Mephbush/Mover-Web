import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Upload,
  Plus,
  Copy,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Brain,
  RefreshCw,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';

interface FeedingItem {
  id: string;
  category: 'selector' | 'workflow' | 'pattern' | 'solution' | 'insight';
  domain: string;
  content: any;
  tags: string[];
  confidence: number;
  successRate?: number;
}

interface ValidationStatus {
  valid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
}

export function DataFeedingInterface() {
  const [activeTab, setActiveTab] = useState('manual');
  const [feedingItems, setFeedingItems] = useState<FeedingItem[]>([]);
  const [validationStatus, setValidationStatus] = useState<Map<string, ValidationStatus>>(new Map());
  const [processingStatus, setProcessingStatus] = useState<{
    isProcessing: boolean;
    progress: number;
    message: string;
  }>({ isProcessing: false, progress: 0, message: '' });
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for manual entry
  const [formData, setFormData] = useState({
    category: 'selector' as FeedingItem['category'],
    domain: '',
    content: '',
    tags: '',
    confidence: 0.8,
    successRate: 0.85,
  });

  const generateItemId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const validateItem = (item: FeedingItem): ValidationStatus => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 1.0;

    // Check required fields
    if (!item.category) {
      errors.push('Category is required');
      qualityScore -= 0.2;
    }

    if (!item.domain) {
      errors.push('Domain is required');
      qualityScore -= 0.2;
    }

    if (!item.content) {
      errors.push('Content is required');
      qualityScore -= 0.2;
    }

    if (!item.tags || item.tags.length === 0) {
      warnings.push('No tags provided');
      qualityScore -= 0.1;
    }

    // Check confidence
    if (item.confidence < 0.3) {
      warnings.push('Very low confidence');
      qualityScore -= 0.15;
    }

    // Check content format by category
    if (item.category === 'selector') {
      if (typeof item.content !== 'string') {
        errors.push('Selector content must be a string');
        qualityScore -= 0.2;
      }
    } else if (item.category === 'workflow') {
      if (!Array.isArray(item.content)) {
        errors.push('Workflow content must be an array');
        qualityScore -= 0.2;
      }
    }

    qualityScore = Math.max(0, Math.min(1, qualityScore));

    return {
      valid: errors.length === 0 && qualityScore >= 0.5,
      errors,
      warnings,
      qualityScore,
    };
  };

  const handleAddItem = () => {
    if (!formData.domain || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    const newItem: FeedingItem = {
      id: generateItemId(),
      category: formData.category,
      domain: formData.domain,
      content: formData.category === 'workflow' ? JSON.parse(formData.content) : formData.content,
      tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
      confidence: formData.confidence,
      successRate: formData.successRate,
    };

    const validation = validateItem(newItem);
    validationStatus.set(newItem.id, validation);

    setFeedingItems([...feedingItems, newItem]);
    setValidationStatus(new Map(validationStatus));

    // Reset form
    setFormData({
      category: 'selector',
      domain: '',
      content: '',
      tags: '',
      confidence: 0.8,
      successRate: 0.85,
    });
  };

  const handleRemoveItem = (id: string) => {
    setFeedingItems(feedingItems.filter(item => item.id !== id));
    validationStatus.delete(id);
    setValidationStatus(new Map(validationStatus));
  };

  const handleUploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const items: FeedingItem[] = Array.isArray(data) ? data : [data];

      const newItems: FeedingItem[] = [];
      for (const item of items) {
        const processedItem: FeedingItem = {
          ...item,
          id: generateItemId(),
        };
        const validation = validateItem(processedItem);
        validationStatus.set(processedItem.id, validation);
        newItems.push(processedItem);
      }

      setFeedingItems([...feedingItems, ...newItems]);
      setValidationStatus(new Map(validationStatus));

      alert(`Successfully imported ${newItems.length} items`);
    } catch (error) {
      alert('Failed to parse file. Please check the JSON format.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessBatch = async () => {
    if (feedingItems.length === 0) {
      alert('No items to process');
      return;
    }

    setProcessingStatus({ isProcessing: true, progress: 0, message: 'Validating items...' });

    try {
      // Simulate processing
      for (let i = 0; i < feedingItems.length; i++) {
        setProcessingStatus({
          isProcessing: true,
          progress: ((i + 1) / feedingItems.length) * 100,
          message: `Processing item ${i + 1} of ${feedingItems.length}...`,
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setProcessingStatus({
        isProcessing: true,
        progress: 100,
        message: 'Processing complete!',
      });

      setTimeout(() => {
        setProcessingStatus({ isProcessing: false, progress: 0, message: '' });
        setFeedingItems([]);
        alert('Batch processed successfully!');
      }, 1000);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      setProcessingStatus({ isProcessing: false, progress: 0, message: '' });
    }
  };

  const handleDownloadTemplate = (category: FeedingItem['category']) => {
    const templates = {
      selector: {
        category: 'selector',
        domain: 'example.com',
        content: '#login-button, input[name="username"]',
        tags: ['login', 'form', 'selector'],
        confidence: 0.9,
        successRate: 0.95,
      },
      workflow: {
        category: 'workflow',
        domain: 'example.com',
        content: [
          { action: 'navigate', url: 'https://example.com' },
          { action: 'click', selector: '#login' },
          { action: 'type', selector: 'input[name="username"]', text: 'user@example.com' },
        ],
        tags: ['workflow', 'login'],
        confidence: 0.85,
      },
      pattern: {
        category: 'pattern',
        domain: 'example.com',
        content: { pattern: 'button[class*="primary"]', type: 'CSS selector' },
        tags: ['pattern', 'button'],
        confidence: 0.8,
      },
      solution: {
        category: 'solution',
        domain: 'example.com',
        content: 'Handle CAPTCHA by waiting for iframe to load',
        tags: ['solution', 'captcha'],
        confidence: 0.75,
      },
      insight: {
        category: 'insight',
        domain: 'example.com',
        content: 'Login page requires JavaScript enabled',
        tags: ['insight', 'requirement'],
        confidence: 0.9,
      },
    };

    const template = templates[category];
    const dataStr = JSON.stringify([template], null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `template-${category}.json`;
    link.click();
  };

  const getValidationBadge = (itemId: string) => {
    const status = validationStatus.get(itemId);
    if (!status) return null;

    if (status.valid) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Valid
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Invalid
        </Badge>
      );
    }
  };

  const validItemsCount = feedingItems.filter(item => validationStatus.get(item.id)?.valid).length;
  const invalidItemsCount = feedingItems.length - validItemsCount;

  return (
    <div className="w-full space-y-4 p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Feeding Interface</h1>
          <p className="text-gray-600 text-sm mt-1">
            Inject structured knowledge into the AI Brain system
          </p>
        </div>
        <Button 
          onClick={() => setFeedingItems([])} 
          variant="outline"
          size="sm"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* Summary Stats */}
      {feedingItems.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{feedingItems.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid</p>
                <p className="text-2xl font-bold text-green-600">{validItemsCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Invalid</p>
                <p className="text-2xl font-bold text-red-600">{invalidItemsCount}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Validity Rate</p>
                <p className="text-2xl font-bold">
                  {feedingItems.length > 0 
                    ? ((validItemsCount / feedingItems.length) * 100).toFixed(0) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {processingStatus.isProcessing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertTitle>{processingStatus.message}</AlertTitle>
          <AlertDescription>
            <Progress value={processingStatus.progress} className="mt-2" />
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="upload">Upload File</TabsTrigger>
          <TabsTrigger value="review">Review Items</TabsTrigger>
        </TabsList>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Add Knowledge Item
              </CardTitle>
              <CardDescription>
                Manually create and add a knowledge item to the feeding batch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="selector">Selector</option>
                  <option value="workflow">Workflow</option>
                  <option value="pattern">Pattern</option>
                  <option value="solution">Solution</option>
                  <option value="insight">Insight</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Selector: CSS selectors, Workflow: Step sequences, Pattern: Detected patterns, Solution: Problem solutions, Insight: System insights
                </p>
              </div>

              {/* Domain */}
              <div>
                <label className="block text-sm font-medium mb-2">Domain *</label>
                <input
                  type="text"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  placeholder="e.g., example.com, linkedin.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder={formData.category === 'workflow' ? 'Enter JSON array of workflow steps' : 'Enter content'}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g., login, form, automation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Confidence */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confidence: {formData.confidence.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.confidence}
                  onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">How confident you are about this data (0-1)</p>
              </div>

              {/* Success Rate */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Success Rate: {formData.successRate.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={formData.successRate}
                  onChange={(e) => setFormData({ ...formData, successRate: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">Expected success rate (0-1)</p>
              </div>

              {/* Download Templates */}
              <div className="pt-2 border-t">
                <p className="text-sm font-medium mb-2">Download Templates:</p>
                <div className="flex flex-wrap gap-2">
                  {(['selector', 'workflow', 'pattern', 'solution', 'insight'] as const).map((cat) => (
                    <Button
                      key={cat}
                      onClick={() => handleDownloadTemplate(cat)}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Add Button */}
              <Button onClick={handleAddItem} className="w-full" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Add to Batch
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload JSON File
              </CardTitle>
              <CardDescription>
                Upload a JSON file with multiple knowledge items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleUploadFile}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
              <p className="text-sm text-gray-600">
                Expected format: Array of objects with category, domain, content, tags, confidence, and optional successRate
              </p>

              {/* Example JSON */}
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm font-medium mb-2">Example JSON:</p>
                <pre className="text-xs overflow-auto max-h-[200px] text-gray-700">
{`[
  {
    "category": "selector",
    "domain": "example.com",
    "content": "#login-btn",
    "tags": ["login", "button"],
    "confidence": 0.9,
    "successRate": 0.95
  },
  {
    "category": "workflow",
    "domain": "example.com",
    "content": [...],
    "tags": ["workflow"],
    "confidence": 0.85
  }
]`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-4 mt-4">
          {feedingItems.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">No items in batch yet</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Items in Batch ({feedingItems.length})</h3>
                <Button 
                  onClick={handleProcessBatch} 
                  disabled={validItemsCount === 0 || processingStatus.isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Process Batch
                </Button>
              </div>

              <ScrollArea className="h-[400px] border rounded-lg">
                <div className="space-y-3 p-4">
                  {feedingItems.map((item) => {
                    const status = validationStatus.get(item.id);
                    const isExpanded = expandedItemId === item.id;

                    return (
                      <Card key={item.id} className={status?.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{item.category}</Badge>
                                <span className="text-sm font-medium">{item.domain}</span>
                                {status && getValidationBadge(item.id)}
                              </div>
                              <p className="text-sm text-gray-700 break-words">
                                {typeof item.content === 'string' ? item.content : JSON.stringify(item.content).substring(0, 50)}...
                              </p>
                              <div className="flex gap-2 mt-2">
                                {item.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              {status && (
                                <div className="mt-2">
                                  <p className="text-xs text-gray-600">Quality: {(status.qualityScore * 100).toFixed(0)}%</p>
                                  {status.errors.length > 0 && (
                                    <div className="text-xs text-red-700 mt-1">
                                      {status.errors.map((err, i) => (
                                        <p key={i}>• {err}</p>
                                      ))}
                                    </div>
                                  )}
                                  {status.warnings.length > 0 && (
                                    <div className="text-xs text-yellow-700 mt-1">
                                      {status.warnings.map((warn, i) => (
                                        <p key={i}>• {warn}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                variant="ghost"
                                size="sm"
                              >
                                {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                onClick={() => handleRemoveItem(item.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t bg-white rounded">
                              <pre className="text-xs overflow-auto max-h-[150px]">
                                {JSON.stringify(item, null, 2)}
                              </pre>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default DataFeedingInterface;
