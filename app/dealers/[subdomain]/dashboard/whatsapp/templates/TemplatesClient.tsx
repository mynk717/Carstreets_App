// app/dealers/[subdomain]/dashboard/whatsapp/templates/TemplatesClient.tsx
"use client";

import { useState } from "react";
import {
  MessageSquare,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
} from "lucide-react";

type Template = {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  headerType: string | null;
  headerText: string | null;
  bodyText: string;
  footerText: string | null;
  buttons: any;
  metaTemplateId: string | null;
  createdAt: Date;
};

export default function TemplatesClient({
  subdomain,
  dealer,
  templates: initialTemplates,
}: {
  subdomain: string;
  dealer: any;
  templates: Template[];
}) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [syncing, setSyncing] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  // Sync templates from Meta API
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(
        `/api/dealers/${subdomain}/whatsapp/templates/sync`,
        { method: "POST" }
      );
      const data = await res.json();

      if (data.success) {
        alert(`Synced ${data.synced} templates from Meta`);
        window.location.reload();
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Sync error: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
      PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300",
      REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
    };

    const icons = {
      APPROVED: <CheckCircle2 className="w-4 h-4" />,
      PENDING: <Clock className="w-4 h-4" />,
      REJECTED: <XCircle className="w-4 h-4" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${
          styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"
        }`}
      >
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Message Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Create and manage WhatsApp message templates for bulk campaigns
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSync}
            disabled={syncing || !dealer.whatsappBusinessVerified}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync from Meta"}
          </button>

          <button
            onClick={() => setShowCreateForm(true)}
            disabled={!dealer.whatsappBusinessVerified}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            Create Template
          </button>
        </div>
      </div>

      {/* WhatsApp Not Connected Warning */}
      {!dealer.whatsappBusinessVerified && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            ⚠️ WhatsApp Business is not connected. Please connect your account
            in Settings to create templates.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Templates"
          value={templates.length}
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <StatCard
          label="Approved"
          value={templates.filter((t) => t.status === "APPROVED").length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          accent="text-green-600"
        />
        <StatCard
          label="Pending"
          value={templates.filter((t) => t.status === "PENDING").length}
          icon={<Clock className="w-5 h-5" />}
          accent="text-yellow-600"
        />
        <StatCard
          label="Rejected"
          value={templates.filter((t) => t.status === "REJECTED").length}
          icon={<XCircle className="w-5 h-5" />}
          accent="text-red-600"
        />
      </div>

      {/* Templates List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Templates
          </h2>

          {templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No templates yet</p>
              <p className="text-sm">
                Create your first template to start sending bulk messages
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        {getStatusBadge(template.status)}
                        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-900 rounded">
                          {template.category}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                        {template.bodyText}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Language: {template.language}</span>
                        <span>
                          Created: {new Date(template.createdAt).toLocaleDateString()}
                        </span>
                        {template.metaTemplateId && (
                          <span className="text-blue-600 dark:text-blue-400">
                            ✓ Synced with Meta
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="ml-4 p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      title="Preview Template"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <CreateTemplateModal
          subdomain={subdomain}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Preview Modal */}
      {selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
}

// Stats Card Component
function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <div className={accent || "text-gray-400"}>{icon}</div>
      </div>
      <p className={`text-3xl font-semibold ${accent || "text-gray-900 dark:text-white"}`}>
        {value}
      </p>
    </div>
  );
}

// Create Template Modal
function CreateTemplateModal({
  subdomain,
  onClose,
}: {
  subdomain: string;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    language: "en_US",
    category: "MARKETING",
    bodyText: "",
    footerText: "",
  });
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch(`/api/dealers/${subdomain}/whatsapp/templates/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        alert("Template created and submitted to Meta for approval!");
        window.location.reload();
      } else {
        alert(`Failed: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Template
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Templates require Meta approval (15-30 minutes)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., car_inquiry_response"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utility</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language *
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="en_US">English (US)</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </select>
            </div>
          </div>

          <div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Message Body * (Use {'{1}'}, {'{2}'} for variables)
  </label>
  <textarea
    value={formData.bodyText}
    onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
    placeholder="Hello {'{1}'}, thank you for your interest in {'{2}'}. Our team will contact you shortly!"
    required
    rows={4}
    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
  />
</div>


          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Footer (Optional)
            </label>
            <input
              type="text"
              value={formData.footerText}
              onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              placeholder="e.g., CarStreets - Your trusted dealer"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {creating ? "Creating..." : "Create & Submit for Approval"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Template Preview Modal
function TemplatePreviewModal({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Template Preview
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Name</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {template.name}
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {template.bodyText}
            </p>
            {template.footerText && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                {template.footerText}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Category</p>
              <p className="font-medium text-gray-900 dark:text-white">{template.category}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Language</p>
              <p className="font-medium text-gray-900 dark:text-white">{template.language}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
