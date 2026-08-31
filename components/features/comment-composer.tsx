"use client";

import * as React from "react";
import { Paperclip, Link2, Send, Loader2, FileText, X } from "lucide-react";
import { MentionTextarea } from "@/components/features/mention-autocomplete";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { AppUser } from "@/lib/types";

export function CommentComposer({
  requestId,
  users,
  onPosted,
}: {
  requestId: string;
  users: AppUser[];
  onPosted: () => void;
}) {
  const { toast } = useToast();
  const [body, setBody] = React.useState("");
  const [mentionedIds, setMentionedIds] = React.useState<string[]>([]);
  const [files, setFiles] = React.useState<{ id: string; file_name: string }[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [posting, setPosting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`/api/requests/${requestId}/attachments`, { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) {
          toast({ title: "Falha ao enviar anexo", description: json.error, variant: "error" });
          continue;
        }
        setFiles((prev) => [...prev, { id: json.data.id, file_name: json.data.file_name }]);
      }
    } finally {
      setUploading(false);
    }
  }

  function insertLinkPrompt() {
    const url = window.prompt("Cole o link:");
    if (url) setBody((prev) => `${prev}${prev.endsWith(" ") || prev === "" ? "" : " "}${url} `);
  }

  async function handleSubmit() {
    if (!body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, mentioned_user_ids: mentionedIds, attachment_ids: files.map((f) => f.id) }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Não foi possível comentar", description: json.error, variant: "error" });
        return;
      }
      setBody("");
      setMentionedIds([]);
      setFiles([]);
      onPosted();
    } catch {
      toast({ title: "Supabase não configurado", variant: "error" });
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="border-t border-neutral-200 bg-white p-4 space-y-2">
      <MentionTextarea
        users={users}
        value={body}
        onChange={setBody}
        mentionedIds={mentionedIds}
        onMentionedIdsChange={setMentionedIds}
        placeholder="Escreva um comentário… use @ para mencionar alguém"
      />
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              <FileText className="h-3 w-3" /> {f.file_name}
              <button onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}>
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            title="Anexar arquivo"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          <button
            type="button"
            onClick={insertLinkPrompt}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            title="Inserir link"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={posting || !body.trim()}>
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Comentar
        </Button>
      </div>
    </div>
  );
}
