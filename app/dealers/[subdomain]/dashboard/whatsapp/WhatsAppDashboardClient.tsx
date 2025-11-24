'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Users,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Upload,
  Eye,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link' 

type Contact = {
  id: string
  phoneNumber: string
  name: string | null
  tags: string[]
  optedIn: boolean
}

type Template = {
  id: string
  name: string
  bodyText: string
  language: string
  category: string
  components?: Array<{
    type: string
    parameters?: Array<{ type: string; text?: string }>
  }>
}

type Message = {
  id: string
  phoneNumber: string
  status: string
  createdAt: Date | string
  contact: { name: string | null; phoneNumber: string } | null
  template: { name: string } | null
}

type MessageStats = {
  sent: number
  delivered: number
  failed: number
  read: number
}

export default function WhatsAppDashboardClient({
  subdomain,
  dealer,
  initialContacts,
  initialTemplates,
  initialMessages,
  initialStats,
}: {
  subdomain: string
  dealer: any
  initialContacts: Contact[]
  initialTemplates: Template[]
  initialMessages: Message[]
  initialStats?: MessageStats
}) {
  // ✅ Default stats
  const defaultStats: MessageStats = {
    sent: 0,
    delivered: 0,
    failed: 0,
    read: 0,
  }

  // ✅ FIX: Only state for data that changes
  const [contacts, setContacts] = useState<Contact[]>(initialContacts || [])
  const [messages, setMessages] = useState<Message[]>(initialMessages || [])
  const [stats, setStats] = useState<MessageStats>(initialStats || defaultStats)

  // ✅ Templates are static from server - don't need state
  const templates = initialTemplates || []

  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedTemplatePreview, setSelectedTemplatePreview] =
    useState<Template | null>(null)
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [templateParams, setTemplateParams] = useState<any[]>([]);
const [inputValues, setInputValues] = useState<{ [key: number]: any }>({});
const [products, setProducts] = useState<any[]>([]); 


useEffect(() => {
  if (selectedTemplate) {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      // NEW: if template.components exists, use those for param definition
      if (template.components && Array.isArray(template.components)) {
        const params: any[] = [];
        template.components.forEach(component => {
          if (component.parameters) {
            component.parameters.forEach(param => {
              params.push({ ...param, componentType: component.type });
            });
          }
        });
        setTemplateParams(params);
        setInputValues({}); // Reset any previous input
      } else {
        // Fallback legacy: text placeholders via bodyText
        const matches = template.bodyText.match(/\{\{\d+\}\}/g);
        setTemplateParams(
          matches?.map(() => ({ type: "text", text: "" })) || []
        );
        setInputValues({});
      }
    }
  }
}, [selectedTemplate, templates]);

useEffect(() => {
  if (!subdomain) return;
  // Use your cars/products endpoint. Adjust API path if needed.
  fetch(`/api/dealers/${subdomain}/cars`)
    .then((res) => res.json())
    .then((data) => {
      // Expecting { products: [{ id, name }, ...] }
      setProducts(Array.isArray(data.products) ? data.products : []);
    })
    .catch(() => setProducts([])); // Always set an array/failsafe
}, [subdomain]);


  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(
        `/api/dealers/${subdomain}/whatsapp/contacts/import`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!res.ok) throw new Error(await res.text())

      const result = await res.json()
      alert(`✅ Imported ${result.imported} contacts!`)

      // Refresh contacts
      const contactRes = await fetch(
        `/api/dealers/${subdomain}/whatsapp/contacts`
      )
      if (contactRes.ok) {
        const contactData = await contactRes.json()
        setContacts(contactData.contacts || [])
      }
    } catch (e: any) {
      alert('❌ Import failed: ' + e.message)
    } finally {
      setUploading(false)
    }
  }

  for (let i = 0; i < templateParams.length; i++) {
    if (!inputValues[i]) {
      alert(`Please provide value for parameter #${i + 1}`);
      return;
    }
  }
  
  const handleSendBulk = async () => {
    if (selectedContacts.length === 0 || !selectedTemplate) {
      alert('Please select contacts and a template')
      return
    }

    
    setSending(true)
    try {
      const res = await fetch(`/api/dealers/${subdomain}/whatsapp/send-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate,
          contactIds: selectedContacts,
          parameters: templateParams.map((param, i) => {
            if (param.type === "text")
              return { type: "text", text: inputValues[i] };
            if (param.type === "product")
              return { type: "product", product_retailer_id: inputValues[i] };
            if (param.type === "image")
              return { type: "image", image_id: inputValues[i] }; // Needs image uploading/logic
            // Add more as needed
            return null;
          }).filter(Boolean),
          
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Send failed')
      }

      const result = await res.json()

      alert(
        `✅ Sent to ${result.sent} contacts\n❌ Failed: ${result.failed}`
      )

      setSelectedContacts([])
      setSelectedTemplate('')

      // Refresh messages
      const msgRes = await fetch(`/api/dealers/${subdomain}/whatsapp/messages`)
      if (msgRes.ok) {
        const msgData = await msgRes.json()
        setMessages(msgData.messages || [])

        // Update stats
        const newStats: MessageStats = {
          sent: msgData.messages.filter((m: any) => m.status === 'sent').length,
          delivered: msgData.messages.filter(
            (m: any) => m.status === 'delivered'
          ).length,
          failed: msgData.messages.filter((m: any) => m.status === 'failed')
            .length,
          read: msgData.messages.filter((m: any) => m.status === 'read').length,
        }
        setStats(newStats)
      }
    } catch (e: any) {
      alert('❌ Bulk send failed: ' + e.message)
    } finally {
      setSending(false)
    }
  }

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    const optedInContacts = contacts.filter((c) => c.optedIn)
    if (selectedContacts.length === optedInContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(optedInContacts.map((c) => c.id))
    }
  }
  const handleSyncTemplates = async () => {
    if (!dealer?.whatsappBusinessAccountId) {
      alert('❌ WhatsApp not connected. Please add WABA ID in Settings.')
      return
    }

    try {
      const res = await fetch(
        `/api/dealers/${subdomain}/whatsapp/templates/sync`,
        {
          method: 'POST',
        }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Sync failed')
      }

      const result = await res.json()
      alert(`✅ Synced ${result.synced} templates from Meta!`)
      
      // Reload the page to show new templates
      window.location.reload()
    } catch (error: any) {
      alert(`❌ Sync failed: ${error.message}`)
      console.error('Sync error:', error)
    }
  }
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
        {!dealer?.whatsappBusinessVerified && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              ⚠️ WhatsApp not connected
            </p>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          label="Total Contacts"
          value={contacts.length}
          icon={<Users />}
        />
        <StatCard
          label="Opted In"
          value={contacts.filter((c) => c.optedIn).length}
          icon={<CheckCircle2 />}
          accent="text-green-600"
        />
        <StatCard
          label="Sent"
          value={stats?.sent || 0}
          icon={<Send />}
          accent="text-blue-600"
        />
        <StatCard
          label="Delivered"
          value={stats?.delivered || 0}
          icon={<CheckCircle2 />}
          accent="text-green-600"
        />
        <StatCard
          label="Failed"
          value={stats?.failed || 0}
          icon={<XCircle />}
          accent="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Inbox Card */}
        <Link
          href={`/dealers/${subdomain}/dashboard/whatsapp/inbox`}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-green-500 transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
              <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Inbox
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View conversations
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              0
            </div>
            <span className="text-sm text-gray-500">unread</span>
          </div>
        </Link>

        {/* Contacts Card */}
        <Link
          href={`/dealers/${subdomain}/dashboard/whatsapp/contacts`}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-500 transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Contacts
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage contacts
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {contacts.length}
            </div>
            <span className="text-sm text-gray-500">total</span>
          </div>
        </Link>

        {/* Templates Card */}
        <Link
          href={`/dealers/${subdomain}/dashboard/whatsapp/templates`}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-500 transition-all"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Templates
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Message templates
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {templates.length}
            </div>
            <span className="text-sm text-gray-500">approved</span>
          </div>
        </Link>
      </div>
      {/* Templates Section */}
<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
      Available Templates ({templates.length})
    </h2>
    {/* ✅ ADD THIS SYNC BUTTON */}
    <button
      onClick={handleSyncTemplates}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
      Sync from Meta
    </button>
  </div>

  {templates.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No approved templates. Create one in the Templates section.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <button
                    onClick={() => setSelectedTemplatePreview(template)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {template.category} • {template.language}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {template.bodyText}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Send Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Send Bulk Message
        </h2>

        <div className="space-y-4">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
              Select Template
            </label>
            {templates.length === 0 ? (
              <p className="text-sm text-gray-500">No approved templates</p>
            ) : (
              <>
                <select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-3"
                >
                  <option value="">Choose a template...</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-sm">
                    <p className="font-medium mb-1">Preview:</p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {templates.find((t) => t.id === selectedTemplate)?.bodyText}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
            
         {/* ✅ ADD THIS ENTIRE BLOCK */}
         {selectedTemplate && templateParams.length > 0 && (
  <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm">
      📝 Template Inputs Required
    </h3>
    <div className="space-y-3">
      {templateParams.map((param, index) => {
        if (param.type === "text") {
          return (
            <div key={index}>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Text Variable {index + 1}
              </label>
              <input
                type="text"
                value={inputValues[index] || ""}
                onChange={e =>
                  setInputValues(v => ({ ...v, [index]: e.target.value }))
                }
                placeholder={param.text || `Enter value`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          );
        }
        if (param.type === "product") {
          // Assume you have a `products` array for product selection
          return (
            <div key={index}>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Product Variable {index + 1}
              </label>
              <select
                value={inputValues[index] || ""}
                onChange={e =>
                  setInputValues(v => ({ ...v, [index]: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Product...</option>
                {products.map((p: any) => (
                  <option value={p.id} key={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          );
        }
        if (param.type === "image") {
          return (
            <div key={index}>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Image Variable {index + 1}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e =>
                  setInputValues(v => ({ ...v, [index]: e.target.files?.[0] }))
                }
                className="w-full px-3 py-2"
              />
            </div>
          );
        }
        // Extend for other param types if needed
        return null;
      })}
    </div>
  </div>
)}



          {/* Contact Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">
                Select Contacts ({selectedContacts.length})
              </label>
              <button
                onClick={selectAll}
                className="text-sm text-blue-600 hover:underline"
              >
                {selectedContacts.length ===
                contacts.filter((c) => c.optedIn).length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {contacts.filter((c) => c.optedIn).length === 0 ? (
              <p className="text-sm text-gray-500">No opted-in contacts</p>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded-lg p-3 space-y-2">
                {contacts
                  .filter((c) => c.optedIn)
                  .map((contact) => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContact(contact.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {contact.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {contact.phoneNumber}
                        </p>
                      </div>
                    </label>
                  ))}
              </div>
            )}
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendBulk}
            disabled={
              sending ||
              selectedContacts.length === 0 ||
              !selectedTemplate ||
              templates.length === 0
            }
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Send className="w-5 h-5" />
            {sending
              ? `Sending to ${selectedContacts.length}...`
              : `Send to ${selectedContacts.length}`}
          </button>
        </div>
      </div>

      {/* Manage Contacts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Manage Contacts
        </h2>

        <div className="flex gap-3 mb-4">
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
            <Upload className="w-5 h-5" />
            {uploading ? 'Uploading...' : 'Import CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <a
            href={`/dealers/${subdomain}/dashboard/whatsapp/contacts`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <Users className="w-5 h-5" />
            View All
          </a>
        </div>
      </div>

      {/* Delivery Tracking */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Delivery Performance
        </h2>

        {messages.length === 0 ? (
          <p className="text-sm text-gray-500">No messages sent yet</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-gray-600">Sent</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats?.sent || 0}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xs text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats?.delivered || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-xs text-gray-600">Read</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats?.read || 0}
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-xs text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats?.failed || 0}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {messages.slice(0, 5).map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {msg.contact?.name || msg.phoneNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      msg.status === 'delivered'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                        : msg.status === 'sent'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                        : msg.status === 'read'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                    }`}
                  >
                    {msg.status}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplatePreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {selectedTemplatePreview.name}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {selectedTemplatePreview.category} •{' '}
              {selectedTemplatePreview.language}
            </p>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {selectedTemplatePreview.bodyText}
              </p>
            </div>
            <button
              onClick={() => setSelectedTemplatePreview(null)}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <div className={`${accent || 'text-gray-400'}`}>{icon}</div>
      </div>
      <p
        className={`text-3xl font-semibold ${
          accent || 'text-gray-900 dark:text-white'
        }`}
      >
        {value || 0}
      </p>
    </div>
  )
}
