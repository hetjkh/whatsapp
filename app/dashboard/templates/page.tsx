"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X, Plus, FileText, Bold, Italic, Strikethrough, List, Quote, Code, Eye, Edit, Trash, Link } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

interface Button {
  name: string;
  type: 'REPLY' | 'URL' | 'PHONE_NUMBER' | 'UNSUBSCRIBE';
  url?: string;
}

interface Template {
  _id?: string;
  name: string;
  messageType: string;
  template: {
    header?: string;
    message: string;
    footer?: string;
    button?: Button[];
  };
}

export default function Templates() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [messageType, setMessageType] = useState('');
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [buttons, setButtons] = useState<Button[]>([{ name: '', type: 'REPLY' }]);
  const [header, setHeader] = useState('');
  const [footer, setFooter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTemplates, setTotalTemplates] = useState(0);
  const templatesPerPage = 10;
  const editorRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const fetchTemplates = async () => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/template/all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page: currentPage, limit: templatesPerPage }),
      });
      const data = await response.json();
      if (data.status) {
        const validTemplates = (data.templates || []).filter(
          (template: Template) => template && template._id
        );
        setTemplates(validTemplates);
        setTotalTemplates(data.total || 0);
        console.log('Fetched templates:', data.templates);
      } else {
        toast.error(data.message || 'Failed to fetch templates');
      }
    } catch (err) {
      toast.error('Error fetching templates: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [router, currentPage]);

  const totalPages = Math.ceil(totalTemplates / templatesPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const initializeEditorContent = useCallback((content: string) => {
    if (editorRef.current) {
      editorRef.current.innerText = content;
      setMessage(content);
    }
  }, []);

  const handleOpenModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name || '');
      setMessageType(template.messageType || '');
      setMessage(template.template.message || '');
      setButtons(
        template.template.button?.map(btn => ({
          name: btn.name || btn.title || '',
          type: btn.type as 'REPLY' | 'URL' | 'PHONE_NUMBER' | 'UNSUBSCRIBE',
          url: btn.url,
        })) || [{ name: '', type: 'REPLY' }]
      );
      setHeader(template.messageType === 'Buttons' ? template.template.header || '' : '');
      setFooter(template.messageType === 'Buttons' ? template.template.footer || '' : '');
      initializeEditorContent(template.template.message || '');
    } else {
      setEditingTemplate(null);
      setTemplateName('');
      setMessageType('');
      setMessage('');
      setButtons([{ name: '', type: 'REPLY' }]);
      setHeader('');
      setFooter('');
      initializeEditorContent('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTemplateName('');
    setMessageType('');
    setMessage('');
    setButtons([{ name: '', type: 'REPLY' }]);
    setHeader('');
    setFooter('');
    setEditingTemplate(null);
    if (editorRef.current) {
      editorRef.current.innerText = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: templateName,
        messageType,
        template: {
          ...(messageType === 'Buttons' && { header: header || undefined }),
          message: editorRef.current?.innerText || '',
          ...(messageType === 'Buttons' && { footer: footer || undefined }),
          ...(messageType === 'Buttons' && {
            button: buttons
              .filter(btn => btn.name.trim() !== '')
              .map(btn => ({
                type: btn.type,
                title: btn.name,
                ...(btn.type === 'URL' && { url: btn.url }),
              })),
          }),
        },
      };

      const response = await fetch('https://whatsapp.recuperafly.com/api/template/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (data.status && data.data) {
        if (editingTemplate && editingTemplate._id) {
          setTemplates(templates.map(t => (t._id === editingTemplate._id ? data.data : t)));
          toast.success('Template updated successfully');
        } else {
          if (data.data._id) {
            setCurrentPage(1);
            await fetchTemplates();
            toast.success('Template created successfully');
          } else {
            toast.error('Created template missing _id');
          }
        }
        handleCloseModal();
      } else {
        toast.error(data.message || 'Failed to save template');
      }
    } catch (err) {
      toast.error('Error saving template: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyFormatting = (format: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(format, false, format === 'formatBlock' ? 'blockquote' : undefined);
    setMessage(editor.innerText);
  };

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

  const handleDelete = async (id: string) => {
    const token = Cookies.get('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setIsDeleting(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch('https://whatsapp.recuperafly.com/api/template/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateId: id }),
      });
      const data = await response.json();

      if (data.status) {
        setTemplates(templates.filter(t => t._id !== id));
        setTotalTemplates(totalTemplates - 1);
        toast.success(data.message || 'Template deleted successfully');
      } else {
        toast.error(data.message || 'Failed to delete template');
      }
    } catch (err) {
      toast.error('Error deleting template: ' + err.message);
    } finally {
      setIsDeleting(prev => ({ ...prev, [id]: false }));
    }
  };

  const handlePreview = (template: Template) => {
    let content = `Message:\n${template.template.message || 'N/A'}`;
    if (template.messageType === 'Buttons') {
      if (template.template.header) {
        content = `Header: ${template.template.header}\n${content}`;
      }
      if (template.template.button && template.template.button.length > 0) {
        content += `\nButtons:\n${template.template.button.map((btn, idx) => `Button ${idx + 1}: ${btn.title || btn.name || 'N/A'} (${btn.type})${btn.url ? ` - URL: ${btn.url}` : ''}`).join('\n')}`;
      }
      if (template.template.footer) {
        content += `\nFooter: ${template.template.footer}`;
      }
    }
    setPreviewContent(content);
    setIsPreviewOpen(true);
  };

  const handleButtonChange = (index: number, field: keyof Button, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    if (field === 'type' && value !== 'URL') {
      delete newButtons[index].url;
    }
    setButtons(newButtons);
  };

  const addButton = () => {
    setButtons([...buttons, { name: '', type: 'REPLY' }]);
  };

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

  return (
    <div className="space-y-8 p-8">
      <Toaster position="top-right" toastOptions={{ 
        duration: 3000,
        style: {
          background: '#333',
          color: '#fff',
          borderRadius: '8px',
          padding: '16px',
        },
      }} />
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-200">Templates</h1>
          <p className="text-zinc-400 mt-2 text-lg">Manage your message templates</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 px-6 py-3 text-base"
          disabled={isLoading}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Template
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="text-zinc-400 text-lg">Loading templates...</p>
          </div>
        </div>
      ) : templates.length > 0 ? (
        <>
          <Card className="bg-black border-zinc-800 p-8">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800">
                  <TableHead className="text-zinc-400 font-semibold text-lg py-4">ID</TableHead>
                  <TableHead className="text-zinc-400 font-semibold text-lg py-4">Name</TableHead>
                  <TableHead className="text-zinc-400 font-semibold text-lg py-4">Message Type</TableHead>
                  <TableHead className="text-zinc-400 font-semibold text-lg py-4">Message</TableHead>
                  <TableHead className="text-zinc-400 font-semibold text-lg py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map(template => (
                  <TableRow key={template._id || Math.random().toString()} className="border-zinc-800">
                    <TableCell className="text-zinc-200 py-4">{template._id || 'N/A'}</TableCell>
                    <TableCell className="text-zinc-200 py-4">{template.name || 'Unnamed'}</TableCell>
                    <TableCell className="text-zinc-200 py-4">{template.messageType || 'N/A'}</TableCell>
                    <TableCell className="text-zinc-200 py-4">
                      <Button
                        variant="ghost"
                        onClick={() => handlePreview(template)}
                        className="text-zinc-400 hover:text-zinc-200 text-base"
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        Preview
                      </Button>
                    </TableCell>
                    <TableCell className="text-zinc-200 py-4">
                      <div className="flex gap-4">
                        <Button
                          variant="ghost"
                          onClick={() => handleOpenModal(template)}
                          className="text-zinc-400 hover:text-zinc-200 text-base"
                          disabled={isDeleting[template._id || ''] || !template._id}
                        >
                          <Edit className="h-5 w-5 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => template._id && handleDelete(template._id)}
                          className="text-zinc-400 hover:text-zinc-200 text-base"
                          disabled={isDeleting[template._id || ''] || !template._id}
                        >
                          {isDeleting[template._id || ''] ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Trash className="h-5 w-5 mr-2" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="flex justify-between items-center mt-6">
            <p className="text-zinc-400 text-lg">
              Showing {(currentPage - 1) * templatesPerPage + 1} to{' '}
              {Math.min(currentPage * templatesPerPage, totalTemplates)} of {totalTemplates} templates
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || isLoading}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 px-6 py-3 text-base"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || isLoading}
                className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 px-6 py-3 text-base"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        <Card className="bg-black border-zinc-800 p-8">
          <p className="text-zinc-400 text-center text-lg">No templates available. Add a template to get started.</p>
        </Card>
      )}

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="bg-black border-zinc-800 text-zinc-200 max-w-lg p-8 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">Template Preview</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-zinc-400 text-lg leading-relaxed whitespace-pre-wrap mt-4">
            {previewContent}
          </DialogDescription>
        </DialogContent>
      </Dialog>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-black border-zinc-800 p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold text-white">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <Button
                variant="ghost"
                onClick={handleCloseModal}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <label className="text-base font-medium text-zinc-400 mb-2 block">Title</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                    <Input
                      className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base rounded-md"
                      placeholder="Enter template name"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className Yisummary="text-base font-medium text-zinc-400 mb-2 block">Message Type</label>
                  <div className="relative">
                    <select
                      className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 h-12 text-base"
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                    >
                      <option value="" disabled>Select message type</option>
                      <option value="Text">Text</option>
                      <option value="Buttons">Buttons</option>
                    </select>
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  </div>
                </div>
              </div>
              {messageType === 'Buttons' && (
                <>
                  <div className="grid gap-3">
                    <label className="text-base font-medium text-zinc-400 mb-2 block">Header</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                      <Input
                        className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base rounded-md"
                        placeholder="Enter header text"
                        value={header}
                        onChange={(e) => setHeader(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <label className="text-base font-medium text-zinc-400 mb-2 block">Footer</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                      <Input
                        className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base rounded-md"
                        placeholder="Enter footer text"
                        value={footer}
                        onChange={(e) => setFooter(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="grid gap-3">
                <label className="text-base font-medium text-zinc-400 mb-2 block">Message</label>
                <div className="space-y-4">
                  <div className="flex gap-3 flex-wrap items-center">
                    <select
                      className="pl-3 pr-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 h-10 text-base"
                      onChange={(e) => handleVariableSelect(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Insert variable</option>
                      <option value="name">Name</option>
                      <option value="number">Number</option>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i} value={`variable ${i + 1}`}>
                          Variable {i + 1}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('bold')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10 px-4"
                    >
                      <Bold className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('italic')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10 px-4"
                    >
                      <Italic className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('strikeThrough')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10 px-4"
                    >
                      <Strikethrough className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('insertUnorderedList')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10 px-4"
                    >
                      <List className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('formatBlock')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10 px-4"
                    >
                      <Quote className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('code')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10 px-4"
                    >
                      <Code className="h-5 w-5" />
                    </Button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md p-4 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-zinc-700 text-lg"
                    onInput={handleInput}
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '18px',
                    }}
                  />
                </div>
              </div>
              {messageType === 'Buttons' && (
                <div className="grid gap-4">
                  <label className="text-base font-medium text-zinc-400 mb-2 block">Buttons</label>
                  {buttons.map((button, index) => (
                    <div key={index} className="bg-zinc-950 p-6 rounded-md space-y-4">
                      <h3 className="text-lg font-bold text-zinc-200">{`Button ${index + 1}`}</h3>
                      <div className="flex flex-col sm:flex-row gap-6 items-start">
                        <div className="flex-1">
                          <label className="text-base font-medium text-zinc-400 mb-2 block">Title</label>
                          <Input
                            className="bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base rounded-md"
                            placeholder={`Enter title for Button ${index + 1}`}
                            value={button.name}
                            onChange={(e) => handleButtonChange(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-base font-medium text-zinc-400 mb-2 block">Type</label>
                          <select
                            className="w-full pl-3 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 h-12 text-base"
                            value={button.type}
                            onChange={(e) => handleButtonChange(index, 'type', e.target.value as Button['type'])}
                          >
                            <option value="REPLY">Quick Reply</option>
                            <option value="URL">URL</option>
                            <option value="PHONE_NUMBER">Phone Number</option>
                            <option value="UNSUBSCRIBE">Unsubscribe</option>
                          </select>
                        </div>
                      </div>
                      {button.type === 'URL' && (
                        <div className="flex-1">
                          <label className="text-base font-medium text-zinc-400 mb-2 block">URL</label>
                          <div className="relative">
                            <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <Input
                              className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base rounded-md"
                              placeholder="Enter URL"
                              value={button.url || ''}
                              onChange={(e) => handleButtonChange(index, 'url', e.target.value)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addButton}
                    className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10 px-6 mt-4"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Button
                  </Button>
                </div>
              )}
              <div className="flex justify-end gap-4 mt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-12 px-6 text-base"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 h-12 px-6 text-base"
                  disabled={
                    !templateName ||
                    !messageType ||
                    !editorRef.current?.innerText ||
                    (messageType === 'Buttons' && buttons.every(btn => btn.name.trim() === '')) ||
                    (messageType === 'Buttons' && buttons.some(btn => btn.type === 'URL' && !btn.url)) ||
                    isSubmitting
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {editingTemplate ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingTemplate ? 'Update Template' : 'Add Template'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}