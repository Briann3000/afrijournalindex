// Comprehensive African Nations Catalog for AfriJournal Index

export interface AfricanCountryMeta {
  code: string;
  name: string;
  region: "East" | "West" | "Southern" | "North" | "Central";
  flag: string;
  defaultJournals: number;
  defaultArticles: number;
  topDiscipline: string;
}

export const ALL_AFRICAN_COUNTRIES: AfricanCountryMeta[] = [
  { code: "DZ", name: "Algeria", region: "North", flag: "🇩🇿", defaultJournals: 15, defaultArticles: 340, topDiscipline: "Engineering & Technology" },
  { code: "AO", name: "Angola", region: "Central", flag: "🇦🇴", defaultJournals: 5, defaultArticles: 110, topDiscipline: "Petroleum & Geosciences" },
  { code: "BJ", name: "Benin", region: "West", flag: "🇧🇯", defaultJournals: 6, defaultArticles: 120, topDiscipline: "Agriculture & Forestry" },
  { code: "BW", name: "Botswana", region: "Southern", flag: "🇧🇼", defaultJournals: 10, defaultArticles: 210, topDiscipline: "Business & Humanities" },
  { code: "BF", name: "Burkina Faso", region: "West", flag: "🇧🇫", defaultJournals: 6, defaultArticles: 130, topDiscipline: "Agronomy & Public Health" },
  { code: "BI", name: "Burundi", region: "East", flag: "🇧🇮", defaultJournals: 4, defaultArticles: 85, topDiscipline: "Agricultural Economics" },
  { code: "CM", name: "Cameroon", region: "Central", flag: "🇨🇲", defaultJournals: 12, defaultArticles: 280, topDiscipline: "Medical Sciences" },
  { code: "CV", name: "Cape Verde", region: "West", flag: "🇨🇻", defaultJournals: 3, defaultArticles: 60, topDiscipline: "Marine Ecosystems" },
  { code: "CF", name: "Central African Republic", region: "Central", flag: "🇨🇫", defaultJournals: 3, defaultArticles: 50, topDiscipline: "Forestry & Biodiversity" },
  { code: "TD", name: "Chad", region: "Central", flag: "🇹🇩", defaultJournals: 4, defaultArticles: 75, topDiscipline: "Livestock & Environmental Sciences" },
  { code: "KM", name: "Comoros", region: "East", flag: "🇰🇲", defaultJournals: 2, defaultArticles: 40, topDiscipline: "Island Ecology" },
  { code: "CG", name: "Republic of the Congo", region: "Central", flag: "🇨🇬", defaultJournals: 5, defaultArticles: 105, topDiscipline: "Tropical Forestry" },
  { code: "CD", name: "Democratic Republic of the Congo", region: "Central", flag: "🇨🇩", defaultJournals: 9, defaultArticles: 185, topDiscipline: "Public Health & Forestry" },
  { code: "DJ", name: "Djibouti", region: "East", flag: "🇩🇯", defaultJournals: 3, defaultArticles: 55, topDiscipline: "Geothermal & Maritime" },
  { code: "EG", name: "Egypt", region: "North", flag: "🇪🇬", defaultJournals: 58, defaultArticles: 1620, topDiscipline: "Physical Sciences & Engineering" },
  { code: "GQ", name: "Equatorial Guinea", region: "Central", flag: "🇬🇶", defaultJournals: 3, defaultArticles: 45, topDiscipline: "Public Health" },
  { code: "ER", name: "Eritrea", region: "East", flag: "🇪🇷", defaultJournals: 3, defaultArticles: 50, topDiscipline: "Agricultural Technology" },
  { code: "SZ", name: "Eswatini", region: "Southern", flag: "🇸🇿", defaultJournals: 4, defaultArticles: 90, topDiscipline: "Agronomy & Health" },
  { code: "ET", name: "Ethiopia", region: "East", flag: "🇪🇹", defaultJournals: 24, defaultArticles: 520, topDiscipline: "Agricultural & Health" },
  { code: "GA", name: "Gabon", region: "Central", flag: "🇬🇦", defaultJournals: 5, defaultArticles: 110, topDiscipline: "Biomedical & Ecology" },
  { code: "GM", name: "Gambia", region: "West", flag: "🇬🇲", defaultJournals: 4, defaultArticles: 80, topDiscipline: "Tropical Medicine" },
  { code: "GH", name: "Ghana", region: "West", flag: "🇬🇭", defaultJournals: 28, defaultArticles: 610, topDiscipline: "Social Sciences & Humanities" },
  { code: "GN", name: "Guinea", region: "West", flag: "🇬🇳", defaultJournals: 4, defaultArticles: 75, topDiscipline: "Mining & Public Health" },
  { code: "GW", name: "Guinea-Bissau", region: "West", flag: "🇬🇼", defaultJournals: 2, defaultArticles: 35, topDiscipline: "Fisheries & Ecology" },
  { code: "CI", name: "Ivory Coast", region: "West", flag: "🇨🇮", defaultJournals: 9, defaultArticles: 195, topDiscipline: "Tropical Agriculture" },
  { code: "KE", name: "Kenya", region: "East", flag: "🇰🇪", defaultJournals: 84, defaultArticles: 1840, topDiscipline: "Social Sciences & Education" },
  { code: "LS", name: "Lesotho", region: "Southern", flag: "🇱🇸", defaultJournals: 3, defaultArticles: 60, topDiscipline: "Development Studies" },
  { code: "LR", name: "Liberia", region: "West", flag: "🇱🇷", defaultJournals: 4, defaultArticles: 70, topDiscipline: "Public Health & Forestry" },
  { code: "LY", name: "Libya", region: "North", flag: "🇱🇾", defaultJournals: 7, defaultArticles: 150, topDiscipline: "Medical & Engineering" },
  { code: "MG", name: "Madagascar", region: "Southern", flag: "🇲🇬", defaultJournals: 8, defaultArticles: 170, topDiscipline: "Biodiversity & Ecology" },
  { code: "MW", name: "Malawi", region: "East", flag: "🇲🇼", defaultJournals: 5, defaultArticles: 115, topDiscipline: "Epidemiology & Agriculture" },
  { code: "ML", name: "Mali", region: "West", flag: "🇲🇱", defaultJournals: 5, defaultArticles: 95, topDiscipline: "Tropical Medicine" },
  { code: "MR", name: "Mauritania", region: "West", flag: "🇲🇷", defaultJournals: 3, defaultArticles: 65, topDiscipline: "Oceanography & Mining" },
  { code: "MU", name: "Mauritius", region: "Southern", flag: "🇲🇺", defaultJournals: 7, defaultArticles: 160, topDiscipline: "Oceanography & Tech" },
  { code: "MA", name: "Morocco", region: "North", flag: "🇲🇦", defaultJournals: 18, defaultArticles: 420, topDiscipline: "Physical & Natural Sciences" },
  { code: "MZ", name: "Mozambique", region: "Southern", flag: "🇲🇿", defaultJournals: 8, defaultArticles: 180, topDiscipline: "Agriculture & Marine" },
  { code: "NA", name: "Namibia", region: "Southern", flag: "🇳🇦", defaultJournals: 6, defaultArticles: 140, topDiscipline: "Environmental Science" },
  { code: "NE", name: "Niger", region: "West", flag: "🇳🇪", defaultJournals: 4, defaultArticles: 70, topDiscipline: "Desert Ecology & Agronomy" },
  { code: "NG", name: "Nigeria", region: "West", flag: "🇳🇬", defaultJournals: 76, defaultArticles: 1980, topDiscipline: "Health Sciences & Business" },
  { code: "RW", name: "Rwanda", region: "East", flag: "🇷🇼", defaultJournals: 16, defaultArticles: 350, topDiscipline: "Health Sciences & Tech" },
  { code: "ST", name: "Sao Tome and Principe", region: "Central", flag: "🇸🇹", defaultJournals: 2, defaultArticles: 30, topDiscipline: "Tropical Agroforestry" },
  { code: "SN", name: "Senegal", region: "West", flag: "🇸🇳", defaultJournals: 14, defaultArticles: 310, topDiscipline: "Humanities & Health" },
  { code: "SC", name: "Seychelles", region: "East", flag: "🇸🇨", defaultJournals: 2, defaultArticles: 45, topDiscipline: "Blue Economy & Conservation" },
  { code: "SL", name: "Sierra Leone", region: "West", flag: "🇸🇱", defaultJournals: 4, defaultArticles: 80, topDiscipline: "Public Health & Infectious Diseases" },
  { code: "SO", name: "Somalia", region: "East", flag: "🇸🇴", defaultJournals: 4, defaultArticles: 70, topDiscipline: "Veterinary Medicine & Pastoralism" },
  { code: "ZA", name: "South Africa", region: "Southern", flag: "🇿🇦", defaultJournals: 92, defaultArticles: 2450, topDiscipline: "Health & Physical Sciences" },
  { code: "SS", name: "South Sudan", region: "East", flag: "🇸🇸", defaultJournals: 3, defaultArticles: 50, topDiscipline: "Public Health & Water Governance" },
  { code: "SD", name: "Sudan", region: "North", flag: "🇸🇩", defaultJournals: 10, defaultArticles: 220, topDiscipline: "Medical Sciences" },
  { code: "TZ", name: "Tanzania", region: "East", flag: "🇹🇿", defaultJournals: 22, defaultArticles: 480, topDiscipline: "Environmental & Social" },
  { code: "TG", name: "Togo", region: "West", flag: "🇹🇬", defaultJournals: 5, defaultArticles: 90, topDiscipline: "Agronomy & Biotechnology" },
  { code: "TN", name: "Tunisia", region: "North", flag: "🇹🇳", defaultJournals: 11, defaultArticles: 230, topDiscipline: "Biomedical & Engineering" },
  { code: "UG", name: "Uganda", region: "East", flag: "🇺🇬", defaultJournals: 32, defaultArticles: 740, topDiscipline: "Health & Agriculture" },
  { code: "ZM", name: "Zambia", region: "Southern", flag: "🇿🇲", defaultJournals: 11, defaultArticles: 240, topDiscipline: "Social & Health Sciences" },
  { code: "ZW", name: "Zimbabwe", region: "Southern", flag: "🇿🇼", defaultJournals: 14, defaultArticles: 300, topDiscipline: "Agriculture & Health" },
  { code: "EH", name: "Western Sahara", region: "North", flag: "🇪🇭", defaultJournals: 1, defaultArticles: 20, topDiscipline: "Arid Studies & Marine" }
];

export const COUNTRY_META_MAP: Record<string, AfricanCountryMeta> = ALL_AFRICAN_COUNTRIES.reduce((acc, curr) => {
  acc[curr.name] = curr;
  acc[curr.name.toLowerCase()] = curr;
  return acc;
}, {} as Record<string, AfricanCountryMeta>);

export const ALL_COUNTRY_NAMES: string[] = ALL_AFRICAN_COUNTRIES.map(c => c.name).sort();
