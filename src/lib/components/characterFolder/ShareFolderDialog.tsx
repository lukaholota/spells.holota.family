"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Link as LinkIcon, ShieldCheck } from "lucide-react";
import { generateFolderShareToken } from "@/lib/actions/share-actions";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface ShareFolderDialogProps {
  folderId: number;
  folderName?: string | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  noButtonTrigger?: boolean;
}

export function ShareFolderDialog({
  folderId,
  folderName,
  open: openOverride,
  onOpenChange: onOpenChangeOverride,
  noButtonTrigger: hideTrigger,
}: ShareFolderDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = openOverride !== undefined ? openOverride : internalOpen;
  const setIsOpen = onOpenChangeOverride !== undefined ? onOpenChangeOverride : setInternalOpen;

  const [token, setToken] = useState<string | null>(null);
  const [editToken, setEditToken] = useState<string | null>(null);
  const [editEnabled, setEditEnabled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingEdit, setIsGeneratingEdit] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editCopied, setEditCopied] = useState(false);

  useEffect(() => {
    setToken(null);
    setEditToken(null);
    setEditEnabled(false);
    setCopied(false);
    setEditCopied(false);
  }, [folderId]);

  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://char.holota.family").replace(/\/$/, "");

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateFolderShareToken(folderId, false);
    setIsGenerating(false);
    if (result.success && result.token) {
      setToken(result.token);
      toast.success("Посилання згенеровано!");
    } else {
      toast.error(result.error || "Не вдалося згенерувати посилання");
    }
  };

  const handleGenerateEdit = async () => {
    setIsGeneratingEdit(true);
    const result = await generateFolderShareToken(folderId, true);
    setIsGeneratingEdit(false);
    if (result.success && result.token) {
      setEditToken(result.token);
      toast.success("Посилання для редагування згенеровано!");
    } else {
      toast.error(result.error || "Не вдалося згенерувати посилання для редагування");
    }
  };

  const shareUrl = token && origin ? `${origin}/char/folder/share/${token}` : "";
  const editShareUrl = editToken && origin ? `${origin}/char/folder/share/${editToken}` : "";

  const copyToClipboard = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Посилання скопійовано!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyEditToClipboard = () => {
    if (!editShareUrl) return;
    navigator.clipboard.writeText(editShareUrl);
    setEditCopied(true);
    toast.success("Посилання скопійовано!");
    setTimeout(() => setEditCopied(false), 2000);
  };

  const titleSuffix = folderName ? `: ${folderName}` : "";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {hideTrigger !== true && (
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-white">
            <Share2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-[425px] overflow-hidden glass-card border-white/10 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Поділитися папкою{titleSuffix}
          </DialogTitle>
        </DialogHeader>

        <div className="w-full py-4 space-y-4 max-w-full min-w-0">
          <p className="text-sm text-slate-400">
            Згенеруйте посилання, щоб інші могли переглянути вашу папку (тільки для читання).
          </p>

          {token ? (
            <div className="w-full space-y-3 max-w-full">
              <div className="w-full flex min-w-0 max-w-full items-center gap-2 overflow-hidden p-2 bg-black/30 rounded border border-white/10">
                <code className="block min-w-0 max-w-full flex-1 truncate text-xs text-indigo-300">
                  {origin}/char/folder/share/{token.slice(0, 8)}...
                </code>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                Будь-хто з цим посиланням зможе бачити цю папку.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-slate-200"
            >
              {isGenerating ? "Генерація..." : "Згенерувати посилання"}
            </Button>
          )}

          <div className="rounded-lg border border-white/10 bg-black/20 p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Дати права на редагування
              </div>
              <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
            </div>

            <p className="text-xs text-slate-400">
              Увімкніть, щоб створити посилання з доступом до редагування. Будь-хто з цим посиланням зможе
              редагувати папку після входу.
            </p>

            {editEnabled && (
              <div className="space-y-3">
                {editToken ? (
                  <div className="w-full flex min-w-0 max-w-full items-center gap-2 overflow-hidden p-2 bg-black/30 rounded border border-white/10">
                    <code className="block min-w-0 max-w-full flex-1 truncate text-xs text-emerald-300">
                      {origin}/char/folder/share/{editToken.slice(0, 8)}...
                    </code>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={copyEditToClipboard}>
                      {editCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleGenerateEdit}
                    disabled={isGeneratingEdit}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-slate-200"
                  >
                    {isGeneratingEdit ? "Генерація..." : "Згенерувати посилання для редагування"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
