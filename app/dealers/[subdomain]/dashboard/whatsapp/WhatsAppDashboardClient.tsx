'use client';

import { useState } from 'react';
import { MessageSquare, Users, Send, CheckCircle2, XCircle, Clock, Plus, Upload } from 'lucide-react';

type Contact = {
  id: string;
  phoneNumber: string;
  name: string | null;
  tags: string[];
  optedIn: boolean;
};

type Template = {
  id: string;
  name: string;
  bodyText: string;
  language: string;
  category: string;
};

type Message = {
  id: string;
  phoneNumber: string;
  status: string;
  createdAt: Date | string;
  contact: { name: string | null; phoneNumber: string } | null;
  template: { name: string } | null;
};

export default function WhatsAppDashboardClient({
  subdomain,
  dealer,
  initialContacts,
  initialTemplates,
  initialMessages,
}: {
  subdomain: string;
  dealer: any;
  initialContacts: Contact[];
  initialTemplates: Template[];
  initialMessages: Message[];
}) {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  const stats = {
    totalContacts: contacts.length,
    optedIn: contacts.filter((c) => c.optedIn).length,
    sent: messages.filter((m) => m.status === 'sent' || m.status === 'delivered').length,
    failed: messages.filter((m) => m.status === 'failed').length,
  };

  const handleSendBulk = async () => {
    if (selectedContacts.length === 0 || !selectedTemplate) {
      alert('Please select contacts and a template');
      return;
    }

    setSending(true);
    try {
      const res = await fetch(`/api/dealers/${subdomain}/whatsapp/send-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds: selectedContacts,
          templateName: templates.find((t) => t.id === selectedTemplate)?.name,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      alert(`Bulk send complete!\n✅ Sent: ${result.sent}\n❌ Failed: ${result.failed}`);
      setSelectedContacts([]);
      setSelectedTemplate('');

      // Refresh messages
      const msgRes = await fetch(`/api/dealers/${subdomain}/whatsapp/messages`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData.messages);
      }
    } catch (e: any) {
      alert('Bulk send failed: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedContacts.length === contacts.filter((c) => c.optedIn).length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.filter((c) => c.optedIn).map((c) => c.id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">
            WhatsApp Bulk Messaging
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Send promotional messages to your customers
          </p>
        </div>
        {!dealer.whatsappBusinessVerified && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ WhatsApp Business not connected
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Contacts" value={stats.totalContacts} icon={<Users />} />
        <StatCard label="Opted In" value={stats.optedIn} icon={<CheckCircle2 />} accent="text-green-600" />
        <StatCard label="Messages Sent" value={stats.sent} icon={<Send />} accent="text-blue-600" />
        <StatCard label="Failed" value={stats.failed} icon={<XCircle />} accent="text-red-600" />
      </div>

      {/* Bulk Send Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Send Bulk Message</h2>

        <div className="space-y-4">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Select Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3"
            >
              <option value="">Choose a template...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
            {selectedTemplate && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                {templates.find((t) => t.id === selectedTemplate)?.bodyText}
              </div>
            )}
          </div>

          {/* Contact Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                Select Contacts ({selectedContacts.length} selected)
              </label>
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                {selectedContacts.length === contacts.filter((c) => c.optedIn).length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg p-3 space-y-2">
              {contacts
                .filter((c) => c.optedIn)
                .map((contact) => (
                  <label key={contact.id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{contact.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{contact.phoneNumber}</p>
                    </div>
                    {contact.tags.length > 0 && (
                      <div className="flex gap-1">
                        {contact.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </label>
                ))}
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendBulk}
            disabled={sending || selectedContacts.length === 0 || !selectedTemplate}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Send className="w-5 h-5" />
            {sending ? `Sending to ${selectedContacts.length} contacts...` : `Send to ${selectedContacts.length} contacts`}
          </button>
        </div>
      </div>

      {/* Recent Messages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Recent Messages</h2>
        <div className="space-y-2">
          {messages.slice(0, 10).map((msg) => (
            <div
              key={msg.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {msg.contact?.name || msg.phoneNumber}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Template: {msg.template?.name || 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    msg.status === 'sent' || msg.status === 'delivered'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : msg.status === 'failed'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300'
                  }`}
                >
                  {msg.status}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
        <div className={`${accent || 'text-gray-400'}`}>{icon}</div>
      </div>
      <p className={`text-3xl font-semibold ${accent || 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}
