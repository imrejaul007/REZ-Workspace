"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import { Send, Paperclip, Mic, Smile, X, Image as ImageIcon } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachments.length > 0) {
      onSend(input.trim());
      setInput("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachments((prev) => [...prev, ...files]);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = input.trim().length > 0 || attachments.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative flex items-center gap-2 rounded-lg bg-surface-100 px-3 py-2 text-sm"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="h-4 w-4 text-surface-500" />
              ) : (
                <Paperclip className="h-4 w-4 text-surface-500" />
              )}
              <span className="max-w-[150px] truncate text-surface-600">
                {file.name}
              </span>
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="ml-1 text-surface-400 hover:text-surface-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div
        className={`relative flex items-end gap-2 rounded-2xl border bg-white px-4 py-2 transition-all ${
          isFocused
            ? "border-brand-500 shadow-md ring-2 ring-brand-500/20"
            : "border-surface-200 shadow-sm"
        }`}
      >
        {/* File Input Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={1}
          className="scrollbar-thin flex-1 resize-none bg-transparent py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none"
          style={{ maxHeight: "150px" }}
        />

        {/* Emoji Button */}
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
          title="Add emoji"
        >
          <Smile className="h-4 w-4" />
        </button>

        {/* Voice Input Button */}
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600"
          title="Voice input"
        >
          <Mic className="h-4 w-4" />
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!canSend}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
            canSend
              ? "bg-brand-500 text-white shadow-md hover:bg-brand-600 active:scale-95"
              : "bg-surface-100 text-surface-400"
          }`}
          title="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      {/* Helper Text */}
      <p className="mt-2 text-center text-xs text-surface-400">
        Press Enter to send, Shift + Enter for new line
      </p>
    </form>
  );
}
