// app/components/layout/Footer.tsx - ERROR-FREE VERSION
export default function Footer({ 
    variant = 'motoyard' 
  }: { 
    variant?: 'motoyard' | 'marketing-dime' 
  }) {
    if (variant === 'marketing-dime') {
      return (
        <footer className="bg-gray-100 border-t border-gray-200 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center mb-4">
              <p className="text-gray-700 text-sm font-medium mr-2">
                Powered by
              </p>
              
              <a 
                href="https://mktgdime.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {/* Search Icon Box (Black) - Using SVG directly */}
                <div className="bg-black text-white p-2.5 flex items-center justify-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                
                {/* Brand Text Box (Amber 400) */}
                <div className="bg-amber-400 text-black text-base md:text-lg font-bold py-2.5 px-4 leading-none">
                  Marketing Dime
                </div>
              </a>
            </div>
  
            <p className="text-gray-600 text-xs text-center">
              &copy; {new Date().getFullYear()} Marketing Dime. All rights reserved.
            </p>
          </div>
        </footer>
      );
    }
  
    // MotoYard variant
    return (
      <footer className="bg-gray-100 border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center mb-4">
            <p className="text-gray-700 text-sm font-medium mr-2">
              Powered by
            </p>
            
            <a 
              href="https://motoyard.mktgdime.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {/* Icon Box (Blue) - Using SVG directly */}
              <div className="bg-blue-600 text-white p-2.5 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              
              {/* Brand Text Box (Blue 500) */}
              <div className="bg-blue-500 text-white text-base md:text-lg font-bold py-2.5 px-4 leading-none">
                MotoYard
              </div>
            </a>
          </div>
  
          <p className="text-gray-600 text-xs text-center">
            &copy; {new Date().getFullYear()} MotoYard. All rights reserved.
          </p>
        </div>
      </footer>
    );
  }
  