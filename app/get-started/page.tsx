'use client'

import { useRouter } from 'next/navigation';
import { useState } from 'react'
import Footer from '@/components/layout/Footer'
import { CheckCircle, AlertCircle, Building2, Globe, Lock, Zap, MessageSquare } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import Link from 'next/link'
import OTPInput from '../../components/auth/OTPInput'
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const PhoneInput = dynamic(() => import('react-phone-number-input'), {
  ssr: false,
  loading: () => <div className="w-full h-12 bg-gray-100 animate-pulse rounded-lg"></div>
});



export default function GetStartedPage() {
  const router = useRouter();
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    location: '',
    subdomain: '',
    customDomain: '',
    description: '',
    selectedPlan: 'free',
    password: '', // ✅ NEW
  });
  
  // ✅ NEW: OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpId, setOtpId] = useState<string>(''); // For future OTP tracking


  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean
    available?: boolean
    message?: string
  }>({ checking: false })

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: [
        'Up to 5 car listings',
        'Basic storefront',
        '5 AI content per month',
        '1 social media post per month',
        'WhatsApp integration',
        'Community support'
      ]
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 2999,
      features: [
        'Up to 50 car listings',
        'Basic storefront design',
        'Unlimited AI content',
        'Unlimited social posts',
        'WhatsApp integration',
        'Email support'
      ]
    },
    {
      id: 'professional', 
      name: 'Professional',
      price: 4999,
      popular: true,
      features: [
        'Up to 200 car listings',
        'Custom domain support',
        'Advanced AI features',
        'Social media automation',
        'Analytics dashboard',
        'Priority support'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise', 
      price: 9999,
      features: [
        'Unlimited car listings',
        'Multi-location support',
        'Custom integrations',
        'Dedicated account manager',
        'API access',
        '24/7 phone support'
      ]
    }
  ]


  const checkSubdomain = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) return
    
    setSubdomainStatus({ checking: true })
    
    try {
      const response = await fetch('/api/dealers/check-subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain })
      })
      
      const data = await response.json()
      
      setSubdomainStatus({
        checking: false,
        available: data.available,
        message: data.message
      })
    } catch (error) {
      setSubdomainStatus({
        checking: false,
        available: false,
        message: 'Error checking subdomain availability'
      })
    }
  }

  const handleSubdomainChange = (value: string) => {
    const cleanSubdomain = value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20)
    setFormData(prev => ({ ...prev, subdomain: cleanSubdomain }))
    setTimeout(() => checkSubdomain(cleanSubdomain), 500)
  }

  const validateStep = (stepNumber: number) => {
    const newErrors: Record<string, string> = {}
    
    if (stepNumber === 1) {
      if (!formData.businessName) newErrors.businessName = 'Business name is required'
      if (!formData.ownerName) newErrors.ownerName = 'Owner name is required'  
      if (!formData.email) newErrors.email = 'Email is required'
      if (!formData.phone) newErrors.phone = 'Phone number is required'
      if (!formData.location) newErrors.location = 'Location is required'
    }
    
    if (stepNumber === 2) {
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
    }

    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    // ✅ If we're on step 4 (Plan Selection), move to step 5 (OTP)
    if (step === 4) {
      setStep(5);
      return;
    }

    // ✅ Step 5: Handle OTP verification
    // This will be triggered by OTPInput component
  };

  // ✅ NEW: Send OTP Function
  const sendOTP = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setOtpId(data.otpId);
      setOtpSent(true);
    } catch (error: any) {
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  // ✅ NEW: Verify OTP and Create Dealer
  const verifyOTPAndCreateDealer = async (otp: string) => {
    setLoading(true);
    setErrors({});
  
    try {
      // Verify OTP (dealer is created in this step)
      const verifyResponse = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          otpCode: otp,
          name: formData.ownerName,
          businessname: formData.businessName,
          phone: formData.phone,
          location: formData.location,
          password: formData.password,
          subdomain: formData.subdomain, 
        }),
      });      
  
      const verifyData = await verifyResponse.json();
  
      if (!verifyResponse.ok) {
        setErrors({ general: verifyData.error || 'OTP verification failed' });
        setLoading(false);
        return;
      }
  
      console.log('✅ OTP verified and dealer created:', verifyData.dealer);
  
      // Send welcome email
      await sendWelcomeEmail(verifyData.dealer);
  
      // Redirect to congratulations/dashboard
      router.push(`/welcome?subdomain=${verifyData.dealer.subdomain}`);
      
    } catch (error) {
      console.error('❌ Verification error:', error);
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to send welcome email
  const sendWelcomeEmail = async (dealer: any) => {
    try {
      await fetch('/api/emails/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: dealer.email,
          name: dealer.name,
          subdomain: dealer.subdomain,
        }),
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't block signup if welcome email fails
    }
  };
  
  
  return (
    <>
      <style jsx global>{`
        textarea {
          color: #111827 !important;
          font-weight: 500 !important;
        }
        textarea::placeholder {
          color: #6B7280 !important;
          font-weight: 400 !important;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-2xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block">
              ← Back to MotoYard
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Start Your Digital Dealership
            </h1>
            <p className="text-xl text-gray-600">
              Join hundreds of dealers growing their business with MotoYard
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-12">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold
                  ${step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }
                `}>
                  {step > stepNumber ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    stepNumber
                  )}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-2 ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

         {/* Form Steps */}
         <div className="bg-white rounded-2xl shadow-lg p-8">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  Business Information
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business/Dealership Name *
                    </label>
                    <Input
                      value={formData.businessName}
                      onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                      placeholder="e.g., ABC Motors, XYZ Car Sales"
                      className={errors.businessName ? 'border-red-500' : ''}
                    />
                    {errors.businessName && (
                      <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name *
                    </label>
                    <Input
                      value={formData.ownerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="Your full name"
                      className={errors.ownerName ? 'border-red-500' : ''}
                    />
                    {errors.ownerName && (
                      <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="business@example.com"
                        className={errors.email ? 'border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <PhoneInput
                        international
                        defaultCountry="IN"
                        value={formData.phone}
                        onChange={(value) => setFormData(prev => ({ ...prev, phone: value || '' }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Select country code and enter your number
                      </p>
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                  </div>
       
                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Create a secure password"
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum 8 characters. You can also sign in with WhatsApp OTP later.
                    </p>
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Location *
                    </label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="City, State"
                      className={errors.location ? 'border-red-500' : ''}
                    />
                    {errors.location && (
                      <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Globe className="w-6 h-6 text-blue-600" />
                  Your Digital Presence
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Your Subdomain *
                    </label>
                    <div className="flex items-center">
                      <Input
                        value={formData.subdomain}
                        onChange={(e) => handleSubdomainChange(e.target.value)}
                        placeholder="your-dealership"
                        className={`rounded-r-none ${errors.subdomain ? 'border-red-500' : ''}`}
                      />
                      <span className="bg-gray-100 border border-l-0 border-gray-300 px-4 py-2 rounded-r-lg text-gray-600">
                        .motoyard.mktgdime.com
                      </span>
                    </div>
                    
                    {subdomainStatus.checking && (
                      <p className="text-blue-500 text-sm mt-1 flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        Checking availability...
                      </p>
                    )}
                    
                    {!subdomainStatus.checking && subdomainStatus.available === true && (
                      <p className="text-green-500 text-sm mt-1 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        ✓ Available! Your website will be: {formData.subdomain}.motoyard.mktgdime.com
                      </p>
                    )}
                    
                    {!subdomainStatus.checking && subdomainStatus.available === false && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {subdomainStatus.message}
                      </p>
                    )}
                    
                    {errors.subdomain && (
                      <p className="text-red-500 text-sm mt-1">{errors.subdomain}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Tell customers about your dealership, specialties, and what makes you unique..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 font-medium placeholder:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Domain (Optional)
                    </label>
                    <Input
                      value={formData.customDomain}
                      onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value }))}
                      placeholder="www.yourdealership.com"
                    />
                    <p className="text-gray-500 text-sm mt-1">
                      You can add your own domain later from the dashboard
                    </p>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Choose Your Plan
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`
                        relative border-2 rounded-xl p-6 cursor-pointer transition-all
                        ${formData.selectedPlan === plan.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                        ${plan.popular ? 'ring-2 ring-blue-200' : ''}
                      `}
                      onClick={() => setFormData(prev => ({ ...prev, selectedPlan: plan.id }))}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <span className="bg-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-md">
                            Most Popular
                          </span>
                        </div>
                      )}
                      
                      <div className={`text-center mb-4 ${plan.popular ? 'pt-2' : ''}`}>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                        <div className="text-3xl font-bold text-gray-900 mb-1">
                          ₹{plan.price.toLocaleString()}
                        </div>
                        <p className="text-gray-600 font-medium text-sm">/month</p>
                      </div>

                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-800 font-medium leading-relaxed">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <div className="text-center">
                        <div className={`
                          w-5 h-5 rounded-full mx-auto border-2 flex items-center justify-center
                          ${formData.selectedPlan === plan.id 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 bg-white'
                          }
                        `}>
                          {formData.selectedPlan === plan.id && (
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {errors.general && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm font-medium">{errors.general}</p>
                  </div>
                )}
              </div>
            )}

           {/* Step 5: Email OTP Verification */}
{step === 5 && (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
      <MessageSquare className="w-6 h-6 text-blue-600" />
      Verify Your Email
    </h2>

    {!otpSent ? (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Check your inbox:</strong> We'll send a verification code to {' '}
            <span className="font-semibold">{formData.email}</span>
          </p>
        </div>
        
        <Button
          onClick={sendOTP}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending code...
            </span>
          ) : (
            'Send Verification Code'
          )}
        </Button>
        
        <p className="text-xs text-center text-gray-500">
          Make sure to check your spam folder if you don't see the email
        </p>
      </div>
    ) : (
      <div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-green-800">
            ✓ Code sent to <strong>{formData.email}</strong>
          </p>
        </div>
        
        <p className="text-gray-700 mb-6 text-center">
          Enter the 6-digit verification code:
        </p>
        
        <OTPInput
          length={6}
          onComplete={verifyOTPAndCreateDealer}
          error={errors.general}
          loading={loading}
        />

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setOtpSent(false);
              setErrors({});
            }}
            className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer underline"
          >
            Didn't receive the code? Resend
          </button>
        </div>
        
        <p className="mt-4 text-xs text-center text-gray-500">
          The code expires in 10 minutes
        </p>
      </div>
    )}
  </div>
)}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-8 border-t">
              {step > 1 && (
                <Button
                  onClick={() => setStep(step - 1)}
                  className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-3 rounded-xl font-medium"
                >
                  Previous
                </Button>
              )}
              
              <div className="flex-1" />

              {/* ⚠️ CHANGE: step < 3 → step < 4 */}
              {step < 4 ? (
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-3 rounded-xl font-medium"
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="bg-green-600 text-white hover:bg-green-700 px-8 py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                  {loading ? 'Processing...' : formData.selectedPlan === 'free' ? 'Continue to Verification' : 'Continue & Setup Payment'}
                </Button>
              )}
            </div>
          </div>


          {/* Trust Indicators - Compact Horizontal */}
<div className="mt-10 pt-8 border-t border-gray-200">
  <div className="flex flex-col md:flex-row items-center justify-center gap-6 max-w-3xl mx-auto">
    {/* Indicator 1 */}
    <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
      <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0" strokeWidth={2.5} />
      <span className="text-sm font-medium text-gray-900">
        Free plan: 5 car listings
      </span>
    </div>

    {/* Indicator 2 */}
    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" strokeWidth={2.5} />
      <span className="text-sm font-medium text-gray-900">
        Upgrade anytime
      </span>
    </div>

    {/* Indicator 3 */}
    <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
      <Lock className="w-5 h-5 text-blue-500 flex-shrink-0" strokeWidth={2.5} />
      <span className="text-sm font-medium text-gray-900">
        Secure by PayU
      </span>
    </div>
  </div>
</div>

        </div>
      </div>
      <Footer variant="marketing-dime" /> 
    </>
  )
}
