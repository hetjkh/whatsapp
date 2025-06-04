"use client";

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Plus, FileText, Bold, Italic, Strikethrough, List, Quote, Code, Eye, Edit, Trash, Upload, Link } from 'lucide-react';

interface Button {
  name: string;
  type: 'quick reply button' | 'call button' | 'url button' | 'unsubscibe button';
}

interface Template {
  id: string;
  name: string;
  messageType: string;
  message: string;
  mediaUrl?: string;
  mediaFile?: File;
  buttons?: Button[];
  footer?: string;
}

export default function Templates() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [messageType, setMessageType] = useState('');
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [mediaOption, setMediaOption] = useState<'gallery' | 'url'>('gallery');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [buttons, setButtons] = useState<Button[]>([{ name: '', type: 'quick_reply' }]);
  const [footer, setFooter] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenModal = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateName(template.name);
      setMessageType(template.messageType);
      setMessage(template.message);
      setMediaUrl(template.mediaUrl || '');
      setMediaFile(template.mediaFile || null);
      setButtons(template.buttons || [{ name: '', type: 'quick_reply' }]);
      setFooter(template.footer || '');
      setMediaOption(template.mediaUrl ? 'url' : 'gallery');
      if (editorRef.current) {
        editorRef.current.innerText = template.message;
      }
    } else {
      setEditingTemplate(null);
      setTemplateName('');
      setMessageType('');
      setMessage('');
      setMediaUrl('');
      setMediaFile(null);
      setButtons([{ name: '', type: 'quick_reply' }]);
      setFooter('');
      setMediaOption('gallery');
      if (editorRef.current) {
        editorRef.current.innerText = '';
      }
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTemplateName('');
    setMessageType('');
    setMessage('');
    setMediaOption('gallery');
    setMediaUrl('');
    setMediaFile(null);
    setButtons([{ name: '', type: 'quick_reply' }]);
    setFooter('');
    setEditingTemplate(null);
    if (editorRef.current) {
      editorRef.current.innerText = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTemplate: Template = {
      id: editingTemplate ? editingTemplate.id : Math.random().toString(36).substr(2, 9),
      name: templateName,
      messageType,
      message: editorRef.current?.innerText || '',
      mediaUrl: messageType.includes('media') && mediaOption === 'url' ? mediaUrl : undefined,
      mediaFile: messageType.includes('media') && mediaOption === 'gallery' ? mediaFile || undefined : undefined,
      buttons: ['buttons', 'button_with_media'].includes(messageType) ? buttons.filter(btn => btn.name.trim() !== '') : undefined,
      footer: footer || undefined,
    };

    if (editingTemplate) {
      setTemplates(templates.map(t => (t.id === editingTemplate.id ? newTemplate : t)));
    } else {
      setTemplates([...templates, newTemplate]);
    }
    handleCloseModal();
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

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handlePreview = (template: Template) => {
    let message = `Message:\n${template.message}`;
    if (template.mediaUrl) {
      message += `\nMedia URL: ${template.mediaUrl}`;
    } else if (template.mediaFile) {
      message += `\nMedia File: ${template.mediaFile.name}`;
    }
    if (template.buttons && template.buttons.length > 0) {
      message += `\nButtons:\n${template.buttons.map((btn, idx) => `Button ${idx + 1}: ${btn.name} (${btn.type})`).join('\n')}`;
    }
    if (template.footer) {
      message += `\nFooter: ${template.footer}`;
    }
    alert(message);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
    }
  };

  const handleButtonChange = (index: number, field: keyof Button, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const addButton = () => {
    setButtons([...buttons, { name: '', type: 'quick_reply' }]);
  };

  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-200">Templates</h1>
          <p className="text-zinc-400 mt-2">Manage your message templates</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {templates.length > 0 ? (
        <Card className="bg-black border-zinc-800 p-6">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">ID</TableHead>
                <TableHead className="text-zinc-400">Name</TableHead>
                <TableHead className="text-zinc-400">Message Type</TableHead>
                <TableHead className="text-zinc-400">Message</TableHead>
                <TableHead className="text-zinc-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(template => (
                <TableRow key={template.id} className="border-zinc-800">
                  <TableCell className="text-zinc-200">{template.id}</TableCell>
                  <TableCell className="text-zinc-200">{template.name}</TableCell>
                  <TableCell className="text-zinc-200">{template.messageType}</TableCell>
                  <TableCell className="text-zinc-200">
                    <Button
                      variant="ghost"
                      onClick={() => handlePreview(template)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </TableCell>
                  <TableCell className="text-zinc-200">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => handleOpenModal(template)}
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(template.id)}
                        className="text-zinc-400 hover:text-zinc-200"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card className="bg-black border-zinc-800 p-6">
          <p className="text-zinc-400 text-center">No templates available. Add a template to get started.</p>
        </Card>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-black border-zinc-800 p-8 w-full max-w-4xl h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-zinc-200">
                {editingTemplate ? 'Edit Template' : 'Create New Template'}
              </h2>
              <Button
                variant="ghost"
                onClick={handleCloseModal}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-3">
                <label className="text-base font-medium text-zinc-400">Title</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <Input
                    className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base"
                    placeholder="Enter template name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-3">
                <label className="text-base font-medium text-zinc-400">Message Type</label>
                <div className="relative">
                  <select
                    className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 h-12 text-base"
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                  >
                    <option value="" disabled>Select message type</option>
                    <option value="text">Text</option>
                    <option value="text_with_media">Text with media</option>
                    <option value="buttons">Buttons</option>
                    <option value="button_with_media">Button with media</option>
                    <option value="list">List</option>
                    <option value="list_with_media">List with media</option>
                    <option value="poll">Poll</option>
                    <option value="poll_with_media">Poll with media</option>
                  </select>
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                </div>
              </div>
              <div className="grid gap-3">
                <label className="text-base font-medium text-zinc-400">Message</label>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('bold')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10"
                    >
                      <Bold className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('italic')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10"
                    >
                      <Italic className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('strikeThrough')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10"
                    >
                      <Strikethrough className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('insertUnorderedList')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10"
                    >
                      <List className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('formatBlock')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10"
                    >
                      <Quote className="h-5 w-5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => applyFormatting('code')}
                      className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10"
                    >
                      <Code className="h-5 w-5" />
                    </Button>
                  </div>
                  <div
                    ref={editorRef}
                    contentEditable
                    className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md p-3 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-zinc-700 text-base"
                    onInput={handleInput}
                    style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: '16px',
                    }}
                  />
                </div>
              </div>

              {['text_with_media', 'button_with_media', 'list_with_media', 'poll_with_media'].includes(messageType) && (
                <div className="grid gap-3 bg-zinc-950 p-4 rounded-md">
                  <label className="text-base font-medium text-zinc-400">Media</label>
                  <div className="flex gap-3 mb-3">
                    <Button
                      type="button"
                      variant={mediaOption === 'gallery' ? 'default' : 'outline'}
                      onClick={() => setMediaOption('gallery')}
                      className={
                        mediaOption === 'gallery'
                          ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 h-10'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10'
                      }
                    >
                      Gallery
                    </Button>
                    <Button
                      type="button"
                      variant={mediaOption === 'url' ? 'default' : 'outline'}
                      onClick={() => setMediaOption('url')}
                      className={
                        mediaOption === 'url'
                          ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 h-10'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10'
                      }
                    >
                      URL
                    </Button>
                  </div>
                  {mediaOption === 'gallery' ? (
                    <div className="flex items-center gap-3">
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileChange}
                        className="bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10"
                        disabled={!mediaFile}
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Upload
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                      <Input
                        className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base"
                        placeholder="Enter media URL"
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}

              {['buttons', 'button_with_media'].includes(messageType) && (
                <div className="grid gap-3 bg-zinc-950 p-4 rounded-md">
                  <label className="text-base font-medium text-zinc-400">Footer</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-500" />
                    <Input
                      className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base"
                      placeholder="Enter footer text"
                      value={footer}
                      onChange={(e) => setFooter(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {['buttons', 'button_with_media'].includes(messageType) && (
                <div className="grid gap-3">
                  <label className="text-base font-medium text-zinc-400">Buttons</label>
                  {buttons.map((button, index) => (
                    <div key={index} className="bg-zinc-950 p-4 rounded-md space-y-3">
                      <h3 className="text-lg font-bold text-zinc-200">{`Button ${index + 1}`}</h3>
                      <div className="flex gap-4 items-start">
                        <div className="flex-1">
                          <label className="text-base font-medium text-zinc-400">Title</label>
                          <Input
                            className="bg-zinc-900 border-zinc-800 text-zinc-200 h-12 text-base mt-2"
                            placeholder={`Enter title for Button ${index + 1}`}
                            value={button.name}
                            onChange={(e) => handleButtonChange(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-base font-medium text-zinc-400">Type</label>
                          <select
                            className="w-full pl-3 pr-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-700 h-12 text-base mt-2"
                            value={button.type}
                            onChange={(e) => handleButtonChange(index, 'type', e.target.value as Button['type'])}
                          >
                            <option value="quick_reply">Quick Reply</option>
                            <option value="url">URL</option>
                            <option value="phone_number">Phone Number</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addButton}
                    className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10 mt-3"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add Button
                  </Button>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800 h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 h-10"
                  disabled={
                    !templateName ||
                    !messageType ||
                    !editorRef.current?.innerText ||
                    (messageType.includes('media') &&
                      mediaOption === 'gallery' &&
                      !mediaFile) ||
                    (messageType.includes('media') && mediaOption === 'url' && !mediaUrl) ||
                    (['buttons', 'button_with_media'].includes(messageType) &&
                      buttons.every(btn => btn.name.trim() === ''))
                  }
                >
                  {editingTemplate ? 'Update Template' : 'Add Template'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}