export interface DealerProfile {
  // Basic Business Information
  business: {
    name: string;
    established: string;
    tagline: string;
    specialization: string[];
    reputation_factors: string[];
  };
  
  // Multiple Locations with Specific Details
  locations: {
    [key: string]: {
      address: string;
      landmarks: string[];
      target_demographics: string;
      popular_inventory: string[];
      accessibility_features: string[];
    };
  };
  
  // Inventory & Pricing Strategy
  inventory: {
    price_ranges: {
      [range: string]: {
        percentage: number;
        popular_models: string[];
        target_customers: string;
      };
    };
    specializations: string[];
    luxury_offerings: boolean;
    financing_options: string[];
  };
  
  // Services & Value Propositions
  services: {
    core_services: string[];
    additional_services: string[];
    unique_selling_points: string[];
    quality_assurance: string[];
  };
  
  // Management & Operations
  operations: {
    key_personnel: string[];
    operating_hours: string;
    peak_seasons: string[];
    customer_approach: string;
  };
  
  // Market Intelligence
  market_context: {
    local_competition: string[];
    competitive_advantages: string[];
    seasonal_trends: string[];
    regional_preferences: string[];
  };
}
