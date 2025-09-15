'use client'

import { useState } from 'react'
import { RefreshCw, Play, CheckCircle, AlertCircle } from 'lucide-react'

interface ScrapeResult {
  success: boolean
  message: string
  results?: {
    added: number
    updated: number
    preserved: number
    removed: number
    errors: number
  }
}

export function ScrapeButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScrapeResult | null>(null)

  const handleScrape = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileUrl: 'https://www.olx.in/profile/your-profile-url', // Replace with actual profile
          useSmartMerge: true
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: 'Smart merge completed successfully!',
          results: data.results
        })
      } else {
        setResult({
          success: false,
          message: data.error || 'Scraping failed'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">OLX Scraper</h3>
          <p className="text-sm text-gray-600">
            Sync with OLX listings using smart merge (preserves manual edits)
          </p>
        </div>
        
        <button
          onClick={handleScrape}
          disabled={loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            loading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : result?.success
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Scraping...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start Smart Scrape
            </>
          )}
        </button>
      </div>

      {/* Results Display */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.message}
            </span>
          </div>
          
          {result.results && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{result.results.added}</div>
                <div className="text-xs text-gray-600">Added</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{result.results.updated}</div>
                <div className="text-xs text-gray-600">Updated</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{result.results.preserved}</div>
                <div className="text-xs text-gray-600">Preserved</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">{result.results.removed}</div>
                <div className="text-xs text-gray-600">Removed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{result.results.errors}</div>
                <div className="text-xs text-gray-600">Errors</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
