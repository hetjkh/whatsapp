"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Send,
  Loader2,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  File,
  Plus,
  Minus,
  Calendar,
  FileSpreadsheet,
  Link2,
  Shield,
  Users,
  Check,
  Search
} from 'lucide-react';

type NumberEntry = {
  number: string;
  repeatCount: number;
  scheduleTime?: string;
};

type Group = {
  id: string;
  name: string;
  participantsCount: number;
};

export default function MessagingPage() {
  const [message, setMessage] = useState('');
  const [numbers, setNumbers] = useState<NumberEntry[]>([]);
  const [currentNumber, setCurrentNumber] = useState('');
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageHistory, setMessageHistory] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [sheetUrl, setSheetUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [importMethod, setImportMethod] = useState<'none' | 'csv' | 'sheets'>('none');
  const [isSafeMode, setIsSafeMode] = useState(false);
  const [currentSendingIndex, setCurrentSendingIndex] = useState(-1);
  const [isSendingInProgress, setIsSendingInProgress] = useState(false);

  // Group messaging states
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [groupMessageHistory, setGroupMessageHistory] = useState<any[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState('');

  useEffect(() => {
    const selectedNumbers = localStorage.getItem('selectedNumbers');
    if (selectedNumbers) {
      const numbersList = selectedNumbers.split('\n')
        .map(num => ({ number: num.trim(), repeatCount: 1 }))
        .filter(entry => entry.number);
      setNumbers(prev => [...prev, ...numbersList]);
      localStorage.removeItem('selectedNumbers');
    }
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setIsLoadingGroups(true);
      const token = localStorage.getItem('token');
      const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/whatsapp-groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data.status) {
        setGroups(data.data.groups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setIsLoadingGroups(false);
    }
  };
  // Add this function to filter groups based on search query
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );
  const isValidNumber = (num: string) => {
    return /^\d+$/.test(num.trim());
  };

  const isDuplicateNumber = (num: string) => {
    return numbers.some(entry => entry.number === num.trim());
  };

  const formatPhoneNumber = (number: string) => {
    const cleaned = number.replace(/\D/g, '');
    
    if (cleaned.length >= 12) {
      return '+' + cleaned;
    }
    
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    
    return '+' + cleaned;
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCurrentNumber(value);
    
    if (value.includes('\n')) {
      const newNumbers = value
        .split('\n')
        .map(num => num.trim())
        .filter(num => {
          if (!num) return false;
          if (!isValidNumber(num)) return false;
          if (isDuplicateNumber(num)) return false;
          return true;
        })
        .map(num => ({ number: num, repeatCount: 1 }));
      
      setNumbers(prev => [...prev, ...newNumbers]);
      setCurrentNumber('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const num = currentNumber.trim();
      
      if (num) {
        if (!isValidNumber(num)) {
          setStatus('Please enter only numeric characters');
          return;
        }
        
        if (isDuplicateNumber(num)) {
          setStatus('This number has already been added');
          return;
        }
        
        setNumbers(prev => [...prev, { number: num, repeatCount: 1 }]);
        setCurrentNumber('');
        setStatus('');
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        setStatus('Image size should be less than 16MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSelectedVideo(null);
      setVideoPreview(null);
      setSelectedDocument(null);
      setDocumentName(null);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setStatus('Video size should be less than 16MB');
        return;
      }
      setSelectedVideo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedDocument(null);
      setDocumentName(null);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        setStatus('Document size should be less than 16MB');
        return;
      }
      setSelectedDocument(file);
      setDocumentName(file.name);
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedVideo(null);
      setVideoPreview(null);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.toLowerCase().split('.').pop();
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      setStatus('Please upload a CSV or Excel file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/import-numbers-csv', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.status) {
        const formattedNumbers = data.data.numbers.map((entry: any) => ({
          number: formatPhoneNumber(entry.number),
          repeatCount: 1,
          scheduleTime: undefined
        }));
        
        setNumbers(prev => [...prev, ...formattedNumbers]);
        setStatus(`Successfully imported ${data.data.total} numbers from ${fileExtension?.toUpperCase()}`);
        setCsvFile(file);
      } else {
        setStatus('Failed to import numbers: ' + data.message);
      }
    } catch (error) {
      setStatus('Error importing file. Please try again.');
    }
  };

  const handleSheetsImport = async () => {
    if (!sheetsUrl) {
      setStatus('Please enter a Google Sheets URL');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/import-numbers-sheets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sheetUrl: sheetsUrl })
      });

      const data = await response.json();
      
      if (data.status) {
        setNumbers(prev => [...prev, ...data.data.numbers]);
        setStatus(`Successfully imported ${data.data.total} numbers from Google Sheets`);
      } else {
        setStatus('Failed to import numbers: ' + data.message);
      }
    } catch (error) {
      setStatus('Error importing from Google Sheets. Please try again.');
    }
  };

  const handleIncreaseRepeat = (index: number) => {
    setNumbers(prev => prev.map((entry, i) => 
      i === index ? { ...entry, repeatCount: (entry.repeatCount || 1) + 1 } : entry
    ));
  };

  const handleDecreaseRepeat = (index: number) => {
    setNumbers(prev => prev.map((entry, i) => 
      i === index ? { ...entry, repeatCount: Math.max((entry.repeatCount || 1) - 1, 1) } : entry
    ));
  };

  const handleRemoveNumber = (index: number) => {
    setNumbers(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNumber = () => {
    if (!currentNumber) return;
    
    const formattedNumber = formatPhoneNumber(currentNumber);
    setNumbers(prev => [...prev, { 
      number: formattedNumber,
      repeatCount: 1,
      scheduleTime: undefined
    }]);
    setCurrentNumber('');
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => 
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSendToGroups = async () => {
    if (!message && !selectedImage && !selectedVideo && !selectedDocument) {
      setStatus('Please provide a message or select media/document');
      return;
    }
    if (selectedGroups.length === 0) {
      setStatus('Please select at least one group');
      return;
    }

    setIsSending(true);
    setStatus('Sending messages to groups...');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('message', message);
      formData.append('groups', JSON.stringify(selectedGroups));

      if (selectedImage) {
        formData.append('media', selectedImage);
        formData.append('mediaType', 'image');
      } else if (selectedVideo) {
        formData.append('media', selectedVideo);
        formData.append('mediaType', 'video');
      } else if (selectedDocument) {
        formData.append('media', selectedDocument);
        formData.append('mediaType', 'document');
      }

      const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/send-group-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.status) {
        setGroupMessageHistory(prev => [...data.data.results, ...prev]);
        setMessage('');
        setSelectedImage(null);
        setSelectedVideo(null);
        setSelectedDocument(null);
        setImagePreview(null);
        setVideoPreview(null);
        setDocumentName(null);
        setSelectedGroups([]);
        setStatus(`Messages sent successfully to ${data.data.summary.success} groups`);
      }
    } catch (error) {
      setStatus('Error sending messages to groups. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  const sendMessageToSingleNumber = async (numberObj: NumberEntry) => {
    try {
      const token = localStorage.getItem('token');
      let successCount = 0;
  
      // Send message multiple times based on repeatCount
      for (let i = 0; i < (numberObj.repeatCount || 1); i++) {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('numbers', JSON.stringify([{ ...numberObj, repeatCount: 1 }]));
  
        if (selectedImage) {
          formData.append('media', selectedImage);
          formData.append('mediaType', 'image');
        } else if (selectedVideo) {
          formData.append('media', selectedVideo);
          formData.append('mediaType', 'video');
        } else if (selectedDocument) {
          formData.append('media', selectedDocument);
          formData.append('mediaType', 'document');
        }
  
        const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/send-bulk-message', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
  
        const data = await response.json();
        if (data.status) {
          setMessageHistory(prev => [...data.data.results, ...prev]);
          successCount++;
        }
  
        // Add delay between repeated messages
        if (i < numberObj.repeatCount - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
  
      return successCount === (numberObj.repeatCount || 1);
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };
  
  const handleSendMessages = async () => {
    if (!message && !selectedImage && !selectedVideo && !selectedDocument) {
      setStatus('Please provide a message or select media/document');
      return;
    }
    if (numbers.length === 0) {
      setStatus('Please add recipient numbers');
      return;
    }
  
    if (isSafeMode) {
      setIsSendingInProgress(true);
      setCurrentSendingIndex(0);
  
      for (let i = 0; i < numbers.length; i++) {
        setCurrentSendingIndex(i);
        const success = await sendMessageToSingleNumber(numbers[i]);
        
        if (success) {
          setNumbers(prev => prev.filter((_, index) => index !== i));
          
          if (i < numbers.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 12000));
          }
        }
      }
  
      setCurrentSendingIndex(-1);
      setIsSendingInProgress(false);
      setStatus('All messages sent in safe mode');
      setNumbers([]);
    } else {
      setIsSending(true);
      setStatus('Sending messages...');
  
      try {
        const token = localStorage.getItem('token');
        
        // Create an array with repeated numbers based on repeatCount
        const expandedNumbers = numbers.flatMap(number => {
          const repeatedNumbers = Array(number.repeatCount || 1).fill({
            number: number.number,
            scheduledTime: scheduleDate && scheduleTime ? 
              new Date(`${scheduleDate}T${scheduleTime}`).toISOString() : 
              null
          });
          return repeatedNumbers;
        });
  
        const formData = new FormData();
        formData.append('message', message);
        formData.append('numbers', JSON.stringify(expandedNumbers));
  
        if (selectedImage) {
          formData.append('media', selectedImage);
          formData.append('mediaType', 'image');
        } else if (selectedVideo) {
          formData.append('media', selectedVideo);
          formData.append('mediaType', 'video');
        } else if (selectedDocument) {
          formData.append('media', selectedDocument);
          formData.append('mediaType', 'document');
        }
  
        // Add scheduling information
        if (scheduleDate && scheduleTime) {
          formData.append('isScheduled', 'true');
          formData.append('scheduleDate', scheduleDate);
          formData.append('scheduleTime', scheduleTime);
        }
  
        const response = await fetch('https://bulkwhasapp-backend.onrender.com/api/send-bulk-message', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
  
        const data = await response.json();
        if (data.status) {
          const newHistory = data.data.results.map((result: any) => ({
            number: result.number,
            status: result.status === "success",
            message: result.message,
            time: new Date().toISOString(),
            scheduledTime: result.scheduledTime
          }));
          
          setMessageHistory(prev => [...newHistory, ...prev]);
          setNumbers([]);
          setMessage('');
          setSelectedImage(null);
          setSelectedVideo(null);
          setSelectedDocument(null);
          setImagePreview(null);
          setVideoPreview(null);
          setDocumentName(null);
          setScheduleDate('');
          setScheduleTime('');
          setStatus(`Messages ${scheduleDate && scheduleTime ? 'scheduled' : 'sent'} successfully: ${data.data.summary.success}/${data.data.summary.total}`);
        } else {
          setStatus('Failed to send messages: ' + data.message);
        }
      } catch (error) {
        console.error('Error sending messages:', error);
        setStatus('Error sending messages. Please try again.');
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleSetScheduleTime = (index: number, time: string) => {
    setNumbers(prev => prev.map((entry, i) => 
      i === index ? { ...entry, scheduleTime: time } : entry
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-200">Messaging</h1>
          <p className="text-zinc-400 mt-2">Send messages to contacts or groups</p>
        </div>
        <div className="flex items-center gap-2">
          
          <div className="flex items-center space-x-2">
          <Shield className={`h-30 w-5 ${isSafeMode ? 'text-green-500' : 'text-zinc-500'}`} />
            <Switch
              checked={isSafeMode}
              onCheckedChange={setIsSafeMode}
              disabled={isSendingInProgress}
            />
          </div>
          <span className="text-zinc-400">Safe Mode</span>
        </div>
      </div>

      <Tabs defaultValue="contacts" className="space-y-6">
        <TabsList className="bg-zinc-800">
          <TabsTrigger value="contacts" className="data-[state=active]:bg-zinc-900">
            <Users className="h-4 w-4 mr-2" />
            Contacts
          </TabsTrigger>
          <TabsTrigger value="groups" className="data-[state=active]:bg-zinc-900">
            <Users className="h-4 w-4 mr-2" />
            Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <Card className="p-6 bg-black border-zinc-800">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Message Content</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="h-32 bg-zinc-900 border-zinc-800 text-zinc-200 resize-none"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      {message.length} characters
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-zinc-400">Media (Optional)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700"
                        >
                          <ImageIcon className="h-6 w-6 text-zinc-400 mb-2" />
                          <span className="text-sm text-zinc-400">Image</span>
                        </label>
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                          id="video-upload"
                        />
                        <label
                          htmlFor="video-upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700"
                        >
                          <Video className="h-6 w-6 text-zinc-400 mb-2" />
                          <span className="text-sm text-zinc-400">Video</span>
                        </label>
                      </div>
                      <div>
                        <input
                          type="file"
                          onChange={handleDocumentChange}
                          className="hidden"
                          id="document-upload"
                        />
                        <label
                          htmlFor="document-upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700"
                        >
                          <FileText className="h-6 w-6 text-zinc-400 mb-2" />
                          <span className="text-sm text-zinc-400">Document</span>
                        </label>
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-40 rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {videoPreview && (
                      <div className="relative">
                        <video
                          src={videoPreview}
                          controls
                          className="max-h-40 rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedVideo(null);
                            setVideoPreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {documentName && (
                      <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                        <div className="flex items-center">
                          <File className="h-5 w-5 text-zinc-400 mr-2" />
                          <span className="text-zinc-200">{documentName}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedDocument(null);
                            setDocumentName(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Schedule Message (Optional)
                      </label>
                      <div className="flex items-center gap-4 mb-4">
                        <input
                          type="checkbox"
                          checked={isScheduled}
                          onChange={(e) => setIsScheduled(e.target.checked)}
                          className="rounded border-zinc-800 bg-zinc-900"
                        />
                        <span className="text-zinc-400">Schedule for later</span>
                      </div>
                      {isScheduled && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">Date</label>
                            <Input
                              type="date"
                              value={scheduleDate}
                              onChange={(e) => setScheduleDate(e.target.value)}
                              className="bg-zinc-900 border-zinc-800 text-zinc-200"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-zinc-400 mb-1">Time</label>
                            <Input
                              type="time"
                              value={scheduleTime}
                              onChange={(e) => setScheduleTime(e.target.value)}
                              className="bg-zinc-900 border-zinc-800 text-zinc-200"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">
                        Add Recipients
                      </label>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="manual"
                            name="importMethod"
                            value="none"
                            checked={importMethod === 'none'}
                            onChange={(e) => setImportMethod('none')}
                            className="mr-2"
                          />
                          <label htmlFor="manual" className="text-zinc-300">Manual Entry</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="csv"
                            name="importMethod"
                            value="csv"
                            checked={importMethod === 'csv'}
                            onChange={(e) => setImportMethod('csv')}
                            className="mr-2"
                          />
                          <label htmlFor="csv" className="text-zinc-300">Import from .CSV</label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="sheets"
                            name="importMethod"
                            value="sheets"
                            checked={importMethod === 'sheets'}
                            onChange={(e) => setImportMethod('sheets')}
                            className="mr-2"
                          />
                          <label htmlFor="sheets" className="text-zinc-300">Google Sheets</label>
                        </div>
                      </div>

                      {importMethod === 'none' && (
                        <div className="flex gap-2 mb-4">
                          <Textarea
                            value={currentNumber}
                            onChange={handleNumberInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter phone numbers (one per line)"
                            className="bg-zinc-900 border-zinc-800 text-zinc-200 min-h-[10px]"
                            style={{ resize: 'none' }}
                          />
                          <Button
                            onClick={handleAddNumber}
                            className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {importMethod === 'csv' && (
                        <div className="mb-4">
                          <div className="flex gap-4 items-center">
                            <input
                              type="file"
                              accept=".csv,.xlsx,.xls"
                              onChange={handleFileImport}
                              className="hidden"
                              id="file-upload"
                            />
                            <label
                              htmlFor="file-upload"
                              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-200 rounded-md cursor-pointer hover:bg-zinc-700"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                              Upload CSV/Excel
                            </label>
                            {csvFile && (
                              <span className="text-zinc-400">
                                File: {csvFile.name}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 mt-2">
                            Upload a CSV or Excel file with phone numbers in the first column
                          </p>
                        </div>
                      )}

                      {importMethod === 'sheets' && (
                        <div className="mb-4 space-y-4">
                          <div className="flex gap-2">
                            <Input
                              value={sheetsUrl}
                              onChange={(e) => setSheetsUrl(e.target.value)}
                              placeholder="Enter Google Sheets URL"
                              className="bg-zinc-900 border-zinc-800 text-zinc-200"
                            />
                            <Button
                              onClick={handleSheetsImport}
                              className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                            >
                              <Link2 className="h-4 w-4 mr-2" />
                              Import
                            </Button>
                          </div>
                          <p className="text-xs text-zinc-500">
                            Make sure the sheet is publicly accessible and has phone numbers in column A
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleSendMessages}
                    disabled={isSending || (!message && !selectedImage && !selectedVideo && !selectedDocument) || numbers.length === 0}
                    className="w-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w -4 w-4 animate-spin" />
                        {isScheduled ? 'Scheduling Messages...' : 'Sending Messages...'}
                      </>
                    ) : (
                      <>
                        {isScheduled ? (
                          <>
                            <Calendar className="mr-2 h-4 w-4" />
                            Schedule Messages
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Send Messages
                          </>
                        )}
                      </>
                    )}
                  </Button>

                  {status && (
                    <Alert variant={status.includes('Error') || status.includes('Failed') ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{status}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-zinc-300">Recent Messages</h3>
                    <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                      Last {messageHistory.length} messages
                    </Badge>
                  </div>
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800">
                    <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-zinc-800/50">
                            <TableHead className="text-zinc-400 sticky top-0 bg-zinc-900">Number</TableHead>
                            <TableHead className="text-zinc-400 sticky top-0 bg-zinc-900">Status</TableHead>
                            <TableHead className="text-zinc-400 sticky top-0 bg-zinc-900">Schedule</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {messageHistory.map((msg, idx) => (
                            <TableRow key={idx} className="hover:bg-zinc-800/50">
                              <TableCell className="text-zinc-300">{msg.number}</TableCell>
                              <TableCell>
                                {msg.status ? (
                                  <Badge variant="outline" className="bg-green-950/30 text-green-400 border-green-800">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {msg.scheduledTime ? 'Scheduled' : 'Sent'}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-950/30 text-red-400 border-red-800">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-zinc-400">
                                {msg.scheduledTime ? (
                                  <div className="flex items-center">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {msg.scheduledTime}
                                  </div>
                                ) : (
                                  <span className="text-zinc-500">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {messageHistory.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-zinc-500 py-8">
                                No messages sent yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-zinc-300">Added Numbers</h3>
                      <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                        {numbers.length} numbers
                      </Badge>
                    </div>
                    <div className="border border-zinc-800 rounded-lg">
                      <div className="max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-track-zinc-900 scrollbar-thumb-zinc-700">
                        {numbers.length === 0 ? (
                          <div className="p-4 text-center text-zinc-500">
                            No numbers added yet
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-800">
                            {numbers.map((entry, index) => (
                              <div 
                                key={index} 
                                className={`flex items-center justify-between p-3 ${
                                  isSafeMode && currentSendingIndex === index 
                                    ? 'bg-green-900/20' 
                                    : 'hover:bg-zinc-900/50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-200">{entry.number}</span>
                                  {isSafeMode && currentSendingIndex === index && (
                                    <Badge variant="outline" className="bg-green-950/30 text-green-400 border-green-800">
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Sending...
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!isSendingInProgress && (
                                    <>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDecreaseRepeat(index)}
                                        className="h-7 w-7 p-0 bg-zinc-800 hover:bg-zinc-700"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="text-zinc-200 min-w-[1.5rem] text-center">
                                        {entry.repeatCount || 1}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleIncreaseRepeat(index)}
                                        className="h-7 w-7 p-0 bg-zinc-800 hover:bg-zinc-700"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleRemoveNumber(index)}
                                        className="h-7 w-7 p-0"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="groups">
          <Card className="p-6 bg-black border-zinc-800">
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Message Content</label>
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className="h-32 bg-zinc-900 border-zinc-800 text-zinc-200 resize-none"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      {message.length} characters
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-zinc-400">Media (Optional)</label>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="group-image-upload"
                        />
                        <label
                          htmlFor="group-image-upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700"
                        >
                          <ImageIcon className="h-6 w-6 text-zinc-400 mb-2" />
                          <span className="text-sm text-zinc-400">Image</span>
                        </label>
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoChange}
                          className="hidden"
                          id="group-video-upload"
                        />
                        <label
                          htmlFor="group-video-upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700"
                        >
                          <Video className="h-6 w-6 text-zinc-400 mb-2" />
                          <span className="text-sm text-zinc-400">Video</span>
                        </label>
                      </div>
                      <div>
                        <input
                          type="file"
                          onChange={handleDocumentChange}
                          className="hidden"
                          id="group-document-upload"
                        />
                        <label
                          htmlFor="group-document-upload"
                          className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-700"
                        >
                          <FileText className="h-6 w-6 text-zinc-400 mb-2" />
                          <span className="text-sm text-zinc-400">Document</span>
                        </label>
                      </div>
                    </div>

                    {imagePreview && (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-40 rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {videoPreview && (
                      <div className="relative">
                        <video
                          src={videoPreview}
                          controls
                          className="max-h-40 rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setSelectedVideo(null);
                            setVideoPreview(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {documentName && (
                      <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                        <div className="flex items-center">
                          <File className="h-5 w-5 text-zinc-400 mr-2" />
                          <span className="text-zinc-200">{documentName}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedDocument(null);
                            setDocumentName(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-zinc-400 mb-2">
                      Select Groups
                    </label>
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <Input
                          value={groupSearchQuery}
                          onChange={(e) => setGroupSearchQuery(e.target.value)}
                          placeholder="Search groups..."
                          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-200"
                        />
                      </div>
                      <div className="border border-zinc-800 rounded-lg max-h-[300px] overflow-y-auto">
                        {isLoadingGroups ? (
                          <div className="p-4 text-center text-zinc-400">
                            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                            Loading groups...
                          </div>
                        ) : filteredGroups.length === 0 ? (
                          <div className="p-4 text-center text-zinc-400">
                            {groups.length === 0 ? 'No groups found' : 'No groups match your search'}
                          </div>
                        ) : (
                          <div className="divide-y divide-zinc-800">
                            {filteredGroups.map((group) => (
                              <div
                                key={group.id}
                                className="flex items-center justify-between p-3 hover:bg-zinc-900/50 cursor-pointer"
                                onClick={() => toggleGroupSelection(group.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    selectedGroups.includes(group.id)
                                      ? 'bg-green-500/10 text-green-500'
                                      : 'bg-zinc-800/50 text-zinc-400'
                                  }`}>
                                    <Users className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-zinc-200 font-medium">{group.name}</p>
                                    <p className="text-zinc-400 text-sm">
                                      {group.participantsCount} participants
                                    </p>
                                  </div>
                                </div>
                                {selectedGroups.includes(group.id) && (
                                  <Check className="h-5 w-5 text-green-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">
                        Selected {selectedGroups.length} groups
                        {groupSearchQuery && ` • Showing ${filteredGroups.length} results`}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={handleSendToGroups}
                    disabled={isSending || (!message && !selectedImage && !selectedVideo && !selectedDocument) || selectedGroups.length === 0}
                    className="w-full bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Messages...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send to Groups
                      </>
                    )}
                  </Button>

                  {status && (
                    <Alert variant={status.includes('Error') || status.includes('Failed') ? 'destructive' : 'default'}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{status}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-zinc-300">Group Message History</h3>
                    <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                      Last {groupMessageHistory.length} messages
                    </Badge>
                  </div>
                  <div className="bg-zinc-900 rounded-lg border border-zinc-800">
                    <div className="max-h-[400px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-zinc-800/50">
                            <TableHead className="text-zinc-400">Group</TableHead>
                            <TableHead className="text-zinc-400">Status</TableHead>
                            <TableHead className="text-zinc-400">Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupMessageHistory.map((msg, idx) => (
                            <TableRow key={idx} className="hover:bg-zinc-800/50">
                              <TableCell className="text-zinc-300">{msg.groupName}</TableCell>
                              <TableCell>
                                {msg.status === 'success' ? (
                                  <Badge variant="outline" className="bg-green-950/30 text-green-400 border-green-800">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Sent
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-red-950/30 text-red-400 border-red-800">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-zinc-400">
                                {msg.time}
                              </TableCell>
                            </TableRow>
                          ))}
                          {groupMessageHistory.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-zinc-500 py-8">
                                No messages sent yet
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}