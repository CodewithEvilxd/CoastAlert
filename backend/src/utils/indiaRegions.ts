/**
 * Comprehensive India Region Database
 * Covers 200+ cities across all 28 states and 8 Union Territories.
 * Used for: geospatial proximity queries, coastal/inland detection, river identification.
 */

export type RegionType = 'coastal' | 'inland' | 'river';

export interface IndiaRegionInfo {
  lat: number;
  lng: number;
  type: RegionType;
  state: string;
  river?: string;           // primary river (for river/inland regions)
  ocean?: string;           // ocean/sea (for coastal regions)
  agency?: string;          // primary monitoring authority
  riskType?: string;        // dominant hazard type for fallback responses
}

// =====================================================
// COMPREHENSIVE INDIA CITY → COORDINATES MAP
// =====================================================
export const INDIA_CITY_MAP: Record<string, IndiaRegionInfo> = {

  // ── WEST COAST ─────────────────────────────────────
  'Mumbai': { lat: 19.0760, lng: 72.8777, type: 'coastal', state: 'Maharashtra', ocean: 'Arabian Sea', agency: 'INCOIS/IMD', riskType: 'coastal_flooding' },
  'Thane': { lat: 19.2183, lng: 72.9781, type: 'coastal', state: 'Maharashtra', ocean: 'Arabian Sea', agency: 'INCOIS/IMD' },
  'Navi Mumbai': { lat: 19.0330, lng: 73.0297, type: 'coastal', state: 'Maharashtra', ocean: 'Arabian Sea', agency: 'INCOIS/IMD' },
  'Ratnagiri': { lat: 16.9902, lng: 73.3120, type: 'coastal', state: 'Maharashtra', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Alibaug': { lat: 18.6414, lng: 72.8722, type: 'coastal', state: 'Maharashtra', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Goa': { lat: 15.4989, lng: 73.8278, type: 'coastal', state: 'Goa', ocean: 'Arabian Sea', agency: 'INCOIS/IMD', riskType: 'coastal_flooding' },
  'Panaji': { lat: 15.4909, lng: 73.8278, type: 'coastal', state: 'Goa', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Margao': { lat: 15.2736, lng: 73.9574, type: 'coastal', state: 'Goa', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Kochi': { lat: 9.9312, lng: 76.2673, type: 'coastal', state: 'Kerala', ocean: 'Arabian Sea/Lakshadweep Sea', agency: 'INCOIS', riskType: 'coastal_flooding' },
  'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366, type: 'coastal', state: 'Kerala', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Kozhikode': { lat: 11.2588, lng: 75.7804, type: 'coastal', state: 'Kerala', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Thrissur': { lat: 10.5276, lng: 76.2144, type: 'coastal', state: 'Kerala', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Kannur': { lat: 11.8745, lng: 75.3704, type: 'coastal', state: 'Kerala', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Alappuzha': { lat: 9.4981, lng: 76.3388, type: 'coastal', state: 'Kerala', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Kollam': { lat: 8.8932, lng: 76.6141, type: 'coastal', state: 'Kerala', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Mangalore': { lat: 12.9141, lng: 74.8560, type: 'coastal', state: 'Karnataka', ocean: 'Arabian Sea', agency: 'INCOIS', riskType: 'coastal_flooding' },
  'Udupi': { lat: 13.3409, lng: 74.7421, type: 'coastal', state: 'Karnataka', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Karwar': { lat: 14.8011, lng: 74.1293, type: 'coastal', state: 'Karnataka', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Surat': { lat: 21.1702, lng: 72.8311, type: 'coastal', state: 'Gujarat', ocean: 'Arabian Sea', agency: 'INCOIS/IMD', riskType: 'coastal_flooding' },
  'Porbandar': { lat: 21.6417, lng: 69.6293, type: 'coastal', state: 'Gujarat', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Dwarka': { lat: 22.2442, lng: 68.9685, type: 'coastal', state: 'Gujarat', ocean: 'Arabian Sea', agency: 'INCOIS', riskType: 'coastal_flooding' },
  'Veraval': { lat: 20.9064, lng: 70.3732, type: 'coastal', state: 'Gujarat', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Jamnagar': { lat: 22.4707, lng: 70.0577, type: 'coastal', state: 'Gujarat', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Bhavnagar': { lat: 21.7645, lng: 72.1519, type: 'coastal', state: 'Gujarat', ocean: 'Gulf of Khambhat', agency: 'INCOIS' },
  'Valsad': { lat: 20.5992, lng: 72.9342, type: 'coastal', state: 'Gujarat', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Daman': { lat: 20.3974, lng: 72.8328, type: 'coastal', state: 'Daman & Diu', ocean: 'Arabian Sea', agency: 'INCOIS' },
  'Diu': { lat: 20.7141, lng: 70.9876, type: 'coastal', state: 'Daman & Diu', ocean: 'Arabian Sea', agency: 'INCOIS' },

  // ── EAST COAST ─────────────────────────────────────
  'Chennai': { lat: 13.0827, lng: 80.2707, type: 'coastal', state: 'Tamil Nadu', ocean: 'Bay of Bengal', agency: 'INCOIS/IMD', riskType: 'coastal_flooding' },
  'Tuticorin': { lat: 8.7642, lng: 78.1348, type: 'coastal', state: 'Tamil Nadu', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Puducherry': { lat: 11.9416, lng: 79.8083, type: 'coastal', state: 'Puducherry', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Nagapattinam': { lat: 10.7672, lng: 79.8449, type: 'coastal', state: 'Tamil Nadu', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Cuddalore': { lat: 11.7447, lng: 79.7681, type: 'coastal', state: 'Tamil Nadu', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Rameswaram': { lat: 9.2876, lng: 79.3129, type: 'coastal', state: 'Tamil Nadu', ocean: 'Bay of Bengal/Palk Strait', agency: 'INCOIS' },
  'Visakhapatnam': { lat: 17.6868, lng: 83.2185, type: 'coastal', state: 'Andhra Pradesh', ocean: 'Bay of Bengal', agency: 'INCOIS', riskType: 'coastal_flooding' },
  'Visakhapatanam': { lat: 17.6868, lng: 83.2185, type: 'coastal', state: 'Andhra Pradesh', ocean: 'Bay of Bengal', agency: 'INCOIS', riskType: 'coastal_flooding' },
  'Kakinada': { lat: 16.9891, lng: 82.2475, type: 'coastal', state: 'Andhra Pradesh', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Nellore': { lat: 14.4426, lng: 79.9865, type: 'coastal', state: 'Andhra Pradesh', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Machilipatnam': { lat: 16.1875, lng: 81.1389, type: 'coastal', state: 'Andhra Pradesh', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Puri': { lat: 19.8135, lng: 85.8312, type: 'coastal', state: 'Odisha', ocean: 'Bay of Bengal', agency: 'INCOIS', riskType: 'coastal_flooding' },
  'Paradip': { lat: 20.3167, lng: 86.6167, type: 'coastal', state: 'Odisha', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Gopalpur': { lat: 19.2574, lng: 84.9045, type: 'coastal', state: 'Odisha', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Digha': { lat: 21.6272, lng: 87.5099, type: 'coastal', state: 'West Bengal', ocean: 'Bay of Bengal', agency: 'INCOIS', riskType: 'coastal_flooding' },
  'Kolkata': { lat: 22.5726, lng: 88.3639, type: 'coastal', state: 'West Bengal', ocean: 'Bay of Bengal/Hooghly', agency: 'INCOIS/CWC', riskType: 'coastal_flooding' },
  'Howrah': { lat: 22.5958, lng: 88.2636, type: 'coastal', state: 'West Bengal', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Haldia': { lat: 22.0667, lng: 88.0708, type: 'coastal', state: 'West Bengal', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Sagar Island': { lat: 21.6378, lng: 88.0618, type: 'coastal', state: 'West Bengal', ocean: 'Bay of Bengal', agency: 'INCOIS' },
  'Port Blair': { lat: 11.6234, lng: 92.7265, type: 'coastal', state: 'Andaman & Nicobar', ocean: 'Bay of Bengal/Andaman Sea', agency: 'INCOIS', riskType: 'coastal_flooding' },
  'Car Nicobar': { lat: 9.1506, lng: 92.8264, type: 'coastal', state: 'Andaman & Nicobar', ocean: 'Andaman Sea', agency: 'INCOIS' },
  'Kavaratti': { lat: 10.5593, lng: 72.6358, type: 'coastal', state: 'Lakshadweep', ocean: 'Arabian Sea/Laccadive Sea', agency: 'INCOIS' },

  // ── GUJARAT (INLAND) ──────────────────────────────
  'Ahmedabad': { lat: 23.0225, lng: 72.5714, type: 'river', river: 'Sabarmati', state: 'Gujarat', agency: 'CWC/GSSDMA' },
  'Vadodara': { lat: 22.3072, lng: 73.1812, type: 'river', river: 'Vishwamitri', state: 'Gujarat', agency: 'CWC/GSSDMA' },
  'Rajkot': { lat: 22.3039, lng: 70.8022, type: 'inland', state: 'Gujarat', agency: 'GSSDMA' },
  'Gandhinagar': { lat: 23.2156, lng: 72.6369, type: 'river', river: 'Sabarmati', state: 'Gujarat', agency: 'CWC/GSSDMA' },
  'Anand': { lat: 22.5645, lng: 72.9289, type: 'inland', state: 'Gujarat', agency: 'GSSDMA' },
  'Bharuch': { lat: 21.7051, lng: 72.9959, type: 'river', river: 'Narmada', state: 'Gujarat', agency: 'CWC/GSSDMA', riskType: 'river_overflow' },

  // ── MAHARASHTRA (INLAND) ─────────────────────────
  'Pune': { lat: 18.5204, lng: 73.8567, type: 'river', river: 'Mutha-Mula', state: 'Maharashtra', agency: 'CWC/MSDMA', riskType: 'urban_flooding' },
  'Nagpur': { lat: 21.1458, lng: 79.0882, type: 'river', river: 'Nag', state: 'Maharashtra', agency: 'CWC/MSDMA' },
  'Nashik': { lat: 20.0059, lng: 73.7798, type: 'river', river: 'Godavari', state: 'Maharashtra', agency: 'CWC/MSDMA', riskType: 'river_overflow' },
  'Aurangabad': { lat: 19.8762, lng: 75.3433, type: 'inland', state: 'Maharashtra', agency: 'MSDMA' },
  'Kolhapur': { lat: 16.7050, lng: 74.2433, type: 'river', river: 'Panchganga', state: 'Maharashtra', agency: 'CWC/MSDMA', riskType: 'river_overflow' },
  'Sangli': { lat: 16.8524, lng: 74.5815, type: 'river', river: 'Krishna', state: 'Maharashtra', agency: 'CWC/MSDMA', riskType: 'river_overflow' },
  'Solapur': { lat: 17.6599, lng: 75.9064, type: 'inland', state: 'Maharashtra', agency: 'MSDMA' },
  'Amravati': { lat: 20.9374, lng: 77.7796, type: 'inland', state: 'Maharashtra', agency: 'MSDMA' },

  // ── NORTH INDIA ──────────────────────────────────
  'Delhi': { lat: 28.6139, lng: 77.2090, type: 'river', river: 'Yamuna', state: 'Delhi', agency: 'DDMA/CWC', riskType: 'river_overflow' },
  'New Delhi': { lat: 28.6139, lng: 77.2090, type: 'river', river: 'Yamuna', state: 'Delhi', agency: 'DDMA/CWC', riskType: 'river_overflow' },
  'Noida': { lat: 28.5355, lng: 77.3910, type: 'river', river: 'Yamuna/Hindon', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA' },
  'Gurgaon': { lat: 28.4595, lng: 77.0266, type: 'inland', state: 'Haryana', agency: 'HSDMA' },
  'Gurugram': { lat: 28.4595, lng: 77.0266, type: 'inland', state: 'Haryana', agency: 'HSDMA' },
  'Faridabad': { lat: 28.4089, lng: 77.3178, type: 'river', river: 'Yamuna', state: 'Haryana', agency: 'HSDMA/CWC' },
  'Ghaziabad': { lat: 28.6692, lng: 77.4538, type: 'river', river: 'Hindon', state: 'Uttar Pradesh', agency: 'UPSDMA' },

  // ── PUNJAB / HARYANA ─────────────────────────────
  'Chandigarh': { lat: 30.7333, lng: 76.7794, type: 'inland', state: 'Punjab/Haryana', agency: 'CWC/HSDMA' },
  'Ludhiana': { lat: 30.9010, lng: 75.8573, type: 'river', river: 'Sutlej', state: 'Punjab', agency: 'CWC/PSDMA', riskType: 'river_overflow' },
  'Amritsar': { lat: 31.6340, lng: 74.8723, type: 'inland', state: 'Punjab', agency: 'PSDMA' },
  'Jalandhar': { lat: 31.3260, lng: 75.5762, type: 'river', river: 'Bein', state: 'Punjab', agency: 'PSDMA' },
  'Patiala': { lat: 30.3398, lng: 76.3869, type: 'river', river: 'Ghaggar', state: 'Punjab', agency: 'CWC/PSDMA', riskType: 'river_overflow' },
  'Mohali': { lat: 30.7046, lng: 76.7179, type: 'inland', state: 'Punjab', agency: 'PSDMA' },
  'Ferozepur': { lat: 30.9236, lng: 74.6157, type: 'river', river: 'Sutlej', state: 'Punjab', agency: 'CWC/PSDMA', riskType: 'river_overflow' },
  'Ambala': { lat: 30.3782, lng: 76.7767, type: 'inland', state: 'Haryana', agency: 'HSDMA' },
  'Hisar': { lat: 29.1492, lng: 75.7217, type: 'inland', state: 'Haryana', agency: 'HSDMA' },
  'Rohtak': { lat: 28.8955, lng: 76.6066, type: 'inland', state: 'Haryana', agency: 'HSDMA' },
  'Karnal': { lat: 29.6857, lng: 76.9905, type: 'river', river: 'Ghaggar/Western Yamuna Canal', state: 'Haryana', agency: 'HSDMA' },
  'Yamunanagar': { lat: 30.1290, lng: 77.2906, type: 'river', river: 'Yamuna', state: 'Haryana', agency: 'CWC/HSDMA', riskType: 'river_overflow' },

  // ── RAJASTHAN ────────────────────────────────────
  'Jaipur': { lat: 26.9124, lng: 75.7873, type: 'inland', state: 'Rajasthan', agency: 'RSDMA', riskType: 'urban_flooding' },
  'Jodhpur': { lat: 26.2389, lng: 73.0243, type: 'inland', state: 'Rajasthan', agency: 'RSDMA' },
  'Udaipur': { lat: 24.5854, lng: 73.7125, type: 'river', river: 'Ahar', state: 'Rajasthan', agency: 'CWC/RSDMA', riskType: 'river_overflow' },
  'Ajmer': { lat: 26.4499, lng: 74.6399, type: 'inland', state: 'Rajasthan', agency: 'RSDMA' },
  'Kota': { lat: 25.2138, lng: 75.8648, type: 'river', river: 'Chambal', state: 'Rajasthan', agency: 'CWC/RSDMA', riskType: 'river_overflow' },
  'Bikaner': { lat: 28.0229, lng: 73.3119, type: 'inland', state: 'Rajasthan', agency: 'RSDMA' },
  'Alwar': { lat: 27.5530, lng: 76.6346, type: 'inland', state: 'Rajasthan', agency: 'RSDMA' },
  'Bharatpur': { lat: 27.2152, lng: 77.4943, type: 'inland', state: 'Rajasthan', agency: 'RSDMA' },
  'Barmer': { lat: 25.7521, lng: 71.3967, type: 'inland', state: 'Rajasthan', agency: 'RSDMA' },

  // ── UTTAR PRADESH ───────────────────────────────
  'Lucknow': { lat: 26.8467, lng: 80.9462, type: 'river', river: 'Gomti', state: 'Uttar Pradesh', agency: 'UPSDMA/CWC', riskType: 'urban_flooding' },
  'Kanpur': { lat: 26.4499, lng: 80.3319, type: 'river', river: 'Ganga', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA', riskType: 'river_overflow' },
  'Agra': { lat: 27.1767, lng: 78.0081, type: 'river', river: 'Yamuna', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA', riskType: 'river_overflow' },
  'Varanasi': { lat: 25.3176, lng: 82.9739, type: 'river', river: 'Ganga', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA', riskType: 'river_overflow' },
  'Allahabad': { lat: 25.4358, lng: 81.8463, type: 'river', river: 'Ganga/Yamuna Sangam', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA', riskType: 'river_overflow' },
  'Prayagraj': { lat: 25.4358, lng: 81.8463, type: 'river', river: 'Ganga/Yamuna Sangam', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA', riskType: 'river_overflow' },
  'Meerut': { lat: 28.9845, lng: 77.7064, type: 'inland', state: 'Uttar Pradesh', agency: 'UPSDMA' },
  'Mathura': { lat: 27.4924, lng: 77.6737, type: 'river', river: 'Yamuna', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA', riskType: 'river_overflow' },
  'Gorakhpur': { lat: 26.7606, lng: 83.3732, type: 'river', river: 'Rapti/Rohini', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA', riskType: 'river_overflow' },
  'Moradabad': { lat: 28.8386, lng: 78.7733, type: 'river', river: 'Ramganga', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA', riskType: 'river_overflow' },
  'Bareilly': { lat: 28.3670, lng: 79.4304, type: 'river', river: 'Ramganga', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA', riskType: 'river_overflow' },
  'Jhansi': { lat: 25.4484, lng: 78.5685, type: 'river', river: 'Betwa', state: 'Uttar Pradesh', agency: 'CWC/UPSDMA' },
  'Saharanpur': { lat: 29.9680, lng: 77.5552, type: 'river', river: 'Solani/Hindon', state: 'Uttar Pradesh', agency: 'UPSDMA' },
  'Aligarh': { lat: 27.8974, lng: 78.0880, type: 'inland', state: 'Uttar Pradesh', agency: 'UPSDMA' },

  // ── BIHAR ────────────────────────────────────────
  'Patna': { lat: 25.5941, lng: 85.1376, type: 'river', river: 'Ganga', state: 'Bihar', agency: 'BSDMA/CWC', riskType: 'river_overflow' },
  'Gaya': { lat: 24.7955, lng: 85.0022, type: 'river', river: 'Falgu', state: 'Bihar', agency: 'BSDMA' },
  'Bhagalpur': { lat: 25.2425, lng: 86.9842, type: 'river', river: 'Ganga', state: 'Bihar', agency: 'BSDMA/CWC', riskType: 'river_overflow' },
  'Muzaffarpur': { lat: 26.1209, lng: 85.3647, type: 'river', river: 'Gandak/Bagmati', state: 'Bihar', agency: 'BSDMA/CWC', riskType: 'river_overflow' },
  'Darbhanga': { lat: 26.1542, lng: 85.8918, type: 'river', river: 'Bagmati/Kamla', state: 'Bihar', agency: 'BSDMA/CWC', riskType: 'river_overflow' },
  'Motihari': { lat: 26.6510, lng: 84.9221, type: 'river', river: 'Gandak', state: 'Bihar', agency: 'BSDMA/CWC', riskType: 'river_overflow' },
  'Purnia': { lat: 25.7771, lng: 87.4753, type: 'river', river: 'Kosi', state: 'Bihar', agency: 'BSDMA/CWC', riskType: 'river_overflow' },
  'Ara': { lat: 25.5562, lng: 84.6536, type: 'river', river: 'Ganga/Sone', state: 'Bihar', agency: 'BSDMA' },
  'Begusarai': { lat: 25.4182, lng: 86.1272, type: 'river', river: 'Ganga/Burhi Gandak', state: 'Bihar', agency: 'BSDMA/CWC', riskType: 'river_overflow' },
  'Sitamarhi': { lat: 26.5940, lng: 85.4831, type: 'river', river: 'Bagmati', state: 'Bihar', agency: 'BSDMA/CWC', riskType: 'river_overflow' },
  'Supaul': { lat: 25.8714, lng: 86.5958, type: 'river', river: 'Kosi', state: 'Bihar', agency: 'BSDMA/CWC', riskType: 'river_overflow' },

  // ── JHARKHAND ────────────────────────────────────
  'Ranchi': { lat: 23.3441, lng: 85.3096, type: 'inland', state: 'Jharkhand', agency: 'JSDMA' },
  'Jamshedpur': { lat: 22.8046, lng: 86.2029, type: 'river', river: 'Subarnarekha', state: 'Jharkhand', agency: 'CWC/JSDMA', riskType: 'river_overflow' },
  'Dhanbad': { lat: 23.7957, lng: 86.4304, type: 'river', river: 'Damodar', state: 'Jharkhand', agency: 'CWC/JSDMA', riskType: 'river_overflow' },
  'Bokaro': { lat: 23.6693, lng: 86.1511, type: 'river', river: 'Damodar', state: 'Jharkhand', agency: 'CWC/JSDMA' },
  'Hazaribagh': { lat: 23.9925, lng: 85.3637, type: 'inland', state: 'Jharkhand', agency: 'JSDMA' },

  // ── MADHYA PRADESH ───────────────────────────────
  'Bhopal': { lat: 23.2599, lng: 77.4126, type: 'river', river: 'Betwa', state: 'Madhya Pradesh', agency: 'MPSDMA/CWC', riskType: 'urban_flooding' },
  'Indore': { lat: 22.7196, lng: 75.8577, type: 'river', river: 'Saraswati/Khan', state: 'Madhya Pradesh', agency: 'MPSDMA', riskType: 'urban_flooding' },
  'Jabalpur': { lat: 23.1815, lng: 79.9864, type: 'river', river: 'Narmada', state: 'Madhya Pradesh', agency: 'CWC/MPSDMA', riskType: 'river_overflow' },
  'Gwalior': { lat: 26.2183, lng: 78.1828, type: 'inland', state: 'Madhya Pradesh', agency: 'MPSDMA' },
  'Ujjain': { lat: 23.1765, lng: 75.7885, type: 'river', river: 'Shipra', state: 'Madhya Pradesh', agency: 'CWC/MPSDMA', riskType: 'river_overflow' },
  'Sagar': { lat: 23.8388, lng: 78.7378, type: 'inland', state: 'Madhya Pradesh', agency: 'MPSDMA' },
  'Rewa': { lat: 24.5362, lng: 81.2987, type: 'river', river: 'Tons/Beehar', state: 'Madhya Pradesh', agency: 'MPSDMA' },
  'Satna': { lat: 24.5703, lng: 80.8322, type: 'inland', state: 'Madhya Pradesh', agency: 'MPSDMA' },

  // ── CHHATTISGARH ─────────────────────────────────
  'Raipur': { lat: 21.2514, lng: 81.6296, type: 'river', river: 'Mahanadi', state: 'Chhattisgarh', agency: 'CWC/CGSDMA', riskType: 'river_overflow' },
  'Bilaspur': { lat: 22.0797, lng: 82.1409, type: 'river', river: 'Arpa/Mahanadi', state: 'Chhattisgarh', agency: 'CWC/CGSDMA', riskType: 'river_overflow' },
  'Durg': { lat: 21.1904, lng: 81.2849, type: 'inland', state: 'Chhattisgarh', agency: 'CGSDMA' },
  'Korba': { lat: 22.3595, lng: 82.7501, type: 'river', river: 'Hasdeo', state: 'Chhattisgarh', agency: 'CGSDMA' },

  // ── TELANGANA ─────────────────────────────────────
  'Hyderabad': { lat: 17.3850, lng: 78.4867, type: 'river', river: 'Musi', state: 'Telangana', agency: 'TSSDMA/CWC', riskType: 'urban_flooding' },
  'Secunderabad': { lat: 17.4399, lng: 78.4983, type: 'inland', state: 'Telangana', agency: 'TSSDMA' },
  'Warangal': { lat: 17.9689, lng: 79.5941, type: 'river', river: 'Godavari', state: 'Telangana', agency: 'CWC/TSSDMA', riskType: 'river_overflow' },
  'Nizamabad': { lat: 18.6725, lng: 78.0941, type: 'river', river: 'Godavari', state: 'Telangana', agency: 'CWC/TSSDMA', riskType: 'river_overflow' },
  'Karimnagar': { lat: 18.4386, lng: 79.1288, type: 'river', river: 'Godavari', state: 'Telangana', agency: 'CWC/TSSDMA', riskType: 'river_overflow' },
  'Khammam': { lat: 17.2473, lng: 80.1514, type: 'river', river: 'Godavari/Kinnerasani', state: 'Telangana', agency: 'CWC/TSSDMA', riskType: 'river_overflow' },

  // ── ANDHRA PRADESH (INLAND) ─────────────────────
  'Vijayawada': { lat: 16.5062, lng: 80.6480, type: 'river', river: 'Krishna', state: 'Andhra Pradesh', agency: 'CWC/APSDMA', riskType: 'river_overflow' },
  'Guntur': { lat: 16.3067, lng: 80.4365, type: 'river', river: 'Krishna', state: 'Andhra Pradesh', agency: 'APSDMA' },
  'Tirupati': { lat: 13.6288, lng: 79.4192, type: 'inland', state: 'Andhra Pradesh', agency: 'APSDMA' },
  'Kurnool': { lat: 15.8281, lng: 78.0373, type: 'river', river: 'Tungabhadra/Krishna', state: 'Andhra Pradesh', agency: 'CWC/APSDMA', riskType: 'river_overflow' },
  'Rajahmundry': { lat: 16.9845, lng: 81.7785, type: 'river', river: 'Godavari', state: 'Andhra Pradesh', agency: 'CWC/APSDMA', riskType: 'river_overflow' },

  // ── KARNATAKA (INLAND) ───────────────────────────
  'Bengaluru': { lat: 12.9716, lng: 77.5946, type: 'river', river: 'Vrishabhavathi/Arkavathi', state: 'Karnataka', agency: 'KSSDMA', riskType: 'urban_flooding' },
  'Bangalore': { lat: 12.9716, lng: 77.5946, type: 'river', river: 'Vrishabhavathi/Arkavathi', state: 'Karnataka', agency: 'KSSDMA', riskType: 'urban_flooding' },
  'Mysore': { lat: 12.2958, lng: 76.6394, type: 'river', river: 'Cauvery', state: 'Karnataka', agency: 'CWC/KSSDMA', riskType: 'river_overflow' },
  'Mysuru': { lat: 12.2958, lng: 76.6394, type: 'river', river: 'Cauvery', state: 'Karnataka', agency: 'CWC/KSSDMA', riskType: 'river_overflow' },
  'Hubli': { lat: 15.3647, lng: 75.1240, type: 'inland', state: 'Karnataka', agency: 'KSSDMA' },
  'Dharwad': { lat: 15.4589, lng: 75.0078, type: 'inland', state: 'Karnataka', agency: 'KSSDMA' },
  'Belgaum': { lat: 15.8497, lng: 74.4977, type: 'river', river: 'Ghataprabha/Malaprabha', state: 'Karnataka', agency: 'CWC/KSSDMA', riskType: 'river_overflow' },
  'Bellary': { lat: 15.1394, lng: 76.9214, type: 'river', river: 'Tungabhadra', state: 'Karnataka', agency: 'CWC/KSSDMA', riskType: 'river_overflow' },
  'Gulbarga': { lat: 17.3297, lng: 76.8343, type: 'river', river: 'Bhima', state: 'Karnataka', agency: 'CWC/KSSDMA', riskType: 'river_overflow' },
  'Raichur': { lat: 16.2120, lng: 77.3439, type: 'river', river: 'Krishna/Tungabhadra', state: 'Karnataka', agency: 'CWC/KSSDMA', riskType: 'river_overflow' },

  // ── TAMIL NADU (INLAND) ─────────────────────────
  'Coimbatore': { lat: 11.0168, lng: 76.9558, type: 'river', river: 'Noyyal', state: 'Tamil Nadu', agency: 'TNSDMA' },
  'Madurai': { lat: 9.9252, lng: 78.1198, type: 'river', river: 'Vaigai', state: 'Tamil Nadu', agency: 'CWC/TNSDMA', riskType: 'river_overflow' },
  'Tiruchirappalli': { lat: 10.7905, lng: 78.7047, type: 'river', river: 'Cauvery', state: 'Tamil Nadu', agency: 'CWC/TNSDMA', riskType: 'river_overflow' },
  'Salem': { lat: 11.6643, lng: 78.1460, type: 'river', river: 'Cauvery/Thirumanimuthar', state: 'Tamil Nadu', agency: 'TNSDMA' },
  'Tirunelveli': { lat: 8.7139, lng: 77.7567, type: 'river', river: 'Tamiraparani', state: 'Tamil Nadu', agency: 'TNSDMA' },
  'Erode': { lat: 11.3410, lng: 77.7172, type: 'river', river: 'Cauvery/Bhavani', state: 'Tamil Nadu', agency: 'CWC/TNSDMA', riskType: 'river_overflow' },
  'Thanjavur': { lat: 10.7870, lng: 79.1378, type: 'river', river: 'Cauvery', state: 'Tamil Nadu', agency: 'CWC/TNSDMA', riskType: 'river_overflow' },

  // ── ODISHA (INLAND) ─────────────────────────────
  'Bhubaneswar': { lat: 20.2961, lng: 85.8245, type: 'inland', state: 'Odisha', agency: 'OSDMA' },
  'Cuttack': { lat: 20.4625, lng: 85.8828, type: 'river', river: 'Mahanadi', state: 'Odisha', agency: 'CWC/OSDMA', riskType: 'river_overflow' },
  'Berhampur': { lat: 19.3150, lng: 84.7941, type: 'coastal', state: 'Odisha', ocean: 'Bay of Bengal', agency: 'INCOIS/OSDMA' },
  'Rourkela': { lat: 22.2604, lng: 84.8536, type: 'river', river: 'Brahmani/Sankh', state: 'Odisha', agency: 'CWC/OSDMA', riskType: 'river_overflow' },
  'Sambalpur': { lat: 21.4669, lng: 83.9756, type: 'river', river: 'Mahanadi', state: 'Odisha', agency: 'CWC/OSDMA', riskType: 'river_overflow' },

  // ── WEST BENGAL (INLAND) ─────────────────────────
  'Siliguri': { lat: 26.7271, lng: 88.3953, type: 'river', river: 'Teesta/Mahananda', state: 'West Bengal', agency: 'CWC/WBSDMA', riskType: 'river_overflow' },
  'Asansol': { lat: 23.6889, lng: 86.9661, type: 'river', river: 'Damodar', state: 'West Bengal', agency: 'CWC/WBSDMA', riskType: 'river_overflow' },
  'Durgapur': { lat: 23.5204, lng: 87.3119, type: 'river', river: 'Damodar', state: 'West Bengal', agency: 'CWC/WBSDMA', riskType: 'river_overflow' },
  'Bardhaman': { lat: 23.2324, lng: 87.8615, type: 'river', river: 'Damodar/Ajay', state: 'West Bengal', agency: 'CWC/WBSDMA', riskType: 'river_overflow' },
  'Malda': { lat: 25.0108, lng: 88.1415, type: 'river', river: 'Ganga/Mahananda', state: 'West Bengal', agency: 'CWC/WBSDMA', riskType: 'river_overflow' },
  'Jalpaiguri': { lat: 26.5449, lng: 88.7179, type: 'river', river: 'Teesta', state: 'West Bengal', agency: 'CWC/WBSDMA', riskType: 'river_overflow' },

  // ── NORTHEAST INDIA ──────────────────────────────
  'Guwahati': { lat: 26.1445, lng: 91.7362, type: 'river', river: 'Brahmaputra', state: 'Assam', agency: 'ASDMA/CWC', riskType: 'river_overflow' },
  'Dibrugarh': { lat: 27.4728, lng: 94.9120, type: 'river', river: 'Brahmaputra', state: 'Assam', agency: 'ASDMA/CWC', riskType: 'river_overflow' },
  'Jorhat': { lat: 26.7465, lng: 94.2026, type: 'river', river: 'Brahmaputra', state: 'Assam', agency: 'ASDMA/CWC', riskType: 'river_overflow' },
  'Silchar': { lat: 24.8333, lng: 92.7789, type: 'river', river: 'Barak', state: 'Assam', agency: 'ASDMA/CWC', riskType: 'river_overflow' },
  'Nagaon': { lat: 26.3468, lng: 92.6855, type: 'river', river: 'Brahmaputra/Kapili', state: 'Assam', agency: 'ASDMA', riskType: 'river_overflow' },
  'Tezpur': { lat: 26.6338, lng: 92.8005, type: 'river', river: 'Brahmaputra', state: 'Assam', agency: 'ASDMA/CWC', riskType: 'river_overflow' },
  'Bongaigaon': { lat: 26.4783, lng: 90.5580, type: 'river', river: 'Brahmaputra/Beki', state: 'Assam', agency: 'ASDMA', riskType: 'river_overflow' },
  'Shillong': { lat: 25.5788, lng: 91.8933, type: 'inland', state: 'Meghalaya', agency: 'MSDMA', riskType: 'urban_flooding' },
  'Cherrapunji': { lat: 25.2900, lng: 91.7200, type: 'inland', state: 'Meghalaya', agency: 'MSDMA', riskType: 'urban_flooding' },
  'Imphal': { lat: 24.8170, lng: 93.9368, type: 'river', river: 'Iril', state: 'Manipur', agency: 'MNDMA', riskType: 'urban_flooding' },
  'Agartala': { lat: 23.8315, lng: 91.2868, type: 'river', river: 'Haora/Gomati', state: 'Tripura', agency: 'TDMA', riskType: 'river_overflow' },
  'Kohima': { lat: 25.6751, lng: 94.1086, type: 'inland', state: 'Nagaland', agency: 'NSDMA' },
  'Aizawl': { lat: 23.7307, lng: 92.7173, type: 'inland', state: 'Mizoram', agency: 'MSDMA' },
  'Itanagar': { lat: 27.0844, lng: 93.6053, type: 'river', river: 'Dikrong', state: 'Arunachal Pradesh', agency: 'APDMA', riskType: 'river_overflow' },
  'Gangtok': { lat: 27.3389, lng: 88.6065, type: 'river', river: 'Teesta', state: 'Sikkim', agency: 'SSDMA', riskType: 'river_overflow' },

  // ── UTTARAKHAND / HIMACHAL ───────────────────────
  'Dehradun': { lat: 30.3165, lng: 78.0322, type: 'river', river: 'Suswa/Rispana', state: 'Uttarakhand', agency: 'USDMA', riskType: 'urban_flooding' },
  'Haridwar': { lat: 29.9457, lng: 78.1642, type: 'river', river: 'Ganga', state: 'Uttarakhand', agency: 'CWC/USDMA', riskType: 'river_overflow' },
  'Rishikesh': { lat: 30.0869, lng: 78.2676, type: 'river', river: 'Ganga', state: 'Uttarakhand', agency: 'CWC/USDMA', riskType: 'river_overflow' },
  'Nainital': { lat: 29.3919, lng: 79.4542, type: 'inland', state: 'Uttarakhand', agency: 'USDMA' },
  'Roorkee': { lat: 29.8543, lng: 77.8880, type: 'river', river: 'Solani', state: 'Uttarakhand', agency: 'USDMA' },
  'Shimla': { lat: 31.1048, lng: 77.1734, type: 'inland', state: 'Himachal Pradesh', agency: 'HPSDMA', riskType: 'urban_flooding' },
  'Manali': { lat: 32.2396, lng: 77.1887, type: 'river', river: 'Beas', state: 'Himachal Pradesh', agency: 'CWC/HPSDMA', riskType: 'river_overflow' },
  'Dharamsala': { lat: 32.2190, lng: 76.3234, type: 'inland', state: 'Himachal Pradesh', agency: 'HPSDMA', riskType: 'urban_flooding' },
  'Kullu': { lat: 31.9583, lng: 77.1089, type: 'river', river: 'Beas', state: 'Himachal Pradesh', agency: 'CWC/HPSDMA', riskType: 'river_overflow' },
  'Mandi': { lat: 31.7089, lng: 76.9320, type: 'river', river: 'Beas', state: 'Himachal Pradesh', agency: 'CWC/HPSDMA', riskType: 'river_overflow' },
  'Solan': { lat: 30.9045, lng: 77.0967, type: 'inland', state: 'Himachal Pradesh', agency: 'HPSDMA' },

  // ── JAMMU & KASHMIR ─────────────────────────────
  'Srinagar': { lat: 34.0837, lng: 74.7973, type: 'river', river: 'Jhelum', state: 'Jammu & Kashmir', agency: 'JKSDMA/CWC', riskType: 'river_overflow' },
  'Jammu': { lat: 32.7266, lng: 74.8570, type: 'river', river: 'Tawi', state: 'Jammu & Kashmir', agency: 'JKSDMA/CWC', riskType: 'river_overflow' },
  'Katra': { lat: 32.9915, lng: 74.9320, type: 'river', river: 'Tawi', state: 'Jammu & Kashmir', agency: 'JKSDMA' },
  'Leh': { lat: 34.1526, lng: 77.5771, type: 'inland', state: 'Ladakh', agency: 'LADMA' },

  // ── ODISHA (COASTAL already above) ──────────────
};

/**
 * Lookup a region by name (case-insensitive, partial match supported).
 */
export function getRegionInfo(regionName: string): IndiaRegionInfo | null {
  if (!regionName) return null;
  const normalized = regionName.trim();

  // 1. Direct exact match
  if (INDIA_CITY_MAP[normalized]) return INDIA_CITY_MAP[normalized];

  // 2. Case-insensitive exact match
  const exactKey = Object.keys(INDIA_CITY_MAP).find(
    k => k.toLowerCase() === normalized.toLowerCase()
  );
  if (exactKey) return INDIA_CITY_MAP[exactKey];

  // 3. Partial match — does any key appear inside the region string?
  const partialKey = Object.keys(INDIA_CITY_MAP).find(
    k => normalized.toLowerCase().includes(k.toLowerCase())
  );
  if (partialKey) return INDIA_CITY_MAP[partialKey];

  // 4. Does the region string contain any key?
  const reverseKey = Object.keys(INDIA_CITY_MAP).find(
    k => k.toLowerCase().includes(normalized.toLowerCase())
  );
  if (reverseKey) return INDIA_CITY_MAP[reverseKey];

  return null;
}

/**
 * Haversine distance in km between two lat/lng points.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
