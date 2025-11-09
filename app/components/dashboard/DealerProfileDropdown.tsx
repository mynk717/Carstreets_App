'use client';

import { signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  User, 
  Settings, 
  LogOut, 
  Mail, 
  CheckCircle, 
  XCircle,
  Facebook,
  Instagram,
  Linkedin,
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface DealerProfileDropdownProps {
  dealer: {
    name: string;
    email: string;
    businessName: string;
    subdomain: string;
    phoneNumber?: string;
    // Social connection status
    metaAccessToken?: string | null;
    facebookPageId?: string | null;
    whatsappBusinessVerified?: boolean;
  };
}

export default function DealerProfileDropdown({ dealer }: DealerProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Check social connection status
  const isFacebookConnected = !!(dealer.metaAccessToken && dealer.facebookPageId);
  const isWhatsAppConnected = dealer.whatsappBusinessVerified || false;

  // Get initials for avatar
  const initials = dealer.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
          {initials}
        </div>

        {/* Name & Business */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
            {dealer.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
            {dealer.businessName}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Header Section */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 border-b border-blue-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {dealer.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {dealer.businessName}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{dealer.email}</span>
            </div>
            {dealer.phoneNumber && (
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <User className="w-4 h-4 text-gray-400" />
                <span>{dealer.phoneNumber}</span>
              </div>
            )}
          </div>

          {/* Social Connection Status */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
              Connected Platforms
            </p>
            <div className="space-y-2">
              {/* Facebook/Instagram */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Facebook className="w-4 h-4 text-blue-600" />
                    <Instagram className="w-4 h-4 text-pink-500" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Meta (FB/IG)
                  </span>
                </div>
                {isFacebookConnected ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs">Not connected</span>
                  </div>
                )}
              </div>

              {/* WhatsApp */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.309"/>
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    WhatsApp
                  </span>
                </div>
                {isWhatsAppConnected ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">Verified</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400">
                    <XCircle className="w-4 h-4" />
                    <span className="text-xs">Not verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
                
          {/* Actions */}
          <div className="p-2">
          <a
    href={`https://${dealer.subdomain}.motoyard.mktgdime.com`}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
  >
    <ExternalLink className="w-4 h-4" />
    <span>Visit Storefront</span>
  </a>
            <Link
              href={`/dealers/${dealer.subdomain}/dashboard/settings`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Settings & Profile</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
