
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Send, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  Quote, 
  Edit,
  Code, 
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Check,
  X,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface Template {
  _id?: string;
  name: string;
  messageType: string;
  template: {
    message: string;
    header?: string;
    footer?: string;
    button?: Button[];
  };
}

interface Button {
  name: string;
  type: 'REPLY' | 'URL' | 'PHONE_NUMBER' | 'UNSUBSCRIBE';
  url?: string;
  title?: string;
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
interface Campaign {
  _id: string;
  name: string;
  template: {
    _id: string;
    name: string;
    messageType: string;
  };
  instances: Instance[];
  recipients: Recipient[];
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed' | 'paused';
  totalMessages: number;
  sentMessages: number;
  failedMessages: number;
  createdAt: string;
  delayRange: { start: number; end: number };
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

interface CampaignStats {
  total: number;
  draft: number;
  scheduled: number;
  sending: number;
  completed: number;
  failed: number;
  paused: number;
}

const CAMPAIGN_STATUS = {
  draft: { label: 'Draft', color: 'bg-gray-500', icon: Edit },
  scheduled: { label: 'Scheduled', color: 'bg-blue-500', icon: Calendar },
  sending: { label: 'Sending', color: 'bg-yellow-500', icon: Send },
  completed: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle },
  failed: { label: 'Failed', color: 'bg-red-500', icon: XCircle },
  paused: { label: 'Paused', color: 'bg-orange-500', icon: Clock }
};

const CAMPAIGN_STEPS = [
  { id: 1, title: 'Basic Configuration', description: 'Enter the Campaign Name and Select Instance Details.' },
  { id: 2, title: 'Choose Template', description: 'Choose from a list of pre-approved templates or create a new template.' },
  { id: 3, title: 'Select Audience', description: 'Import recipients from Excel or add manually.' },
  { id: 4, title: 'Schedule Campaign', description: 'Configure delay settings and send messages.' }
];

export default function MessagingPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
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
  const [message, setMessage] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [campaignsPerPage] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignStats, setCampaignStats] = useState<CampaignStats>({
    total: 0,
    draft: 0,
    scheduled: 0,
    sending: 0,
    completed: 0,
    failed: 0,
    paused: 0
  });
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCampaignDetails, setShowCampaignDetails] = useState(false);
  
  // Campaign Creation Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const [templateSearchValue, setTemplateSearchValue] = useState('');
  const [templateCurrentPage, setTemplateCurrentPage] = useState(1);
  const [templatesPerPage] = useState(5);
  const [totalTemplates, setTotalTemplates] = useState(0);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // State for Excel import modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [excelData, setExcelData] = useState<ExcelRow[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [isExcelDataLoaded, setIsExcelDataLoaded] = useState(false);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [columnMappings, setColumnMappings] = useState<{ [key: string]: string }>({
    name: '',
    phone: '',
    var1: '',
    var2: '',
    var3: '',
    var4: '',
    var5: '',
    var6: '',
    var7: '',
    var8: '',
    var9: '',
    var10: ''
  });

  const getToken = async (): Promise<string | null | undefined> => {
    let token: string | null | undefined = Cookies.get('token');
    if (!token) {
      token = localStorage.getItem('token');
    }
    if (!token) {
      await new Promise(resolve => setTimeout(resolve, 500));
      token = Cookies.get('token') || localStorage.getItem('token');
    }
    return token;
  };

  const handleUnauthorized = () => {
    console.warn('Unauthorized response received');
    toast.error('Session expired. Please log in again.');
    Cookies.remove('token', { path: '/', secure: window.location.protocol === 'https:', sameSite: 'Lax' });
    localStorage.removeItem('token');
    Cookies.remove('user', { path: '/', secure: window.location.protocol === 'https:', sameSite: 'Lax' });
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      router.push('/login');
      return;
    }
  
    setIsLoading(true);
    try {
      // Fetch instances
      const instanceResponse = await fetch('https://whatsapp.recuperafly.com/api/instance/all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
  
      if (instanceResponse.status === 401) {
        handleUnauthorized();
        return;
      }
  
      const instanceData = await instanceResponse.json();
      const fetchedInstances = instanceData.status ? instanceData.instances || [] : [];
      setInstances(fetchedInstances); // Update state with fetched instances

      
      // Fetch campaigns
      const campaignResponse = await fetch('https://whatsapp.recuperafly.com/api/template/message/all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
  
      if (campaignResponse.status === 401) {
        handleUnauthorized();
        return;
      }
  
      const campaignData = await campaignResponse.json();
      if (campaignData.status) {
        const mappedCampaigns: Campaign[] = campaignData.messages.map((msg: any) => ({
          _id: msg._id,
          name: msg.name,
          template: {
            _id: msg.templateId,
            name: `Template ${msg.templateId.slice(-4)}`,
            messageType: 'Text',
          },
          instances: (msg.instanceIds || [])
            .map((id: string) => fetchedInstances.find((inst: Instance) => inst._id === id))
            .filter((inst: Instance | undefined) => inst !== undefined),
          recipients: msg.recipients.map((rec: any) => ({
            phone: rec.phone,
            name: rec.name,
            variables: {},
          })),
          status: msg.status,
          totalMessages: msg.statistics.total,
          sentMessages: msg.statistics.sent,
          failedMessages: msg.statistics.failed,
          createdAt: msg.createdAt,
          delayRange: msg.settings.delayRange,
        }));
  
        setCampaigns(mappedCampaigns);
  
        // Calculate stats
        const stats = mappedCampaigns.reduce(
          (acc, campaign) => {
            acc.total++;
            acc[campaign.status]++;
            return acc;
          },
          {
            total: 0,
            draft: 0,
            scheduled: 0,
            sending: 0,
            completed: 0,
            failed: 0,
            paused: 0,
          }
        );
  
        setCampaignStats(stats);
      } else {
        toast.error(campaignData.message || 'Failed to fetch campaigns');
      }
    } catch (err) {
      toast.error('Error fetching data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [router]); // Remove `instances` from dependencies
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRemoveDuplicates = () => {
    const seenPhones = new Set<string>();
    const uniqueRecipients = recipients.filter((recipient) => {
      if (!recipient.phone) return false; // Skip recipients with empty phone numbers
      if (seenPhones.has(recipient.phone)) return false;
      seenPhones.add(recipient.phone);
      return true;
    });
  
    if (uniqueRecipients.length === recipients.length) {
      toast.info('No duplicate phone numbers found.');
    } else {
      setRecipients(uniqueRecipients.length > 0 ? uniqueRecipients : [{
        phone: '',
        name: '',
        variables: { var1: '', var2: '', var3: '', var4: '', var5: '', var6: '', var7: '', var8: '', var9: '', var10: '' }
      }]);
      toast.success(`Removed ${recipients.length - uniqueRecipients.length} duplicate recipients.`);
    }
  };
  
  const handleDeleteAll = () => {
    setRecipients([{
      phone: '',
      name: '',
      variables: { var1: '', var2: '', var3: '', var4: '', var5: '', var6: '', var7: '', var8: '', var9: '', var10: '' }
    }]);
    toast.success('All recipients deleted.');
  };

  const renderCampaignsTable = () => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800">
            <TableHead className="text-zinc-400">Campaign</TableHead>
            <TableHead className="text-zinc-400">Template</TableHead>
            <TableHead className="text-zinc-400">Instances</TableHead>
            <TableHead className="text-zinc-400">Status</TableHead>
            <TableHead className="text-zinc-400">Messages</TableHead>
            <TableHead className="text-zinc-400">Sent</TableHead>
            <TableHead className="text-zinc-400">Failed</TableHead>
            <TableHead className="text-zinc-400">Created</TableHead>
            <TableHead className="text-zinc-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentCampaigns.map((campaign) => (
            <TableRow key={campaign._id} className="border-zinc-800">
              <TableCell>
                <div>
                  <p className="text-zinc-200 font-medium">{campaign.name}</p>
                  <p className="text-zinc-400 text-sm">ID: {campaign._id}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-zinc-200">{campaign.template.name}</p>
                  <p className="text-zinc-400 text-sm">{campaign.template.messageType}</p>
                </div>
              </TableCell>
              <TableCell className="text-zinc-200">{campaign.instances.length}</TableCell>
              <TableCell>{getStatusBadge(campaign.status)}</TableCell>
              <TableCell className="text-zinc-200">{campaign.totalMessages}</TableCell>
              <TableCell className="text-zinc-200">{campaign.sentMessages}</TableCell>
              <TableCell className="text-zinc-200">{campaign.failedMessages}</TableCell>
              <TableCell className="text-zinc-400">{formatDate(campaign.createdAt)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowCampaignDetails(true);
                          }}
                          className="text-zinc-400 hover:text-zinc-200"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View Details</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-zinc-400 hover:text-zinc-200"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>More Actions</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Update Campaign Details Dialog to remove deliveredMessages and completedAt
  const renderCampaignDetails = () => (
    <Dialog open={showCampaignDetails} onOpenChange={setShowCampaignDetails}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Campaign Details: {selectedCampaign?.name}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            View detailed information about this campaign
          </DialogDescription>
        </DialogHeader>

        {selectedCampaign && (
          <div className="space-y-6 p-6">
            {/* Campaign Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Campaign Name</Label>
                  <p className="text-zinc-200 font-medium">{selectedCampaign.name}</p>
                </div>
                <div>
                  <Label className="text-zinc-400">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                </div>
                <div>
                  <Label className="text-zinc-400">Template</Label>
                  <p className="text-zinc-200">{selectedCampaign.template.name}</p>
                </div>
                <div>
                  <Label className="text-zinc-400">Instances</Label>
                  <p className="text-zinc-200">{selectedCampaign.instances.length} instances</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Total Messages</Label>
                  <p className="text-zinc-200 font-medium">{selectedCampaign.totalMessages}</p>
                </div>
                <div>
                  <Label className="text-zinc-400">Sent</Label>
                  <p className="text-green-400 font-medium">{selectedCampaign.sentMessages}</p>
                </div>
                <div>
                  <Label className="text-zinc-400">Failed</Label>
                  <p className="text-red-400 font-medium">{selectedCampaign.failedMessages}</p>
                </div>
                <div>
                  <Label className="text-zinc-400">Delay Range</Label>
                  <p className="text-zinc-200">{selectedCampaign.delayRange.start}s - {selectedCampaign.delayRange.end}s</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Label className="text-zinc-400">Progress</Label>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${selectedCampaign.totalMessages > 0 ? (selectedCampaign.sentMessages / selectedCampaign.totalMessages) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-zinc-400 text-sm">
                {selectedCampaign.sentMessages} of {selectedCampaign.totalMessages} messages sent
              </p>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-zinc-400">Created At</Label>
                <p className="text-zinc-200">{formatDate(selectedCampaign.createdAt)}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
  // Fetch templates with pagination
  const fetchTemplates = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/template/all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          page: templateCurrentPage, 
          limit: templatesPerPage,
          search: templateSearchValue 
        }),
      });
      
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const templateData = await response.json();
      if (templateData.status) {
        setTemplates(templateData.templates || []);
        setTotalTemplates(templateData.total || 0);
      } else {
        toast.error(templateData.message || 'Failed to fetch templates');
      }
    } catch (err) {
      toast.error('Error fetching templates: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  }, [router, templateCurrentPage, templateSearchValue]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (currentStep === 2) {
      fetchTemplates();
    }
  }, [currentStep, fetchTemplates]);

  // Handle instance selection for multi-select dropdown
  const handleInstanceSelection = (instanceId: string) => {
    setSelectedInstances(prev =>
      prev.includes(instanceId)
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId]
    );
  };

  // Handle select all instances
  const handleSelectAllInstances = () => {
    const connectedInstanceIds = instances
      .filter(instance => instance.whatsapp.status === 'connected')
      .map(instance => instance._id);
    setSelectedInstances(connectedInstanceIds);
  };

  // Handle deselect all instances
  const handleDeselectAllInstances = () => {
    setSelectedInstances([]);
  };

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
        const data = e.target?.result as ArrayBuffer | string;
        let jsonData: string[][];
        
        if (file.name.endsWith('.csv')) {
          const text = data as string;
          const rows = text.split('\n').map(row => row.split(',').map(cell => cell.trim()));
          jsonData = rows.filter(row => row.some(cell => cell));
        } else {
          const workbook = XLSX.read(data, { type: file.name.endsWith('.csv') ? 'string' : 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false }) as string[][];
        }

        if (jsonData.length === 0) {
          toast.error('The uploaded file is empty');
          return;
        }

        const headers = jsonData[0].map((header, idx) => header || `Column ${idx + 1}`);
        setExcelHeaders(headers);

        const rows = jsonData.slice(1).map((row) =>
          row.reduce((obj, value, idx) => {
            obj[headers[idx]] = value?.toString() || '';
            return obj;
          }, {} as ExcelRow)
        );

        setExcelData(rows);
        setIsExcelDataLoaded(true);
        setShowColumnMapping(true);
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

  // Handle column mapping
  const handleColumnMappingChange = (field: string, header: string) => {
    setColumnMappings(prev => ({ ...prev, [field]: header === 'none' ? '' : header }));
  };

  // Import recipients from Excel
  const handleImportRecipients = () => {
    if (!columnMappings.name || !columnMappings.phone) {
      toast.error('Please map both Name and Phone columns');
      return;
    }

    const newRecipients = excelData.map(row => {
      const variables: { [key: string]: string } = {};
      for (let i = 1; i <= 10; i++) {
        const varKey = `var${i}`;
        const header = columnMappings[varKey];
        variables[varKey] = header && row[header] ? row[header] : '';
      }
      return {
        phone: row[columnMappings.phone] || '',
        name: row[columnMappings.name] || '',
        variables
      };
    }).filter(r => r.phone && r.name);

    setRecipients([...recipients, ...newRecipients]);
    setImportModalOpen(false);
    setExcelData([]);
    setExcelHeaders([]);
    setIsExcelDataLoaded(false);
    setShowColumnMapping(false);
    setColumnMappings({
      name: '',
      phone: '',
      var1: '',
      var2: '',
      var3: '',
      var4: '',
      var5: '',
      var6: '',
      var7: '',
      var8: '',
      var9: '',
      var10: ''
    });
    toast.success('Recipients imported successfully');
  };

  // Navigation functions
  const handleNext = () => {
    if (currentStep === 1) {
      if (!campaignName.trim()) {
        toast.error('Please enter a campaign name');
        return;
      }
      if (selectedInstances.length === 0) {
        toast.error('Please select at least one instance');
        return;
      }
    } else if (currentStep === 2) {
      if (!selectedTemplate) {
        toast.error('Please select a template');
        return;
      }
    } else if (currentStep === 3) {
      if (recipients.some((r) => !r.phone || !r.name || r.phone.trim() === '' || r.name.trim() === '')) {
        toast.error('All recipients must have a valid phone number and name');
        return;
      }
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Create campaign
  const handleCreateCampaign = async () => {
    const token = await getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setIsCreatingCampaign(true);
    try {
      const selectedTemplateObj = templates.find(t => t._id === selectedTemplate);
      const selectedInstanceObjs = instances.filter(i => selectedInstances.includes(i._id));
      
      const newCampaign: Campaign = {
        _id: Date.now().toString(),
        name: campaignName,
        template: selectedTemplateObj!,
        instances: selectedInstanceObjs,
        recipients,
        status: 'draft',
        totalMessages: recipients.length * selectedInstances.length,
        sentMessages: 0,
        deliveredMessages: 0,
        failedMessages: 0,
        createdAt: new Date().toISOString(),
        delayRange
      };

      setCampaigns(prev => [newCampaign, ...prev]);
      setCampaignStats(prev => ({ ...prev, total: prev.total + 1, draft: prev.draft + 1 }));
      
      toast.success('Campaign created successfully');
      setShowCreateCampaign(false);
      
      // Reset form
      setCampaignName('');
      setSelectedTemplate('');
      setSelectedInstances([]);
      setRecipients([{ phone: '', name: '', variables: { var1: '', var2: '', var3: '', var4: '', var5: '', var6: '', var7: '', var8: '', var9: '', var10: '' } }]);
      setCurrentStep(1);
      setDelayRange({ start: 3, end: 5 });
      
    } catch (err) {
      toast.error('Error creating campaign: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsCreatingCampaign(false);
    }
  };

  // Send campaign
  const handleSendCampaign = async () => {
    const token = await getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    setIsSending(true);
    try {
      const payload = {
        templateId: selectedTemplate,
        instanceIds: selectedInstances,
        recipients: recipients.map(({ phone, name, variables }) => ({
          phone,
          name,
          variables: Object.fromEntries(
            Object.entries(variables).filter(([_, value]) => value.trim() !== '')
          )
        })),
        delayRange
      };

      const response = await fetch('https://whatsapp.recuperafly.com/api/template/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      const result = await response.json();
      if (!result.status) {
        throw new Error(result.message || 'Failed to send campaign');
      }

      setSendResponses(result.responses || []);
      setResponseDialogOpen(true);
      toast.success('Campaign sent successfully!');
      setShowCreateCampaign(false);
      
      // Reset form
      setCampaignName('');
      setSelectedTemplate('');
      setSelectedInstances([]);
      setRecipients([{ phone: '', name: '', variables: { var1: '', var2: '', var3: '', var4: '', var5: '', var6: '', var7: '', var8: '', var9: '', var10: '' } }]);
      setCurrentStep(1);
      setDelayRange({ start: 3, end: 5 });
      
    } catch (err) {
      toast.error('Error sending campaign: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchValue.toLowerCase()) ||
                         campaign.template.name.toLowerCase().includes(searchValue.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Paginate campaigns
  const indexOfLastCampaign = currentPage * campaignsPerPage;
  const indexOfFirstCampaign = indexOfLastCampaign - campaignsPerPage;
  const currentCampaigns = filteredCampaigns.slice(indexOfFirstCampaign, indexOfLastCampaign);
  const totalPages = Math.ceil(filteredCampaigns.length / campaignsPerPage);

  // Template pagination
  const totalTemplatePages = Math.ceil(totalTemplates / templatesPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusInfo = CAMPAIGN_STATUS[status as keyof typeof CAMPAIGN_STATUS];
    const Icon = statusInfo.icon;
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-2">Basic Configuration</h3>
              <p className="text-zinc-400 mb-6">Enter the Campaign Name and Select Instance Details.</p>
            </div>

            {/* Campaign Name */}
            <div className="space-y-2">
              <Label className="text-zinc-400 font-medium">Campaign Name *</Label>
              <Input
                placeholder="Enter campaign name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-zinc-200"
              />
            </div>

            {/* Instance Selection */}
            <div className="space-y-4">
              <Label className="text-zinc-400 font-medium">Select Instances *</Label>
              <Select
                value={selectedInstances}
                onValueChange={(value) => {
                  if (value === 'select-all') {
                    handleSelectAllInstances();
                  } else if (value === 'deselect-all') {
                    handleDeselectAllInstances();
                  } else {
                    handleInstanceSelection(value);
                  }
                }}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                  <SelectValue
                    placeholder="Select instances"
                    className="text-zinc-400"
                  >
                    {selectedInstances.length > 0
                      ? `${selectedInstances.length} instance${selectedInstances.length > 1 ? 's' : ''} selected`
                      : 'Select instances'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200 max-h-60 overflow-y-auto">
                  <SelectItem value="select-all" className="font-semibold">
                    Select All
                  </SelectItem>
                  <SelectItem value="deselect-all" className="font-semibold">
                    Deselect All
                  </SelectItem>
                  {instances
                    .filter(instance => instance.whatsapp.status === 'connected')
                    .map(instance => (
                      <SelectItem key={instance._id} value={instance._id}>
                        <div className="flex items-center justify-between">
                          <span>{instance.name || `Device ${instance._id.slice(-4)}`}</span>
                          <Badge className="bg-green-500 text-white ml-2">
                            Connected
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              {instances.filter(i => i.whatsapp.status === 'connected').length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <p className="text-zinc-400">No connected instances available. Please connect at least one instance first.</p>
                </div>
              )}
              
              {/* Display selected instances */}
              {selectedInstances.length > 0 && (
                <div className="mt-4">
                  <p className="text-zinc-400 text-sm mb-2">Selected Instances:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedInstances.map(instanceId => {
                      const instance = instances.find(i => i._id === instanceId);
                      return (
                        <Badge key={instanceId} variant="outline" className="text-zinc-200">
                          {instance?.name || `Device ${instanceId.slice(-4)}`}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 h-4 w-4 p-0"
                            onClick={() => handleInstanceSelection(instanceId)}
                          >
                            <X className="h-3 w-3 text-red-400" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-2">Choose Template</h3>
              <p className="text-zinc-400 mb-6">Choose from a list of pre-approved templates or create a new template to make your campaigns live on the go.</p>
            </div>

            {/* Search and Create Template */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder="Search templates..."
                    value={templateSearchValue}
                    onChange={(e) => setTemplateSearchValue(e.target.value)}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-200"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="bg-blue-600 hover:bg-blue-700 text-white border-none"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create A New Template
              </Button>
            </div>

            {/* Templates Table */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">SN</TableHead>
                    <TableHead className="text-zinc-400">Template</TableHead>
                    <TableHead className="text-zinc-400">Template Type</TableHead>
                    <TableHead className="text-zinc-400">Created At</TableHead>
                    <TableHead className="text-zinc-400">Select</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((template, index) => (
                    <TableRow key={template._id} className="border-zinc-800">
                      <TableCell className="text-zinc-200">
                        {(templateCurrentPage - 1) * templatesPerPage + index + 1}
                      </TableCell>
                      <TableCell className="text-zinc-200">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-zinc-300">
                          {template.messageType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {new Date().toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedTemplate === template._id}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTemplate(template._id!);
                            } else {
                              setSelectedTemplate('');
                            }
                          }}
                          className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Template Pagination */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplateCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={templateCurrentPage === 1}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-zinc-400 text-sm">
                  {templateCurrentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTemplateCurrentPage(prev => Math.min(prev + 1, totalTemplatePages))}
                  disabled={templateCurrentPage === totalTemplatePages}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-sm">5 / page</span>
                <Select value="5">
                  <SelectTrigger className="w-20 bg-zinc-800 border-zinc-700 text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

        case 3:
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-zinc-200 mb-2">Select Audience</h3>
                <p className="text-zinc-400 mb-6">Import recipients from Excel or add manually.</p>
              </div>
    
              {/* Import Options */}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => setImportModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Excel Import
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRemoveDuplicates}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Remove Duplicates
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDeleteAll}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
                <Button
                  variant="outline"
                  onClick={addRecipient}
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Recipient
                </Button>
              </div>
    
              {/* Recipients Table */}
              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">SN</TableHead>
                      <TableHead className="text-zinc-400">Name</TableHead>
                      <TableHead className="text-zinc-400">Phone</TableHead>
                      {Array.from({ length: 10 }, (_, i) => (
                        <TableHead key={i} className="text-zinc-400">Var{i + 1}</TableHead>
                      ))}
                      <TableHead className="text-zinc-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recipients.map((recipient, index) => (
                      <TableRow key={index} className="border-zinc-800">
                        <TableCell className="text-zinc-200">{index + 1}</TableCell>
                        <TableCell>
                          <Input
                            value={recipient.name}
                            onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                            placeholder="Enter name"
                            className="bg-zinc-800 border-zinc-700 text-zinc-200"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={recipient.phone}
                            onChange={(e) => handleRecipientChange(index, 'phone', e.target.value)}
                            placeholder="Enter phone"
                            className="bg-zinc-800 border-zinc-700 text-zinc-200"
                          />
                        </TableCell>
                        {Array.from({ length: 10 }, (_, i) => (
                          <TableCell key={i}>
                            <Input
                              value={recipient.variables[`var${i + 1}`]}
                              onChange={(e) => handleVariableChange(index, `var${i + 1}`, e.target.value)}
                              placeholder={`Var${i + 1}`}
                              className="bg-zinc-800 border-zinc-700 text-zinc-200"
                            />
                          </TableCell>
                        ))}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipient(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
    
              {/* Summary */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">Total: {recipients.length}</span>
                  <span className="text-zinc-400">Valid: {recipients.filter(r => r.phone && r.name).length}</span>
                  <span className="text-zinc-400">Invalid: {recipients.filter(r => !r.phone || !r.name).length}</span>
                </div>
              </div>
            </div>
          );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-200 mb-2">Schedule Campaign</h3>
              <p className="text-zinc-400 mb-6">Review your campaign details and configure sending options.</p>
            </div>

            {/* Campaign Summary */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-zinc-200 mb-4">Campaign Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-zinc-400">Campaign Name</Label>
                  <p className="text-zinc-200 font-medium">{campaignName}</p>
                </div>
                <div>
                  <Label className="text-zinc-400">Selected Template</Label>
                  <p className="text-zinc-200 font-medium">
                    {templates.find(t => t._id === selectedTemplate)?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-400">Selected Instances</Label>
                  <p className="text-zinc-200 font-medium">
                    {selectedInstances.length} instances
                  </p>
                </div>
                <div>
                  <Label className="text-zinc-400">Total Recipients</Label>
                  <p className="text-zinc-200 font-medium">{recipients.length} recipients</p>
                </div>
                <div>
                  <Label className="text-zinc-400">Total Messages</Label>
                  <p className="text-zinc-200 font-medium">{recipients.length * selectedInstances.length} messages</p>
                </div>
              </div>
            </div>

            {/* Delay Configuration */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-zinc-200 mb-4">Delay Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400">Starting Delay (seconds)</Label>
                  <Input
                    type="number"
                    value={delayRange.start}
                    onChange={(e) => setDelayRange(prev => ({ ...prev, start: parseInt(e.target.value) || 0 }))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200"
                    min="1"
                  />
                </div>
                <div>
                  <Label className="text-zinc-400">Ending Delay (seconds)</Label>
                  <Input
                    type="number"
                    value={delayRange.end}
                    onChange={(e) => setDelayRange(prev => ({ ...prev, end: parseInt(e.target.value) || 0 }))}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200"
                    min="1"
                  />
                </div>
              </div>
              <p className="text-zinc-400 text-sm mt-2">
                Messages will be sent with a random delay between {delayRange.start} and {delayRange.end} seconds.
              </p>
            </div>

            {/* Send Options */}
            <div className="flex gap-4">
              <Button
                onClick={handleCreateCampaign}
                disabled={isCreatingCampaign}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                {isCreatingCampaign ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save as Draft'
                )}
              </Button>
              <Button
                onClick={handleSendCampaign}
                disabled={isSending}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Messages
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Messaging Campaigns
          </h1>
          <p className="text-zinc-400 mt-2">Manage your WhatsApp messaging campaigns</p>
        </div>
        <Button
          onClick={() => setShowCreateCampaign(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-zinc-900/80 border-zinc-800/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{campaignStats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Draft</p>
                <p className="text-2xl font-bold text-white">{campaignStats.draft}</p>
              </div>
              <Edit className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Scheduled</p>
                <p className="text-2xl font-bold text-white">{campaignStats.scheduled}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Sending</p>
                <p className="text-2xl font-bold text-white">{campaignStats.sending}</p>
              </div>
              <Send className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">{campaignStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Failed</p>
                <p className="text-2xl font-bold text-white">{campaignStats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/80 border-zinc-800/80">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Paused</p>
                <p className="text-2xl font-bold text-white">{campaignStats.paused}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-zinc-900/80 border-zinc-800/80">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-zinc-200"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => fetchData()}
              className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card className="bg-zinc-900/80 border-zinc-800/80">
        <CardHeader>
          <CardTitle className="text-zinc-200">Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-zinc-400">Loading campaigns...</p>
              </div>
            </div>
          ) : currentCampaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <MessageSquare className="h-16 w-16 text-zinc-600 mb-4" />
              <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Campaigns Found</h3>
              <p className="text-zinc-400 mb-6">Create your first campaign to get started.</p>
              <Button
                onClick={() => setShowCreateCampaign(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            renderCampaignsTable()
          )}
        </CardContent>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <CardFooter className="flex justify-between items-center">
            <p className="text-zinc-400 text-sm">
              Showing {indexOfFirstCampaign + 1} to {Math.min(indexOfLastCampaign, filteredCampaigns.length)} of {filteredCampaigns.length} campaigns
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
              >
                Previous
              </Button>
              <span className="text-zinc-400 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreateCampaign} onOpenChange={setShowCreateCampaign}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Create New Campaign</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Connect with your customers through RCS.
            </DialogDescription>
          </DialogHeader>
          
          {/* Step Indicator */}
          <div className="flex items-center justify-between mb-8">
            {CAMPAIGN_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-zinc-600 text-zinc-400'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.id ? 'text-zinc-200' : 'text-zinc-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < CAMPAIGN_STEPS.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                    currentStep > step.id ? 'bg-blue-600' : 'bg-zinc-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-zinc-800">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Campaign Details Dialog */}
      <Dialog open={showCampaignDetails} onOpenChange={setShowCampaignDetails}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Campaign Details: {selectedCampaign?.name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              View detailed information about this campaign
            </DialogDescription>
          </DialogHeader>
          
          {selectedCampaign && (
            <div className="space-y-6 p-6">
              {/* Campaign Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-400">Campaign Name</Label>
                    <p className="text-zinc-200 font-medium">{selectedCampaign.name}</p>
                  </div>
                  <div>
                    <Label className="text-zinc-400">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                  </div>
                  <div>
                    <Label className="text-zinc-400">Template</Label>
                    <p className="text-zinc-200">{selectedCampaign.template.name}</p>
                  </div>
                  <div>
                    <Label className="text-zinc-400">Instances</Label>
                    <p className="text-zinc-200">{selectedCampaign.instances.length} instances</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-zinc-400">Total Messages</Label>
                    <p className="text-zinc-200 font-medium">{selectedCampaign.totalMessages}</p>
                  </div>
                  <div>
                    <Label className="text-zinc-400">Delivered</Label>
                    <p className="text-green-400 font-medium">{selectedCampaign.deliveredMessages}</p>
                  </div>
                  <div>
                    <Label className="text-zinc-400">Failed</Label>
                    <p className="text-red-400 font-medium">{selectedCampaign.failedMessages}</p>
                  </div>
                  <div>
                    <Label className="text-zinc-400">Delay Range</Label>
                    <p className="text-zinc-200">{selectedCampaign.delayRange.start}s - {selectedCampaign.delayRange.end}s</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <Label className="text-zinc-400">Progress</Label>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${selectedCampaign.totalMessages > 0 ? (selectedCampaign.sentMessages / selectedCampaign.totalMessages) * 100 : 0}%` 
                    }}
                  />
                </div>
                <p className="text-zinc-400 text-sm">
                  {selectedCampaign.sentMessages} of {selectedCampaign.totalMessages} messages sent
                </p>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-zinc-400">Created At</Label>
                  <p className="text-zinc-200">{formatDate(selectedCampaign.createdAt)}</p>
                </div>
                {selectedCampaign.completedAt && (
                  <div>
                    <Label className="text-zinc-400">Completed At</Label>
                    <p className="text-zinc-200">{formatDate(selectedCampaign.completedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Excel Modal */}
      <Dialog open={importModalOpen} onOpenChange={(open) => {
        setImportModalOpen(open);
        if (!open) {
          setExcelData([]);
          setExcelHeaders([]);
          setIsExcelDataLoaded(false);
          setShowColumnMapping(false);
          setColumnMappings({
            name: '',
            phone: '',
            var1: '',
            var2: '',
            var3: '',
            var4: '',
            var5: '',
            var6: '',
            var7: '',
            var8: '',
            var9: '',
            var10: ''
          });
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Import Recipients</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Upload Excel or CSV file and map columns to import recipients
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {!isExcelDataLoaded ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg py-12">
                <Upload className="h-12 w-12 text-zinc-500 mb-4" />
                <Label className="text-zinc-400 mb-4">Upload .xlsx, .xls or .csv file</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-none"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  Select File
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
                <Label className="text-zinc-400 font-medium">Preview Data</Label>
                <div className="overflow-x-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800">
                        {excelHeaders.map((header, idx) => (
                          <TableHead key={idx} className="text-zinc-400">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {excelData.slice(0, 5).map((row, rowIdx) => (
                        <TableRow key={rowIdx} className="border-zinc-800">
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
                    }}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowColumnMapping(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Map Columns
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="text-zinc-400 font-medium">Map Columns</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {['name', 'phone', ...Array.from({ length: 10 }, (_, i) => `var${i + 1}`)].map(field => (
                    <div key={field} className="space-y-2">
                      <Label className="text-zinc-400">{field === 'name' ? 'Name *' : field === 'phone' ? 'Phone *' : `Variable ${field.slice(3)}`}</Label>
                      <Select
                        value={columnMappings[field]}
                        onValueChange={(value) => handleColumnMappingChange(field, value)}
                      >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-zinc-200">
                          <SelectValue placeholder={`Select column for ${field}`} />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                          <SelectItem value="none">None</SelectItem>
                          {excelHeaders.map(header => (
                            <SelectItem key={header} value={header}>{header}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowColumnMapping(false)}
                    className="bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700"
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={handleImportRecipients}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!columnMappings.name || !columnMappings.phone}
                  >
                    Import
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Responses Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Send Responses</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Review the status of messages sent in the campaign
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            {sendResponses.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-zinc-500 mx-auto mb-4" />
                <p className="text-zinc-400">No responses available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-400">Phone</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-zinc-400">Message</TableHead>
                      <TableHead className="text-zinc-400">Instance ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sendResponses.map((response, index) => (
                      <TableRow key={index} className="border-zinc-800">
                        <TableCell className="text-zinc-200">{response.phone}</TableCell>
                        <TableCell>
                          <Badge className={response.status ? 'bg-green-500' : 'bg-red-500'}>
                            {response.status ? 'Success' : 'Failed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-200">{response.message}</TableCell>
                        <TableCell className="text-zinc-200">{response.instanceId}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => setResponseDialogOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                Close
              </Button>
            </div>  
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}