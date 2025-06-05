"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
idencia:1
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Phone, 
  QrCode, 
  Edit, 
  Trash2, 
  LogOut, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from 'lucide-react';

// Define interfaces for type safety
interface WhatsAppProfile {
  phone?: string | null;
  status: string;
  profile?: string | null;
}

interface Instance {
  _id: string;
  name?: string;
  whatsapp: WhatsAppProfile;
}

export default function DevicesPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [connectedInstance, setConnectedInstance] = useState<Instance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [instancesPerPage, setInstancesPerPage] = useState(9);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editInstanceId, setEditInstanceId] = useState<string | null>(null);
  const [editInstanceName, setEditInstanceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessingQR, setIsProcessingQR] = useState<{ [key: string]: boolean }>({});
  const [isProcessingLogout, setIsProcessingLogout] = useState<{ [key: string]: boolean }>({});
  const [isProcessingDelete, setIsProcessingDelete] = useState<{ [key: string]: boolean }>({});
  const [isProcessingEdit, setIsProcessingEdit] = useState<{ [key: string]: boolean }>({});
  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null);

  const router = useRouter();

  // Fetch instances on component mount
  useEffect(() => {
    const fetchInstances = async () => {
      const token = Cookies.get('token');
      if (!token) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch('https://whatsapp.recuperafly.com/api/instance/all', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        if (data.status) {
          setInstances(data.instances || []);
        } else {
          toast.error(data.message || 'Failed to fetch instances');
        }
      } catch (err) {
        toast.error('Error fetching instances: ');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstances();
  }, [router]);

  // Poll instance status when QR is shown
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (showQR && selectedInstanceId) {
      interval = setInterval(async () => {
        const token = Cookies.get('token');
        if (!token) {
          router.push('/login');
          return;
        }

        try {
          const response = await fetch('https://whatsapp.recuperafly.com/api/instance/all', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });
          const data = await response.json();
          if (data.status) {
            const updatedInstance = data.instances.find((inst: Instance) => inst._id === selectedInstanceId);
            if (updatedInstance && updatedInstance.whatsapp.status === 'connected') {
              setShowQR(false);
              setConnectedInstance(updatedInstance);
              setShowSuccessDialog(true);
              setInstances(data.instances);
              clearInterval(interval);
            }
          }
        } catch (err) {
          console.error('Error polling instance status:', err);
        }
      }, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showQR, selectedInstanceId, router]);

  // Handle Create Instance
  const handleCreateInstance = async () => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/instance/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.status) {
        const newInstance = data.instance;
        setInstances((prev) => [...prev, newInstance]);
        toast.success('Instance created successfully');
      } else {
        toast.error(data.message || 'Failed to create instance');
      }
    } catch (err) {
      toast.error('Error creating instance');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle Show QR
  const handleShowQR = async (instanceId: string) => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsProcessingQR(prev => ({ ...prev, [instanceId]: true }));
    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/instance/qr', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instance_id: instanceId }),
      });
      const data = await response.json();

      if (data.status) {
        setQrCode(data.qr);
        setSelectedInstanceId(instanceId);
        setShowQR(true);
      } else {
        toast.error(data.message || 'Failed to fetch QR code');
      }
    } catch (err) {
      toast.error('Error fetching QR code');
    } finally {
      setIsProcessingQR(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  // Handle Delete Instance
  const handleDeleteInstance = async (instanceId: string) => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsProcessingDelete(prev => ({ ...prev, [instanceId]: true }));
    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/instance/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instanceId }),
      });
      const data = await response.json();

      if (data.status) {
        setInstances((prev) => prev.filter((instance) => instance._id !== instanceId));
        toast.success(data.message || 'Instance deleted successfully');
        const totalPages = Math.ceil((instances.length - 1) / instancesPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } else {
        toast.error(data.message || 'Failed to delete instance');
      }
    } catch (err) {
      toast.error('Error deleting instance: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessingDelete(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  // Handle Logout Instance
  const handleLogoutInstance = async (instanceId: string) => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsProcessingLogout(prev => ({ ...prev, [instanceId]: true }));
    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/instance/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ instanceId }),
      });
      const data = await response.json();

      if (data.status) {
        setInstances((prev) =>
          prev.map((instance) =>
            instance._id === instanceId
              ? { 
                  ...instance, 
                  whatsapp: { 
                    ...instance.whatsapp, 
                    status: 'disconnected',
                    phone: null,
                    profile: null
                  } 
                }
              : instance
          )
        );
        toast.success(data.message || 'Logged out successfully');
      } else {
        toast.error(data.message || 'Failed to log out');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      toast.error('Error logging out: ' + errorMessage);
    } finally {
      setIsProcessingLogout(prev => ({ ...prev, [instanceId]: false }));
    }
  };

  // Handle Edit Instance
  const handleEditInstance = async () => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (!editInstanceName.trim()) {
      toast.error('Please enter a valid name');
      return;
    }

    setIsProcessingEdit(prev => ({ ...prev, [editInstanceId!]: true }));
    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/instance/edit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceId: editInstanceId,
          name: editInstanceName,
        }),
      });
      const data = await response.json();

      if (data.status) {
        setInstances((prev) =>
          prev.map((instance) =>
            instance._id === editInstanceId
              ? { ...instance, name: editInstanceName }
              : instance
          )
        );
        toast.success(data.message || 'Instance name updated successfully');
        setShowEditDialog(false);
        setEditInstanceId(null);
        setEditInstanceName('');
        setSelectedInstance(null);
      } else {
        toast.error(data.message || 'Failed to update instance name');
      }
    } catch (err) {
      toast.error('Error updating instance name: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsProcessingEdit(prev => ({ ...prev, [editInstanceId!]: false }));
    }
  };

  // Open Edit Dialog
  const openEditDialog = (instanceId: string, currentName: string | undefined) => {
    const instance = instances.find(inst => inst._id === instanceId);
    setEditInstanceId(instanceId);
    setEditInstanceName(currentName || '');
    setSelectedInstance(instance || null);
    setShowEditDialog(true);
  };

  // Handle Instances Per Page Change
  const handleInstancesPerPageChange = (value: string) => {
    const newPerPage = parseInt(value, 10);
    setInstancesPerPage(newPerPage);
    setCurrentPage(1);
  };

  // Pagination logic
  const indexOfLastInstance = currentPage * instancesPerPage;
  const indexOfFirstInstance = indexOfLastInstance - instancesPerPage;
  const currentInstances = instances.slice(indexOfFirstInstance, indexOfLastInstance);
  const totalPages = Math.ceil(instances.length / instancesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get status class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'disconnected':
        return 'bg-red-500/10 text-red-500 border border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto bg-zinc-950">
      <Toaster position="top-right" toastOptions={{ 
        duration: 3000,
        style: {
          background: '#18181b',
          color: '#fff',
          borderRadius: '8px',
        },
      }} />
      
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">
          WhatsApp Devices
        </h1>
        <Button
          className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-5 py-2 h-12 rounded-xl transition-all duration-300"
          onClick={handleCreateInstance}
          disabled={isCreating}
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-5 w-5" />
              Create Instance
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 text-zinc-500 animate-spin mb-4" />
            <p className="text-zinc-400">Loading instances...</p>
          </div>
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-zinc-800 rounded-xl bg-zinc-900/50">
          <div className="text-center p-8">
            <Phone className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-zinc-300 mb-2">No Devices Found</h3>
            <p className="text-zinc-500 mb-6 max-w-md">You don't have any WhatsApp instances yet. Create your first instance to get started.</p>
            <Button
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-5 h-12 rounded-xl transition-all duration-300"
              onClick={handleCreateInstance}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-5 w-5" />
                  Create First Instance
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentInstances.map((instance, index) => (
            <Card 
              key={instance._id} 
              className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 rounded-xl overflow-hidden transition-all duration-300"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {instance.whatsapp.profile ? (
                    <div className="relative">
                      <img
                        src={instance.whatsapp.profile}
                        alt="Profile"
                        className="w-14 h-14 rounded-full object-cover border-2 border-zinc-700"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-zinc-900 ${
                        instance.whatsapp.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700">
                        <span className="text-zinc-300 font-semibold">
                          {indexOfFirstInstance + index + 1}
                        </span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-zinc-900 ${
                        instance.whatsapp.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}></div>
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-zinc-200 font-medium">
                      {instance.whatsapp.phone || `WhatsApp Device ${indexOfFirstInstance + index + 1}`}
                    </span>
                    {instance.name && (
                      <span className="text-sm text-zinc-400 mt-0.5">
                        {instance.name}
                      </span>
                    )}
                    <div className="flex items-center mt-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${getStatusClass(instance.whatsapp.status)}`}
                      >
                        {instance.whatsapp.status === 'connected' ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-zinc-800/50 p-4 flex gap-2">
                {instance.whatsapp.status === 'connected' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/30"
                    onClick={() => handleLogoutInstance(instance._id)}
                    disabled={isProcessingLogout[instance._id]}
                  >
                    {isProcessingLogout[instance._id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <LogOut className="mr-1.5 h-4 w-4" />
                        Log Out
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/30"
                    onClick={() => handleShowQR(instance._id)}
                    disabled={isProcessingQR[instance._id]}
                  >
                    {isProcessingQR[instance._id] ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <QrCode className="mr-1.5 h-4 w-4" />
                        Show QR
                      </>
                    )}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700"
                  onClick={() => openEditDialog(instance._id, instance.name)}
                  disabled={isProcessingEdit[instance._id]}
                >
                  {isProcessingEdit[instance._id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Edit className="mr-1.5 h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20 hover:border-red-500/30"
                  onClick={() => handleDeleteInstance(instance._id)}
                  disabled={isProcessingDelete[instance._id]}
                >
                  {isProcessingDelete[instance._id] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {instances.length > instancesPerPage && (
        <div className="flex justify-between items-center mt-8 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm">
              Showing {indexOfFirstInstance + 1}-{Math.min(indexOfLastInstance, instances.length)} of {instances.length} instances
            </span>
          </div>
          
          <div className="flex items-center">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full transition-all duration-200 ${
                currentPage === 1
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-9 w-9 rounded-full transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                      : 'bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  aria-label={`Page ${page}`}
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full transition-all duration-200 ${
                currentPage === totalPages
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              aria-label="Next page"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* QR Code Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Connect WhatsApp Device</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Scan this QR code with your WhatsApp mobile app to connect
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start justify-between p-6 gap-8">
            <div className="flex-shrink-0">
              {qrCode ? (
                <div className="bg-white p-4 rounded-lg overflow-hidden transition-all duration-300 animate-in fade-in-0">
                  <img src={qrCode} alt="QR Code" className="max-w-[300px]" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] w-[300px]">
                  <Loader2 className="h-10 w-10 text-zinc-500 animate-spin mb-4" />
                  <p className="text-zinc-400">Generating QR code...</p>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="space-y-6">
                <div className="bg-zinc-800/50 border border-zinc-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-zinc-200 mb-4">How to Connect</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-sm">1</div>
                      <p className="text-zinc-300">Open WhatsApp on your phone</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-sm">2</div>
                      <p className="text-zinc-300">Tap Menu or Settings and select Linked Devices</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-sm">3</div>
                      <p className="text-zinc-300">Tap on "Link a Device"</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-300 text-sm">4</div>
                      <p className="text-zinc-300">Point your phone to this screen to capture the code</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <p className="text-emerald-400 text-sm">
                    Once connected, you'll be able to use WhatsApp on this device
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Connection Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-center">
              <span className="text-emerald-400">
                WhatsApp Connected Successfully!
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center p-6">
            {connectedInstance && (
              <div className="flex flex-col items-center animate-in fade-in-0 zoom-in-95">
                {connectedInstance.whatsapp.profile ? (
                  <div className="relative">
                    <img
                      src={connectedInstance.whatsapp.profile}
                      alt="WhatsApp Profile"
                      className="w-24 h-24 rounded-full mb-4 border-4 border-emerald-500/20"
                    />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-zinc-900"></div>
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center mb-4 border-4 border-emerald-500/20">
                    <Phone className="h-12 w-12 text-emerald-400" />
                  </div>
                )}
                <p className="text-lg font-medium text-zinc-200 mt-4">
                  {connectedInstance.whatsapp.phone || 'Unknown'}
                </p>
                {connectedInstance.name && (
                  <p className="text-sm text-zinc-400 mt-1">
                    {connectedInstance.name}
                  </p>
                )}
                <div className="mt-6 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-sm text-emerald-400 w-full text-center">
                  <p>Your WhatsApp account is now successfully connected and ready to use!</p>
                </div>
                <Button
                  className="mt-6 bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-6 py-2 h-12 rounded-xl transition-all duration-300"
                  onClick={() => setShowSuccessDialog(false)}
                >
                  Continue
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Instance Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setEditInstanceId(null);
          setEditInstanceName('');
          setSelectedInstance(null);
        }
      }}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-200 rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Edit Device Name</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Give your WhatsApp device a memorable name
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center p-6">
            {selectedInstance && (
              <div className="mb-6 flex flex-col items-center">
                {selectedInstance.whatsapp.profile ? (
                  <div className="relative flex justify-center">
                    <img
                      src={selectedInstance.whatsapp.profile}
                      alt="WhatsApp Profile"
                      className="w-20 h-20 rounded-full border-4 border-zinc-700/50"
                    />
                    <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-zinc-900 ${
                      selectedInstance.whatsapp.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                ) : (
                  <div className="relative flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center border-4 border-zinc-700/50">
                      <Phone className="h-8 w-8 text-zinc-400" />
                    </div>
                    <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-zinc-900 ${
                      selectedInstance.whatsapp.status === 'connected' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}></div>
                  </div>
                )}
                <p className="text-center mt-3 text-zinc-300">
                  {selectedInstance.whatsapp.phone || 'WhatsApp Device'}
                </p>
              </div>
            )}
            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label htmlFor="instanceName" className="text-sm font-medium text-zinc-400">
                  *Instance Name
                </label>
                <Input
                  id="instanceName"
                  value={editInstanceName}
                  onChange={(e) => setEditInstanceName(e.target.value)}
                  placeholder="Enter device name"
                  className="bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-zinc-600"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  className="text-zinc-300 border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
                  onClick={() => {
                    setShowEditDialog(false);
                    setEditInstanceId(null);
                    setEditInstanceName('');
                    setSelectedInstance(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-zinc-800 hover:bg-zinc-700 text-white"
                  onClick={handleEditInstance}
                  disabled={!editInstanceName.trim() || isProcessingEdit[editInstanceId!]}
                >
                  {isProcessingEdit[editInstanceId!] ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}