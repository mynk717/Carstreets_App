'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'

export default function RazorpayPaymentComponent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const dealerId = searchParams.get('dealerId')
  const amount = searchParams.get('amount')
  
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    
    // For testing, simulate successful payment
    setTimeout(() => {
      alert('Payment successful! (This is a demo)')
      // Redirect to dealer dashboard (we'll create this later)
      router.push(`/dealers/dashboard?dealerId=${dealerId}`)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
          <p className="text-gray-600">Secure payment processing by Razorpay</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Plan Amount:</span>
            <span className="text-2xl font-bold text-gray-900">₹{amount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Dealer ID:</span>
            <span className="text-sm font-mono text-gray-700">{dealerId}</span>
          </div>
        </div>

        <Button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Payment...
            </div>
          ) : (
            `Pay ₹${amount} & Start Trial`
          )}
        </Button>

        <p className="text-center text-gray-500 text-sm mt-4">
          🔒 This is a demo payment. No actual charges will be made.
        </p>
      </div>
    </div>
  )
}
