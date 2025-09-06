export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Find Your Perfect Car
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover the best used cars in Raipur and across India
        </p>
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Select Brand</option>
              <option>Maruti Suzuki</option>
              <option>Hyundai</option>
              <option>Tata</option>
              <option>Honda</option>
              <option>Toyota</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Budget</option>
              <option>Under ₹2 Lakh</option>
              <option>₹2-5 Lakh</option>
              <option>₹5-10 Lakh</option>
              <option>Above ₹10 Lakh</option>
            </select>
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Fuel Type</option>
              <option>Petrol</option>
              <option>Diesel</option>
              <option>CNG</option>
              <option>Electric</option>
            </select>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Search Cars
            </button>
          </div>
          
          <div className="text-center text-gray-500">
            <p>🚗 Premium Cars • 🔍 Verified Listings • 💰 Best Prices</p>
          </div>
        </div>
      </div>
    </div>
  )
}
