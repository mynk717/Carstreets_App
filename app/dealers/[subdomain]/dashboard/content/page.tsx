// app/dealers/[subdomain]/dashboard/content/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Upload, Save, X } from 'lucide-react';

interface DealerData {
  id: string;
  businessName: string;
  name: string;
  location: string;
  phone: string;
  logo: string | null;
  description: string | null;
}

export default function DealerContentPage() {
  // ✅ ALL HOOKS FIRST
  const params = useParams();
  const [dealer, setDealer] = useState<DealerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    businessName: '',
    name: '',
    location: '',
    phone: '',
    logo: '',
    description: '',
  });

  const subdomain = params?.subdomain as string;

  useEffect(() => {
    async function fetchDealer() {
      try {
        const response = await fetch(`/api/dealers/${subdomain}`);
        const data = await response.json();
        
        setDealer(data);
        setFormData({
          businessName: data.businessName || '',
          name: data.name || '',
          location: data.location || '',
          phone: data.phone || '',
          logo: data.logo || '',
          description: data.description || '',
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch dealer:', error);
        setIsLoading(false);
      }
    }

    if (subdomain) {
      fetchDealer();
    }
  }, [subdomain]);

  // ✅ NOW CONDITIONAL RETURNS (AFTER ALL HOOKS)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--color-text-secondary)]">Loading content...</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/dealers/${subdomain}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updated = await response.json();
        setDealer(updated);
        setMessage({ type: 'success', text: 'Changes saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save changes' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-text)]">
            Content Management
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Manage your dealership information and branding
          </p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`flex items-center justify-between p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-[var(--color-success)] bg-opacity-10 border border-[var(--color-success)] text-[var(--color-success)]'
              : 'bg-[var(--color-error)] bg-opacity-10 border border-[var(--color-error)] text-[var(--color-error)]'
          }`}
        >
          <span className="font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Content Form */}
      <div className="card card__body">
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-6">
          Dealership Information
        </h2>

        <div className="space-y-6">
          {/* Business Name */}
          <div className="form-group">
            <label className="form-label">Business Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.businessName}
              onChange={(e) =>
                setFormData({ ...formData, businessName: e.target.value })
              }
              placeholder="e.g., ABC Motors"
            />
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Your dealership's official business name
            </p>
          </div>

          {/* Owner Name */}
          <div className="form-group">
            <label className="form-label">Owner/Contact Name</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., John Doe"
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-control"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="e.g., Civil Lines, Raipur, Chhattisgarh"
            />
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Full address or area (City, State)
            </p>
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="tel"
              className="form-control"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g., +91 9876543210"
            />
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Contact number for customer inquiries
            </p>
          </div>

          {/* Logo URL */}
          <div className="form-group">
            <label className="form-label">Logo URL</label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <input
                  type="url"
                  className="form-control"
                  value={formData.logo}
                  onChange={(e) =>
                    setFormData({ ...formData, logo: e.target.value })
                  }
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  Direct URL to your dealership logo (recommended: 200x200px)
                </p>
              </div>
              {formData.logo && (
                <div className="flex-shrink-0">
                  <img
                    src={formData.logo}
                    alt="Logo preview"
                    className="w-16 h-16 object-cover rounded-lg border border-[var(--color-border)]"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-logo.png';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={4}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Tell customers about your dealership, specialties, and what makes you unique..."
            />
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              This appears on your storefront homepage
            </p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={() => {
                if (dealer) {
                  setFormData({
                    businessName: dealer.businessName || '',
                    name: dealer.name || '',
                    location: dealer.location || '',
                    phone: dealer.phone || '',
                    logo: dealer.logo || '',
                    description: dealer.description || '',
                  });
                }
              }}
              className="btn btn--secondary"
            >
              Reset Changes
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn btn--primary inline-flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Card */}
      <div className="card card__body">
        <h2 className="text-xl font-semibold text-[var(--color-text)] mb-4">
          Storefront Preview
        </h2>
        <div className="border border-[var(--color-border)] rounded-lg p-6 bg-[var(--color-surface)]">
          <div className="flex items-center gap-4 mb-4">
            {formData.logo && (
              <img
                src={formData.logo}
                alt="Logo"
                className="w-16 h-16 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div>
              <h3 className="text-2xl font-bold text-[var(--color-text)]">
                {formData.businessName || 'Your Business Name'}
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                {formData.location || 'Your Location'}
              </p>
            </div>
          </div>
          {formData.description && (
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {formData.description}
            </p>
          )}
          {formData.phone && (
            <p className="text-[var(--color-text)] mt-3 font-medium">
              📞 {formData.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
