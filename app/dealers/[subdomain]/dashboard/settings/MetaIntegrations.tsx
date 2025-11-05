'use client'

import { useState } from 'react'
import { MessageSquare, CheckCircle2, Mail, ExternalLink, Facebook, Instagram, Save, AlertCircle } from 'lucide-react'
import { updateDealerSettings } from '@/actions/dealerActions'

export function MetaIntegrations({ dealer, subdomain }: { dealer: any; subdomain: string }) {
  // WhatsApp state
  const [whatsappWabaId, setWhatsappWabaId] = useState(dealer.whatsappBusinessAccountId || '')
  const [whatsappPhone, setWhatsappPhone] = useState(dealer.whatsappBusinessNumber || '')
  
  // Facebook/Instagram state - ONLY use facebookPageId
  const [facebookPageId, setFacebookPageId] = useState(dealer.facebookPageId || '')
  
  // UI state
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showWhatsAppHelp, setShowWhatsAppHelp] = useState(false)

  const isWhatsAppConnected = !!dealer.whatsappBusinessAccountId
  const isFacebookConnected = !!dealer.facebookPageId

  // Save WhatsApp configuration
  const handleSaveWhatsApp = async () => {
    if (!whatsappWabaId.trim()) {
      setMessage('❌ Please enter your WhatsApp Business Account ID')
      return
    }

    setSaving(true)
    setMessage('')
    
    try {
      const result = await updateDealerSettings(dealer.id, {
        whatsappBusinessAccountId: whatsappWabaId.trim(),
        whatsappBusinessNumber: whatsappPhone.trim() || null,
      })

      if (result.success) {
        setMessage('✅ WhatsApp configuration saved! Redirecting to templates...')
        setTimeout(() => {
          window.location.href = `/dealers/${subdomain}/dashboard/whatsapp/templates`
        }, 2000)
      } else {
        setMessage('❌ Failed to save WhatsApp configuration')
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage('❌ An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  // Save Facebook/Instagram configuration
  const handleSaveSocial = async () => {
    if (!facebookPageId.trim()) {
      setMessage('❌ Please enter your Facebook Page ID')
      return
    }

    setSaving(true)
    setMessage('')
    
    try {
      const result = await updateDealerSettings(dealer.id, {
        facebookPageId: facebookPageId.trim() || null,
      })

      if (result.success) {
        setMessage('✅ Facebook/Instagram account connected!')
      } else {
        setMessage('❌ Failed to save social media configuration')
      }
    } catch (error) {
      console.error('Save error:', error)
      setMessage('❌ An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Global Message */}
      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${
          message.includes('✅') 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900'
        }`}>
          {message}
        </div>
      )}

      {/* ========== WHATSAPP SECTION ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              WhatsApp Business Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your WhatsApp Business Account to send bulk messages.
            </p>
          </div>
          {isWhatsAppConnected && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Connected
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              WhatsApp Business Account ID (WABA) *
            </label>
            <input
              type="text"
              value={whatsappWabaId}
              onChange={(e) => setWhatsappWabaId(e.target.value)}
              placeholder="1080466230659385"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              WhatsApp Phone Number (Optional)
            </label>
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
          </div>
        </div>

        <button
          onClick={handleSaveWhatsApp}
          disabled={saving || !whatsappWabaId.trim()}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save WhatsApp Configuration'}
        </button>
      </div>

      {/* ========== FACEBOOK & INSTAGRAM SECTION ========== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Facebook & Instagram Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your Facebook Page (handles both Facebook and Instagram)
            </p>
          </div>
          {isFacebookConnected && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Connected
            </div>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Facebook className="w-5 h-5 text-blue-600" />
              <Instagram className="w-5 h-5 text-pink-600" />
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Facebook Page ID
              </label>
            </div>
            <input
              type="text"
              value={facebookPageId}
              onChange={(e) => setFacebookPageId(e.target.value)}
              placeholder="123456789012345"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your Facebook Page ID (Instagram account must be connected to this page)
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSocial}
          disabled={saving || !facebookPageId.trim()}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Social Media Account'}
        </button>
      </div>
    </div>
  )
}
