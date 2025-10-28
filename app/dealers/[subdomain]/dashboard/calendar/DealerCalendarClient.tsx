'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Wand2,
  Sparkles,
  Eye,
  Pencil,
  RefreshCw,
  Facebook,
  Instagram,
  Linkedin,
  BadgeCheck,
  X,
  Maximize2,
} from 'lucide-react';

type ContentItem = {
  id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | string;
  status: 'draft' | 'pending' | 'requires_review' | 'approved' | 'scheduled' | 'posted';
  textContent: string | null;
  createdAt: string | Date;
  scheduledDate?: string | Date | null;
  brandedImage?: string | null;
  generatedImage?: string | null;
  finalImage?: string | null;
  car?: { title?: string | null; brand?: string | null; model?: string | null; images?: string[] | null };
};

export default function DealerCalendarClient({
  calendar,
  subdomain,
  dealerName,
}: {
  calendar: ContentItem[];
  subdomain: string;
  dealerName: string;
}) {
  const [items, setItems] = useState<ContentItem[]>(calendar || []);
  const [preview, setPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showPlain, setShowPlain] = useState<boolean>(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const stats = useMemo(
    () => ({
      total: items.length,
      scheduled: items.filter((i) => i.status === 'scheduled').length,
      posted: items.filter((i) => i.status === 'posted').length,
      pending:
        items.filter((i) => i.status === 'pending' || i.status === 'requires_review' || i.status === 'draft').length,
    }),
    [items]
  );

  // Helpers
  const stripMarkdown = (t?: string | null) =>
    (t || '')
      .replace(/[*_`>#\-]+/g, ' ')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/\s{2,}/g, ' ')
      .trim();

  const stripEmojis = (t?: string | null) => (t || '').replace(
    /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF])/g,
    ''
  );

  const platformPill = (p: string) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1';
    switch (p) {
      case 'facebook':
        return { cls: `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300`, icon: <Facebook className="w-3.5 h-3.5" /> };
      case 'instagram':
        return { cls: `${base} bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300`, icon: <Instagram className="w-3.5 h-3.5" /> };
      case 'linkedin':
        return { cls: `${base} bg-sky-100 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300`, icon: <Linkedin className="w-3.5 h-3.5" /> };
      default:
        return { cls: `${base} bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300`, icon: <CalendarIcon className="w-3.5 h-3.5" /> };
    }
  };

  const statusPill = (s: ContentItem['status']) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full';
    switch (s) {
      case 'posted':
        return `${base} bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300`;
      case 'scheduled':
        return `${base} bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300`;
      case 'approved':
        return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300`;
      case 'pending':
      case 'requires_review':
        return `${base} bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300`;
      default:
        return `${base} bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300`;
    }
  };

  const imageFor = (i: ContentItem) => i.finalImage || i.brandedImage || i.generatedImage || i.car?.images?.[0] || null;

  // Actions
  const approve = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/content/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'approved' } : x)));
    } finally {
      setBusyId(null);
    }
  };

  const schedule = async (id: string, when?: Date) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/content/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'scheduled', scheduledDate: (when || new Date()).toISOString() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'scheduled', scheduledDate: when || new Date() } : x)));
    } finally {
      setBusyId(null);
    }
  };

  const regenerateText = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/content/${id}/regenerate`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, textContent: data.textContent || x.textContent } : x)));
    } finally {
      setBusyId(null);
    }
  };

  const saveText = async (id: string, text: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/content/${id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: text }),
      });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, textContent: text } : x)));
      setEditing(null);
    } finally {
      setBusyId(null);
    }
  };

  const regenerateImage = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/content/${id}/image/regenerate`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, generatedImage: data.imageUrl, brandedImage: data.imageUrl } : x)));
    } finally {
      setBusyId(null);
    }
  };

  const editImageWithBanana = async (id: string, backgroundUrl: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/content/${id}/image/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backgroundUrl }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, finalImage: data.editedImageUrl } : x)));
    } finally {
      setBusyId(null);
    }
  };

  const renderText = (id: string, raw?: string | null) => {
    const base = showPlain ? stripEmojis(stripMarkdown(raw)) : stripMarkdown(raw);
    const isExpanded = !!expanded[id];
    const limit = 220; // characters visible when collapsed
    const needsClamp = base.length > limit;
    const display = !needsClamp || isExpanded ? base : base.slice(0, limit) + '…';

    return (
      <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-6">
        {display}
        {needsClamp && (
          <button
            onClick={() => setExpanded((s) => ({ ...s, [id]: !s[id] }))}
            className="ml-2 text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">Content Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review and manage AI-generated content for {dealerName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
            <input type="checkbox" checked={showPlain} onChange={(e) => setShowPlain(e.target.checked)} />
            Plain-text mode (hide emojis)
          </label>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Content" value={stats.total} />
        <StatCard label="Scheduled" value={stats.scheduled} accent="text-blue-600" />
        <StatCard label="Posted" value={stats.posted} accent="text-green-600" />
        <StatCard label="Pending Review" value={stats.pending} accent="text-yellow-600" />
      </div>

      {/* Items */}
      <div className="space-y-4">
        {items.length === 0 ? (
          <EmptyState subdomain={subdomain} />
        ) : (
          items.map((item) => {
            const img = imageFor(item);
            const pill = platformPill(item.platform);
            return (
              <div key={item.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  {/* Left column: pills and text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={pill.cls}>{pill.icon}<span className="capitalize">{item.platform}</span></span>
                      <span className={statusPill(item.status)}>{item.status.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-2">
                      <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                      {item.scheduledDate && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.scheduledDate).toLocaleString()}</span>
                        </>
                      )}
                    </div>

                    {renderText(item.id, item.textContent)}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {(item.status === 'pending' || item.status === 'requires_review') && (
                        <button
                          onClick={() => approve(item.id)}
                          disabled={busyId === item.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-md hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <BadgeCheck className="w-4 h-4" /> Approve
                        </button>
                      )}
                      <button
                        onClick={() => schedule(item.id)}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        <CalendarIcon className="w-4 h-4" /> Schedule
                      </button>
                      <button
                        onClick={() => setEditing({ id: item.id, text: stripMarkdown(item.textContent || '') })}
                        className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Pencil className="w-4 h-4" /> Edit Text
                      </button>
                      <button
                        onClick={() => regenerateText(item.id)}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <RefreshCw className="w-4 h-4" /> Regenerate Text
                      </button>
                      <button
                        onClick={() => regenerateImage(item.id)}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <Wand2 className="w-4 h-4" /> Regenerate Image
                      </button>
                      <button
                        onClick={() => {
                          const url = prompt('Paste background image URL for banana edit (yard/showroom):');
                          if (url) editImageWithBanana(item.id, url);
                        }}
                        disabled={busyId === item.id}
                        className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        <Sparkles className="w-4 h-4" /> Edit Image (banana)
                      </button>
                      <button
  onClick={async () => {
    if (!confirm('Delete this content permanently?')) return;
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/content/${item.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) => prev.filter((x) => x.id !== item.id));
    } finally {
      setBusyId(null);
    }
  }}
  disabled={busyId === item.id}
  className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 text-red-600 border-red-200 dark:border-red-900"
>
  Remove
</button>
                      {img && (
                        <button
                          onClick={() => setPreview(img)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 border text-xs rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Eye className="w-4 h-4" /> Preview
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right column: big preview */}
                  {img && (
                    <button onClick={() => setPreview(img)} className="group relative shrink-0">
                      {/* Use next/image for perf; enlarge and maintain aspect */}
                      <Image
                        src={img}
                        alt="Content"
                        width={320}
                        height={200}
                        className="w-80 h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                        unoptimized
                      />
                      <span className="absolute bottom-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition">
                        <Maximize2 className="w-4 h-4" />
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <button className="absolute top-4 right-4 text-white" onClick={() => setPreview(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={preview} alt="Preview" className="max-h-[85vh] max-w-[92vw] rounded-xl shadow-2xl border border-white/20 object-contain" />
        </div>
      )}

      {/* Text edit modal */}
      {/* Text edit modal */}
{editing && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Edit Post Text</h3>
        <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          <X className="w-5 h-5" />
        </button>
      </div>
      <textarea
        value={editing.text}
        onChange={(e) => setEditing((s) => (s ? { ...s, text: e.target.value } : s))}
        rows={10}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3 focus:ring-2 focus:ring-blue-500"
        placeholder="Write a concise, platform-friendly caption…"
      />
      <div className="flex items-center justify-end gap-3 mt-3">
        <button onClick={() => setEditing(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
        <button
          onClick={() => saveText(editing.id, editing.text)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          disabled={busyId === editing.id}
        >
          {busyId === editing.id ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
      <p className={`text-3xl font-semibold mt-1 ${accent || 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

function EmptyState({ subdomain }: { subdomain: string }) {
  return (
    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <Sparkles className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No content yet</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Generate your first AI-powered content from the Content Studio
      </p>
      <a
        href={`/dealers/${subdomain}/dashboard/content`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        <Sparkles className="w-5 h-5" />
        Generate Content
      </a>
    </div>
  );
}
