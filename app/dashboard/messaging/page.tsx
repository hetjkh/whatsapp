
"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Send, Trash2, Loader2, CheckCircle, XCircle, ChevronDown, Bold, Italic, Strikethrough, List, Quote, Code, Upload } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface Template {
  _id: string;
  name: string;
  messageType: string;
  template: {
    message: string;
    header?: string;
    footer?: string;
    button?: Array<{ name: string; type: string; url?: string }>;
  };
}

interface Instance {
  _id: string;
  name: string;
  whatsapp: {
    status: string;
    phone?: string;
  };
}

interface Recipient {
  phone: string;
  name: string;
  variables: { [key: string]: string };
}

interface SendResponse {
  phone: string;
  status: boolean;
  message: string;
  instanceId: string;
}

interface ExcelRow {
  [key: string]: string;
}

export default function MessagingPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedInstances, setSelectedInstances] = useState<string[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { phone: '', name: '', variables: { var1: '', var2: '', var3: '', var4: '', var5: '', var6: '', var7: '', var8: '', var9: '', var10: '' } },
  ]);
  const [delayRange, setDelayRange] = useState<{ start: number; end: number }>({ start: 3, end: 5 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [sendResponses, setSendResponses] = useState<SendResponse[]>([]);
  const [isInstanceDropdownOpen, setIsInstanceDropdownOpen] = useState(false);
  const [message, setMessage] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // State for Excel import modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0);
  const [isExcelDataLoaded, setIsExcelDataLoaded] = useState(false);
  const [columnMappings, setColumnMappings] = useState<{ [key: string]: string }>({});
  const [showColumnMapping, setShowColumnMapping] = useState(false);

  // Fetch templates and instances
  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        const templateResponse = await fetch('https://whatsapp.recuperafly.com/api/template/all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ page: 1, limit: 100 }),
        });
        const templateData = await templateResponse.json();
        if (templateData.status) {
          setTemplates(templateData.templates || []);
        } else {
          toast.error(templateData.message || 'Failed to fetch templates');
        }

        const instanceResponse = await fetch('https://whatsapp.recuperafly.com/api/instance/all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        const instanceData = await instanceResponse.json();
        if (instanceData.status) {
          setInstances(instanceData.instances || []);
        } else {
          toast.error(instanceData.message || 'Failed to fetch instances');
        }
      } catch (err) {
        toast.error('Error fetching data: ' );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Update message when template is selected
  useEffect(() => {
    const selectedTemplateObj = templates.find((t) => t._id === selectedTemplate);
    if (selectedTemplateObj && editorRef.current) {
      editorRef.current.innerText = selectedTemplateObj.template.message || '';
      setMessage(selectedTemplateObj.template.message || '');
    } else if (editorRef.current) {
      editorRef.current.innerText = '';
      setMessage('');
    }
  }, [selectedTemplate, templates]);

  // Ensure editor content and message state stay in sync
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerText !== message) {
      editorRef.current.innerText = message;
    }
  }, [message]);

  // Handle recipient input changes
  const handleRecipientChange = (index: number, field: keyof Recipient, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = { ...newRecipients[index], [field]: value };
    setRecipients(newRecipients);
  };

  // Handle variable input changes
  const handleVariableChange = (index: number, varName: string, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index].variables = { ...newRecipients[index].variables, [varName]: value };
    setRecipients(newRecipients);
  };

  // Add new recipient
  const addRecipient = () => {
    setRecipients([...recipients, { phone: '', name: '', variables: { var1: '', var2: '', var3: '', var4: '', var5: '', var6: '', var7: '', var8: '', var9: '', var10: '' } }]);
  };

  // Remove recipient
  const removeRecipient = (index: number) => {
    setRecipients(recipients.filter((_, i) => i !== index));
  };

  // Handle instance selection
  const handleInstanceToggle = (instanceId: string) => {
    setSelectedInstances((prev) =>
      prev.includes(instanceId)
        ? prev.filter((id) => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  // Handle message input
  const handleInput = () => {
    const editor = editorRef.current;
    if (!editor) return;

    let text = editor.innerText;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const cursorPos = range.startOffset;

    const boldPattern = /\*\*(.*?)\*\*/g;
    const italicPattern = /\*(.*?)\*/g;
    const strikethroughPattern = /~~(.*?)~~/g;
    const bulletPattern = /^-\s(.*)$/gm;
    const quotePattern = /^>\s(.*)$/gm;
    const codePattern = /`(.*?)`/g;

    let modified = false;

    if (boldPattern.test(text)) {
      editor.innerHTML = text.replace(boldPattern, '<b>$1</b>');
      text = editor.innerText;
      modified = true;
    }
    if (italicPattern.test(text)) {
      editor.innerHTML = text.replace(italicPattern, '<i>$1</i>');
      text = editor.innerText;
      modified = true;
    }
    if (strikethroughPattern.test(text)) {
      editor.innerHTML = text.replace(strikethroughPattern, '<s>$1</s>');
      text = editor.innerText;
      modified = true;
    }
    if (bulletPattern.test(text)) {
      editor.innerHTML = text.replace(bulletPattern, '<ul><li>$1</li></ul>');
      text = editor.innerText;
      modified = true;
    }
    if (quotePattern.test(text)) {
      editor.innerHTML = text.replace(quotePattern, '<blockquote>$1</blockquote>');
      text = editor.innerText;
      modified = true;
    }
    if (codePattern.test(text)) {
      editor.innerHTML = text.replace(codePattern, '<code>$1</code>');
      text = editor.innerText;
      modified = true;
    }

    setMessage(text);

    if (modified && selection) {
      const newRange = document.createRange();
      const newSelection = window.getSelection();
      if (newSelection) {
        try {
          const targetNode = editor.firstChild || editor;
          const maxOffset = targetNode.nodeType === 3 ? targetNode.textContent?.length || 0 : editor.childNodes.length;
          const safeOffset = Math.min(cursorPos, maxOffset);
          newRange.setStart(targetNode, safeOffset);
          newRange.collapse(true);
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);
        } catch (error) {
          console.warn('Failed to restore cursor position:', error);
          newRange.selectNodeContents(editor);
          newRange.collapse(false);
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);
        }
      }
    }
  };

  // Apply formatting
  const applyFormatting = (format: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(format, false, format === 'formatBlock' ? 'blockquote' : undefined);
    setMessage(editor.innerText);
  };

  // Handle variable selection
  const handleVariableSelect = (value: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const placeholder = value === 'name' ? '{{name}}' : value === 'number' ? '{{number}}' : `{{var${value.split(' ')[1]}}}`;
    range.insertNode(document.createTextNode(placeholder));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    setMessage(editor.innerText);
  };

  // Handle Excel file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
      toast.error('Please upload a valid Excel or CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as string[][];

        if (jsonData.length === 0) {
          toast.error('The uploaded file is empty');
          return;
        }

        // Extract headers from the first row for display
        const headers = jsonData[0].map((header, idx) => header || `Column ${idx + 1}`);
        setExcelHeaders(headers);

        // Convert rows to objects
        const rows = jsonData.map((row) =>
          row.reduce((obj, value, idx) => {
            obj[headers[idx]] = value?.toString() || '';
            return obj;
          }, {} as ExcelRow)
        );

        setExcelData(rows);
        setIsExcelDataLoaded(true);
      } catch (err) {
        toast.error('Error parsing file: The file may be corrupted or in an unsupported format.');
        console.error(err);
      }
    };

    reader.onerror = () => {
      toast.error('Error reading the file');
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Proceed to column mapping after selecting header row
  const handleProceedToColumnMapping = () => {
    if (excelData.length === 0) {
      toast.error('No data to map');
      return;
    }

    // Initialize column mappings based on header names
    const initialMappings: { [key: string]: string } = {};
    excelHeaders.forEach((header) => {
      const lowerHeader = header.toLowerCase();
      if (lowerHeader === 'name') {
        initialMappings[header] = 'name';
      } else if (lowerHeader === 'phone') {
        initialMappings[header] = 'phone';
      } else {
        const varMatch = lowerHeader.match(/var(\d+)/);
        if (varMatch && varMatch[1]) {
          const varNum = parseInt(varMatch[1]);
          if (varNum >= 1 && varNum <= 10) {
            initialMappings[header] = `variable ${varNum}`;
          } else {
            initialMappings[header] = 'ignore';
          }
        } else {
          initialMappings[header] = 'ignore';
        }
      }
    });

    setColumnMappings(initialMappings);
    setShowColumnMapping(true);
  };

  // Handle column mapping change
  const handleColumnMappingChange = (header: string, value: string) => {
    setColumnMappings((prev) => ({
      ...prev,
      [header]: value,
    }));
  };

  // Handle header row selection and import
  const handleImportConfirm = () => {
    if (!isExcelDataLoaded || excelData.length === 0) {
      toast.error('No data to import');
      return;
    }

    const headers = excelHeaders;

    const newRecipients = excelData.slice(selectedHeaderRow + 1).map((row) => {
      const recipient: Recipient = {
        phone: '',
        name: '',
        variables: { var1: '', var2: '', var3: '', var4: '', var5: '', var6: '', var7: '', var8: '', var9: '', var10: '' },
      };

      headers.forEach((header) => {
        const mapping = columnMappings[header];
        const value = row[header] || '';
        if (mapping === 'name') {
          recipient.name = value;
        } else if (mapping === 'phone') {
          recipient.phone = value;
        } else if (mapping.startsWith('variable')) {
          const varNum = parseInt(mapping.split(' ')[1]);
          if (varNum >= 1 && varNum <= 10) {
            recipient.variables[`var${varNum}`] = value;
          }
        }
      });

      return recipient;
    }).filter((recipient) => recipient.phone && recipient.name); // Filter out invalid recipients

    setRecipients([...recipients, ...newRecipients]);
    setImportModalOpen(false);
    setExcelData([]);
    setExcelHeaders([]);
    setIsExcelDataLoaded(false);
    setSelectedHeaderRow(0);
    setShowColumnMapping(false);
    setColumnMappings({});
    toast.success('Recipients imported successfully');
  };

  // Create temporary template
  const createTempTemplate = async (message: string) => {
    const token = Cookies.get('token');
    if (!token) return null;

    const selectedTemplateObj = templates.find((t) => t._id === selectedTemplate);
    if (!selectedTemplateObj) return null;

    const payload = {
      name: `Temp_${Date.now()}`,
      messageType: selectedTemplateObj.messageType,
      template: {
        message,
        ...(selectedTemplateObj.messageType === 'Buttons' && {
          header: selectedTemplateObj.template.header || '',
          footer: selectedTemplateObj.template.footer || '',
          button: selectedTemplateObj.template.button?.map(btn => ({
            name: btn.name,
            type: btn.type,
            ...(btn.url && { url: btn.url }),
          })) || [],
        }),
      },
    };

    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/template/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      return data.status && data.data?._id ? data.data._id : null;
    } catch (err) {
      console.error('Error creating temporary template:', err);
      return null;
    }
  };

  // Delete temporary template
  const deleteTempTemplate = async (templateId: string) => {
    const token = Cookies.get('token');
    if (!token) return;

    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/template/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId }),
      });
      const data = await response.json();
      if (!data.status) {
        console.warn('Failed to delete temporary template:', data.message);
      }
    } catch (err) {
      console.warn('Error deleting temporary template:', err);
    }
  };

  // Handle form submission
  const handleSendMessages = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    if (selectedInstances.length === 0) {
      toast.error('Please select at least one instance');
      return;
    }
    if (recipients.some((r) => !r.phone || !r.name || r.phone.trim() === '' || r.name.trim() === '')) {
      toast.error('All recipients must have a valid phone number and name');
      return;
    }
    if (delayRange.start < 0 || delayRange.end < delayRange.start) {
      toast.error('Invalid delay range');
      return;
    }
    if (!editorRef.current?.innerText) {
      toast.error('Message cannot be empty');
      return;
    }

    const currentMessage = editorRef.current.innerText || message;
    setMessage(currentMessage);

    setIsSending(true);
    let tempTemplateId: string | null = null;
    try {
      tempTemplateId = await createTempTemplate(currentMessage);
      if (!tempTemplateId) {
        toast.error('Failed to create temporary template');
        return;
      }

      const payload = {
        templateId: tempTemplateId,
        instanceIds: selectedInstances,
        recipients: recipients.map((r) => ({
          phone: r.phone,
          name: r.name,
          variables: Object.entries(r.variables)
            .filter(([_, value]) => value && value.trim() !== '')
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
        })),
        delayRange,
      };

      const response = await fetch('https://whatsapp.recuperafly.com/api/template/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.status) {
        setSendResponses(data.data || []);
        setResponseDialogOpen(true);
        toast.success(data.message || 'Messages processed successfully');
      } else {
        toast.error(data.message || 'Failed to send messages');
      }
    } catch (err) {
      toast.error('Error sending messages: ' );
    } finally {
      if (tempTemplateId) {
        await deleteTempTemplate(tempTemplateId);
      }
      setIsSending(false);
    }
  };

  const selectedTemplateObj = templates.find((t) => t._id === selectedTemplate);
  const templateVariables = selectedTemplateObj?.template.message.match(/{{(.*?)}}/g)?.map((v) => v.replace(/{{|}}/g, '')) || [];

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
          },
        }}
      />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Send Messages
        </h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => setImportModalOpen(true)}
          className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
        >
          <Upload className="h-5 w-5 mr-2" />
          Import
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
            <p className="text-zinc-400">Loading data...</p>
          </div>
        </div>
      ) : (
        <Card className="bg-zinc-900/80 border-zinc-800/80 rounded-xl">
          <form onSubmit={handleSendMessages}>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-400 font-medium">Select Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                      {templates.map((template) => (
                        <SelectItem key={template._id} value={template._id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-400 font-medium">Select Instances</Label>
                  <div className="relative">
                    <Button
                      type="button"
                      className="w-full bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 justify-between"
                      onClick={() => setIsInstanceDropdownOpen(!isInstanceDropdownOpen)}
                    >
                      <span>
                        {selectedInstances.length > 0
                          ? `${selectedInstances.length} instance${selectedInstances.length > 1 ? 's' : ''} selected`
                          : 'Select instances'}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    {isInstanceDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg max-h-60 overflow-auto">
                        {instances.map((instance) => (
                          <div
                            key={instance._id}
                            className={`px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-zinc-700 ${
                              selectedInstances.includes(instance._id) ? 'bg-blue-500/10' : ''
                            }`}
                            onClick={() => handleInstanceToggle(instance._id)}
                          >
                            <div>
                              <p className="text-zinc-200">
                                {instance.whatsapp.phone || `Device ${instance._id.slice(-4)}`}
                              </p>
                              {instance.name && <p className="text-sm text-zinc-400">{instance.name}</p>}
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full ${
                                instance.whatsapp.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-zinc-400 font-medium">Recipients</Label>
                <div className="overflow-x-auto">
                  <Table className="min-w-[1200px]">
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Name</TableHead>
                        <TableHead className="text-zinc-400">Phone Number</TableHead>
                        {Array.from({ length: 10 }, (_, i) => (
                          <TableHead key={`var${i + 1}`} className="text-zinc-400">Variable {i + 1}</TableHead>
                        ))}
                        <TableHead className="text-zinc-400">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.map((recipient, index) => (
                        <TableRow key={index} className="border-zinc-800">
                          <TableCell>
                            <Input
                              className="bg-zinc-800 border-zinc-700 text-zinc-200"
                              placeholder="Enter name"
                              value={recipient.name}
                              onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="bg-zinc-800 border-zinc-700 text-zinc-200"
                              placeholder="Enter phone number"
                              value={recipient.phone}
                              onChange={(e) => handleRecipientChange(index, 'phone', e.target.value)}
                            />
                          </TableCell>
                          {Array.from({ length: 10 }, (_, i) => (
                            <TableCell key={`var${i + 1}`}>
                              <Input
                                className="bg-zinc-800 border-zinc-700 text-zinc-200"
                                placeholder={`Enter var${i + 1}`}
                                value={recipient.variables[`var${i + 1}`] || ''}
                                onChange={(e) => handleVariableChange(index, `var${i + 1}`, e.target.value)}
                              />
                            </TableCell>
                          ))}
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRecipient(index)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRecipient}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Recipient
                </Button>
              </div>

              <div className="space-y-4">
                <Label className="text-zinc-400 font-medium">Message</Label>
                <div className="space-y-4">
                  <div className="flex gap-3 flex-wrap items-center">
                    <Select
                      onValueChange={handleVariableSelect}
                      defaultValue=""
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200 h-10">
                        <SelectValue placeholder="Insert variable" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        {Array.from({ length: 10 }, (_, i) => (
                          <SelectItem key={i} value={`variable ${i + 1}`}>
                            Variable {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('bold')}
                      className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 h-10 px-4"
                    >
                      <Bold className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('italic')}
                      className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 h-10 px-4"
                    >
                      <Italic className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('strikeThrough')}
                      className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 h-10 px-4"
                    >
                      <Strikethrough className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('insertUnorderedList')}
                      className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 h-10 px-4"
                    >
                      <List className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('formatBlock')}
                      className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 h-10 px-4"
                    >
                      <Quote className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('code')}
                      className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700 h-10 px-4"
                    >
                      <Code className="h-5 w-5" />
                    </Button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-md p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-zinc-700 text-lg"
                    onInput={handleInput}
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '18px',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-400 font-medium">Delay Range (seconds)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-400 mb-2">Start</Label>
                    <Input
                      type="number"
                      className="bg-zinc-800 border-zinc-700 text-zinc-200"
                      placeholder="Start delay"
                      value={delayRange.start}
                      onChange={(e) => setDelayRange({ ...delayRange, start: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label className="text-zinc-400 mb-2">End</Label>
                    <Input
                      type="number"
                      className="bg-zinc-800 border-zinc-700 text-zinc-200"
                      placeholder="End delay"
                      value={delayRange.end}
                      onChange={(e) => setDelayRange({ ...delayRange, end: parseInt(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 flex justify-end">
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send Messages
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Send Results</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Results of the message sending operation
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400">Phone</TableHead>
                  <TableHead className="text-zinc-400">Instance ID</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sendResponses.map((response, index) => (
                  <TableRow key={index} className="border-zinc-800">
                    <TableCell className="text-zinc-200">{response.phone}</TableCell>
                    <TableCell className="text-zinc-200">{response.instanceId.slice(-4)}</TableCell>
                    <TableCell className="text-zinc-200">
                      {response.status ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-200">{response.message}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Excel Modal */}
      <Dialog open={importModalOpen} onOpenChange={(open) => {
        setImportModalOpen(open);
        if (!open) {
          setExcelData([]);
          setExcelHeaders([]);
          setIsExcelDataLoaded(false);
          setSelectedHeaderRow(0);
          setShowColumnMapping(false);
          setColumnMappings({});
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl sm:max-w-5xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upload Excel File</DialogTitle>
            <DialogDescription className="text-zinc-400">
              (Phone number is mandatory)
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {!isExcelDataLoaded ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg py-12">
                <Label className="text-zinc-400 mb-4">Upload .xlsx, .xls or .csv file</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Select file
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            ) : !showColumnMapping ? (
              <div className="space-y-4">
                <Label className="text-zinc-400 font-medium">Select header row</Label>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400 w-8"></TableHead>
                        {excelHeaders.map((header, idx) => (
                          <TableHead key={idx} className="text-zinc-400">
                            {header}
                            {header.toLowerCase() === 'name' && <span className="text-xs text-zinc-500 block">Optional</span>}
                            {header.toLowerCase() === 'phone' && <span className="text-xs text-zinc-500 block">Required</span>}
                            {header.toLowerCase().startsWith('var') && !['name', 'phone'].includes(header.toLowerCase()) && (
                              <span className="text-xs text-zinc-500 block">Optional</span>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {excelData.slice(0, 5).map((row, rowIdx) => (
                        <TableRow key={rowIdx} className="border-zinc-800">
                          <TableCell>
                            <input
                              type="radio"
                              name="header-row"
                              checked={selectedHeaderRow === rowIdx}
                              onChange={() => setSelectedHeaderRow(rowIdx)}
                            />
                          </TableCell>
                          {excelHeaders.map((header, colIdx) => (
                            <TableCell key={colIdx} className="text-zinc-200">
                              {row[header]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setImportModalOpen(false);
                      setExcelData([]);
                      setExcelHeaders([]);
                      setIsExcelDataLoaded(false);
                      setSelectedHeaderRow(0);
                    }}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleProceedToColumnMapping}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-zinc-400 font-medium">Match Columns</Label>
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        <TableHead className="text-zinc-400">Column Name</TableHead>
                        <TableHead className="text-zinc-400">Map To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {excelHeaders.map((header, idx) => (
                        <TableRow key={idx} className="border-zinc-800">
                          <TableCell className="text-zinc-200">{header}</TableCell>
                          <TableCell>
                            <Select
                              value={columnMappings[header] || 'ignore'}
                              onValueChange={(value) => handleColumnMappingChange(header, value)}
                            >
                              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                                <SelectItem value="ignore">Ignore</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="phone">Phone</SelectItem>
                                {Array.from({ length: 10 }, (_, i) => (
                                  <SelectItem key={i} value={`variable ${i + 1}`}>
                                    Variable {i + 1}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowColumnMapping(false);
                      setColumnMappings({});
                    }}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImportConfirm}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Import
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
