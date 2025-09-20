import { DealerProfile } from '@/types/dealerProfile';

export const CAR_STREETS_PROFILE: DealerProfile = {
  business: {
    name: "Car Streets",
    established: "Established dealership with years of operation",
    tagline: "Specializing in quality second-hand vehicles with customer satisfaction focus",
    specialization: [
      "Pre-owned luxury vehicles",
      "Budget-friendly options starting Rs. 3.5 Lakh",
      "Verified second-hand cars",
      "Customer-centric service approach"
    ],
    reputation_factors: [
      "Solid reputation over years of operation",
      "Positive reviews for customer-centric approach", 
      "Emphasis on customer satisfaction",
      "Transparent pricing and documentation"
    ]
  },
  
  locations: {
    kushalpur: {
      address: "Main Road, Ring Road No. 1, near Diwan Hospital",
      landmarks: ["Diwan Hospital", "Ring Road No. 1", "Main Road Junction"],
      target_demographics: "Healthcare professionals and Ring Road corridor residents",
      popular_inventory: ["Mid-range sedans", "Family SUVs", "Premium hatchbacks"],
      accessibility_features: ["Main road access", "Hospital proximity", "Ring road connectivity"]
    },
    bhatagaon: {
      address: "Near Vrindavan Palace and Diwan Hospital",
      landmarks: ["Vrindavan Palace", "Diwan Hospital", "Bhatagaon Market"],
      target_demographics: "Affluent residents and palace vicinity customers",
      popular_inventory: ["Luxury sedans", "Premium SUVs", "Executive cars"],
      accessibility_features: ["Palace proximity", "Premium location", "Upscale neighborhood"]
    },
    pachpedi_naka: {
      address: "Near MMI Hospital",
      landmarks: ["MMI Hospital", "Pachpedi Naka Junction", "Medical District"],
      target_demographics: "Medical professionals and hospital staff",
      popular_inventory: ["Reliable sedans", "Compact SUVs", "Fuel-efficient cars"],
      accessibility_features: ["Hospital zone", "Medical district", "Professional area"]
    },
    sarona: {
      address: "Ring Road No. 1",
      landmarks: ["Ring Road No. 1", "Sarona Junction", "Industrial Area"],
      target_demographics: "Industrial workers and business owners",
      popular_inventory: ["Commercial vehicles", "Robust SUVs", "Value-for-money options"],
      accessibility_features: ["Ring road access", "Industrial connectivity", "Business district"]
    }
  },
  
  inventory: {
    price_ranges: {
      "3.5-8 lakhs": {
        percentage: 40,
        popular_models: ["Maruti Swift", "Hyundai i10", "Tata Indica", "Honda City"],
        target_customers: "First-time buyers, budget-conscious families"
      },
      "8-15 lakhs": {
        percentage: 35,
        popular_models: ["Maruti Dzire", "Hyundai Verna", "Honda Amaze", "Tata Nexon"],
        target_customers: "Middle-class professionals, growing families"
      },
      "15-25 lakhs": {
        percentage: 20,
        popular_models: ["Honda City", "Hyundai Creta", "Maruti Ciaz", "Tata Harrier"],
        target_customers: "Established professionals, premium segment buyers"
      },
      "25+ lakhs": {
        percentage: 5,
        popular_models: ["BMW Series", "Mercedes C-Class", "Audi A4", "Luxury SUVs"],
        target_customers: "High-net-worth individuals, luxury car enthusiasts"
      }
    },
    specializations: [
      "Second-hand luxury vehicles",
      "Well-maintained pre-owned cars",
      "Verified vehicle history",
      "Multi-brand inventory"
    ],
    luxury_offerings: true,
    financing_options: [
      "Bank loan assistance",
      "EMI options for eligible customers",
      "Documentation support",
      "Insurance facilitation"
    ]
  },
  
  services: {
    core_services: [
      "Used car sales",
      "Car purchase/trade-in",
      "Vehicle inspection and verification",
      "Documentation assistance"
    ],
    additional_services: [
      "Car washing services",
      "Finance option guidance",
      "Insurance processing",
      "After-sales support"
    ],
    unique_selling_points: [
      "Multiple strategic locations across Raipur",
      "Luxury vehicle specialization",
      "Customer satisfaction focus",
      "Transparent pricing",
      "Quality assurance processes"
    ],
    quality_assurance: [
      "Thorough vehicle inspection",
      "Verified documentation",
      "Transparent pricing",
      "Post-sale support"
    ]
  },
  
  operations: {
    key_personnel: ["Ankit Pandey - Key Principal"],
    operating_hours: "10:30 AM to 8:30 PM daily",
    peak_seasons: [
      "Festival seasons (Navratri, Diwali)",
      "Post-monsoon period", 
      "Year-end car upgrades",
      "Wedding season purchases"
    ],
    customer_approach: "Customer-centric with emphasis on satisfaction and long-term relationships"
  },
  
  market_context: {
    local_competition: [
      "OLX Raipur listings",
      "Local independent dealers",
      "Cars24 limited presence",
      "Traditional showrooms"
    ],
    competitive_advantages: [
      "Multiple strategic locations",
      "Luxury vehicle specialization", 
      "Established reputation",
      "Customer satisfaction focus",
      "Comprehensive service offerings"
    ],
    seasonal_trends: [
      "High demand during festivals",
      "Post-monsoon verification focus",
      "Wedding season luxury purchases",
      "Year-end upgrade cycles"
    ],
    regional_preferences: [
      "Preference for fuel-efficient cars",
      "High ground clearance importance",
      "AC essential due to climate",
      "Brand reliability focus"
    ]
  }
};
