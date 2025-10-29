'use client';

import { useState } from 'react';
import { Upload, UserPlus, Search, Download } from 'lucide-react';

type Contact = {
  id: string;
  name: string;
  phoneNumber: string;
  tags: string[];
  optedIn: boolean;
  source: string;
  createdAt: Date;
};

export default function ContactsClient({
  subdomain,
  dealer,
  contacts: initialContacts,
}: {
  subdomain: string;
  dealer: any;
  contacts: Contact[];
}) {
  const [contacts, setContacts] = useState(initialContacts);
  const [uploading, setUploading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newContact, setNewContact] = useState({ name: '', phoneNumber: '', tags: '' });

  // CSV Upload Handler
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/api/dealers/${subdomain}/whatsapp/contacts/import`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());
      const result = await res.json();

      alert(`✅ Imported ${result.imported} contacts successfully!`);
      window.location.reload();
    } catch (e: any) {
      alert(`❌ Import failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Manual Add Handler
  const handleManualAdd = async () => {
    try {
      const res = await fetch(`/api/dealers/${subdomain}/whatsapp/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newContact.name,
          phoneNumber: newContact.phoneNumber,
          tags: newContact.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      
      alert('✅ Contact added successfully!');
      setShowAddForm(false);
      setNewContact({ name: '', phoneNumber: '', tags: '' });
      window.location.reload();
    } catch (e: any) {
      alert(`❌ Failed to add contact: ${e.message}`);
    }
  };

  // Filter contacts by search
  const filteredContacts = contacts.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneNumber.includes(searchQuery)
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">WhatsApp Contacts</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your contact list for WhatsApp campaigns
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mb-6">
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
          <Upload className="w-5 h-5" />
          {uploading ? 'Uploading...' : 'Upload CSV'}
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <UserPlus className="w-5 h-5" />
          Add Manually
        </button>

        <div className="ml-auto flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredContacts.length} contacts
          </span>
        </div>
      </div>

      {/* Manual Add Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Add New Contact</h3>
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <input
              type="tel"
              placeholder="+919876543210"
              value={newContact.phoneNumber}
              onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={newContact.tags}
              onChange={(e) => setNewContact({ ...newContact, tags: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleManualAdd}
              disabled={!newContact.phoneNumber}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Add Contact
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tags</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{contact.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{contact.phoneNumber}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{contact.source}</td>
                <td className="px-6 py-4 text-sm">
                  {contact.optedIn ? (
                    <span className="text-green-600 dark:text-green-400">✓ Opted In</span>
                  ) : (
                    <span className="text-gray-400">Not Opted In</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No contacts found. Upload a CSV or add manually.
          </div>
        )}
      </div>

      {/* CSV Format Guide */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">CSV Format</h4>
        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">Your CSV should have these columns:</p>
        <code className="text-xs bg-white dark:bg-gray-900 p-2 rounded block text-gray-900 dark:text-white">
          name,phone,tags<br />
          John Doe,+919876543210,customer;vip<br />
          Jane Smith,9988776655,lead
        </code>
      </div>
    </div>
  );
}
