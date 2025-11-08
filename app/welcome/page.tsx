'use client';

import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowRight, Rocket, Mail } from 'lucide-react';
import Link from 'next/link';

export default function WelcomePage() {
  const searchParams = useSearchParams();
  const subdomain = searchParams.get('subdomain');
  
  // FIXED: Correct URL patterns
  const storefrontUrl = `https://${subdomain}.motoyard.mktgdime.com`;
  const dashboardUrl = `https://motoyard.mktgdime.com/dealers/${subdomain}/dashboard`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
       {/* Success Icon */}
<div className="text-center mb-8">
  <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4 animate-bounce">
    <CheckCircle className="w-12 h-12 text-green-600" />
  </div>
  <h1 className="text-4xl font-bold text-gray-900 mb-2">
    🎉 Congratulations!
  </h1>
  <p className="text-xl text-gray-600">
    Your dealership is ready to go!
  </p>
</div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            What's Next?
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Check Your Email
                </h3>
                <p className="text-gray-600 text-sm">
                  We've sent you a welcome email with setup instructions.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  <Rocket className="w-4 h-4 inline mr-2" />
                  Access Your Dashboard
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Manage your dealership from the admin dashboard:
                </p>
                <a
                  href={dashboardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm break-all"
                >
                  {dashboardUrl}
                </a>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  View Your Storefront
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  Your public dealership website is live at:
                </p>
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm break-all"
                >
                  {storefrontUrl}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={dashboardUrl}
            className="flex-1 bg-blue-600 text-white hover:bg-blue-700 px-6 py-4 rounded-xl font-semibold text-center flex items-center justify-center gap-2 transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="w-5 h-5" />
          </Link>
          
          <Link
            href={storefrontUrl}
            className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-4 rounded-xl font-semibold text-center transition-colors"
          >
            View Storefront
          </Link>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Need help? Contact us at{' '}
          <a href="mailto:support@mktgdime.com" className="text-blue-600 hover:text-blue-700">
            support@mktgdime.com
          </a>
        </p>
      </div>
    </div>
  );
}
