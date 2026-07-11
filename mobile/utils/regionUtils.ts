export const DEFAULT_INDIA_CENTER = { lat: 22.0, lng: 78.0 };

const COASTAL_KEYWORDS = [
  'coast',
  'sea',
  'bay',
  'harbour',
  'harbor',
  'beach',
  'marine',
  'port',
  'gulf',
  'island',
  'andaman',
  'lakshadweep',
  'mumbai',
  'chennai',
  'goa',
  'kochi',
  'visakhapatnam',
  'puri',
  'kanyakumari',
  'pondicherry',
  'gujarat',
  'maharashtra',
  'kerala',
  'tamil nadu',
  'karnataka',
  'andhra pradesh',
  'odisha',
  'west bengal'
];

const INLAND_KEYWORDS = [
  'bihar',
  'jharkhand',
  'uttar pradesh',
  'madhya pradesh',
  'rajasthan',
  'punjab',
  'haryana',
  'delhi',
  'chandigarh',
  'himachal',
  'uttarakhand',
  'jharkhand',
  'assam',
  'mizoram',
  'nagaland',
  'tripura',
  'manipur',
  'meghalaya',
  'sikkim',
  'jammu',
  'kashmir',
  'ladakh'
];

export function normalizeRegionName(regionName: string): string {
  return String(regionName || '').trim();
}

export function isCoastalRegion(regionName: string): boolean {
  const normalized = normalizeRegionName(regionName).toLowerCase();
  if (!normalized || normalized === 'india') return false;
  return COASTAL_KEYWORDS.some(keyword => normalized.includes(keyword));
}

export function isInlandRegion(regionName: string): boolean {
  const normalized = normalizeRegionName(regionName).toLowerCase();
  if (!normalized || normalized === 'india') return false;
  return INLAND_KEYWORDS.some(keyword => normalized.includes(keyword));
}

export const INDIA_REGION_SUGGESTIONS = [
  'Mumbai', 'Chennai', 'Kolkata', 'Visakhapatnam', 'Goa', 'Kochi', 'Puducherry', 'Thiruvananthapuram',
  'Panaji', 'Mangalore', 'Surat', 'Digha', 'Puri', 'Kanyakumari', 'Port Blair',
  'Ahmedabad', 'Bengaluru', 'Hyderabad', 'Jaipur', 'Lucknow', 'Patna', 'Guwahati',
  'Dehradun', 'Srinagar', 'Bhubaneswar', 'Kolkata', 'Margao', 'Porbandar', 'Visakhapatnam',
  'Tumakuru', 'Tirupati', 'Jammu', 'Shimla', 'Agartala', 'Aizawl', 'Itanagar', 'Imphal',
  'Dharamshala', 'Rameswaram', 'Nagapattinam', 'Mahabalipuram', 'Kanyakumari', 'Puri'
];

export function getRegionSuggestions(query: string): string[] {
  const normalized = normalizeRegionName(query).toLowerCase();
  if (!normalized) return [];

  return INDIA_REGION_SUGGESTIONS.filter((region) =>
    normalizeRegionName(region).toLowerCase().includes(normalized)
  ).slice(0, 8);
}

export async function resolveRegionCoordinates(regionName: string): Promise<{ lat: number; lng: number }> {
  const normalized = normalizeRegionName(regionName);
  if (!normalized || normalized.toLowerCase() === 'india') {
    return DEFAULT_INDIA_CENTER;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(normalized + ', India')}`,
      {
        headers: {
          'User-Agent': 'SentinelSeaMobileClient/1.0'
        }
      }
    );
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      }
    }
  } catch (error) {
    console.warn('Region coordinate lookup failed:', error);
  }

  return DEFAULT_INDIA_CENTER;
}
