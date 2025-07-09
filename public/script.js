const { useState, useEffect, useMemo, useRef } = React;

const SUPPORTED_COUNTRIES = [
  'US', 'CA', 'UK', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT',
  'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK',
  'LT', 'LV', 'EE', 'IE', 'PT', 'GR', 'CY', 'MT', 'LU', 'IS', 'LI', 'MC',
  'SM', 'AD', 'VA', 'BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'UY',
  'PY', 'BO', 'GY', 'SR', 'FK', 'GF', 'JP', 'CN', 'IN', 'KR', 'TW', 'HK',
  'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'MM', 'KH', 'LA', 'BN', 'MO', 'AU',
  'NZ', 'FJ', 'PG', 'NC', 'VU', 'SB', 'TO', 'WS', 'KI', 'TV', 'NR', 'PW',
  'MH', 'FM', 'ZA', 'NG', 'EG', 'KE', 'GH', 'UG', 'TZ', 'ZM', 'ZW', 'MW',
  'MZ', 'MG', 'MU', 'SC', 'RE', 'YT', 'KM', 'DJ', 'SO', 'ET', 'ER', 'SD',
  'SS', 'TD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'ST', 'BF', 'ML',
  'NE', 'CI', 'GN', 'SN', 'GM', 'GW', 'CV', 'SL', 'LR', 'MA', 'DZ', 'TN',
  'LY', 'EH', 'MR', 'IL', 'PS', 'JO', 'LB', 'SY', 'IQ', 'SA', 'YE', 'OM',
  'AE', 'QA', 'BH', 'KW', 'IR', 'AF', 'PK', 'BD', 'LK', 'MV', 'BT', 'NP',
  'MN', 'KZ', 'KG', 'TJ', 'TM', 'UZ', 'RU', 'BY', 'UA', 'MD', 'GE', 'AM',
  'AZ', 'TR', 'CY', 'AL', 'ME', 'RS', 'BA', 'MK', 'XK'
];

const COUNTRY_MAPPINGS = {
  'US': { location: 'United States', currency: 'USD', language: 'en' },
  'CA': { location: 'Canada', currency: 'CAD', language: 'en' },
  'UK': { location: 'United Kingdom', currency: 'GBP', language: 'en' },
  'GB': { location: 'United Kingdom', currency: 'GBP', language: 'en' },
  'DE': { location: 'Germany', currency: 'EUR', language: 'de' },
  'FR': { location: 'France', currency: 'EUR', language: 'fr' },
  'IT': { location: 'Italy', currency: 'EUR', language: 'it' },
  'ES': { location: 'Spain', currency: 'EUR', language: 'es' },
  'NL': { location: 'Netherlands', currency: 'EUR', language: 'nl' },
  'BE': { location: 'Belgium', currency: 'EUR', language: 'nl' },
  'CH': { location: 'Switzerland', currency: 'CHF', language: 'de' },
  'AT': { location: 'Austria', currency: 'EUR', language: 'de' },
  'SE': { location: 'Sweden', currency: 'SEK', language: 'sv' },
  'NO': { location: 'Norway', currency: 'NOK', language: 'no' },
  'DK': { location: 'Denmark', currency: 'DKK', language: 'da' },
  'FI': { location: 'Finland', currency: 'EUR', language: 'fi' },
  'PL': { location: 'Poland', currency: 'PLN', language: 'pl' },
  'CZ': { location: 'Czech Republic', currency: 'CZK', language: 'cs' },
  'HU': { location: 'Hungary', currency: 'HUF', language: 'hu' },
  'RO': { location: 'Romania', currency: 'RON', language: 'ro' },
  'BG': { location: 'Bulgaria', currency: 'BGN', language: 'bg' },
  'HR': { location: 'Croatia', currency: 'EUR', language: 'hr' },
  'SI': { location: 'Slovenia', currency: 'EUR', language: 'sl' },
  'SK': { location: 'Slovakia', currency: 'EUR', language: 'sk' },
  'LT': { location: 'Lithuania', currency: 'EUR', language: 'lt' },
  'LV': { location: 'Latvia', currency: 'EUR', language: 'lv' },
  'EE': { location: 'Estonia', currency: 'EUR', language: 'et' },
  'IE': { location: 'Ireland', currency: 'EUR', language: 'en' },
  'PT': { location: 'Portugal', currency: 'EUR', language: 'pt' },
  'GR': { location: 'Greece', currency: 'EUR', language: 'el' },
  'JP': { location: 'Japan', currency: 'JPY', language: 'ja' },
  'CN': { location: 'China', currency: 'CNY', language: 'zh' },
  'IN': { location: 'India', currency: 'INR', language: 'en' },
  'KR': { location: 'South Korea', currency: 'KRW', language: 'ko' },
  'TW': { location: 'Taiwan', currency: 'TWD', language: 'zh' },
  'HK': { location: 'Hong Kong', currency: 'HKD', language: 'en' },
  'SG': { location: 'Singapore', currency: 'SGD', language: 'en' },
  'MY': { location: 'Malaysia', currency: 'MYR', language: 'en' },
  'TH': { location: 'Thailand', currency: 'THB', language: 'th' },
  'VN': { location: 'Vietnam', currency: 'VND', language: 'vi' },
  'PH': { location: 'Philippines', currency: 'PHP', language: 'en' },
  'ID': { location: 'Indonesia', currency: 'IDR', language: 'id' },
  'AU': { location: 'Australia', currency: 'AUD', language: 'en' },
  'NZ': { location: 'New Zealand', currency: 'NZD', language: 'en' },
  'BR': { location: 'Brazil', currency: 'BRL', language: 'pt' },
  'MX': { location: 'Mexico', currency: 'MXN', language: 'es' },
  'AR': { location: 'Argentina', currency: 'ARS', language: 'es' },
  'CL': { location: 'Chile', currency: 'CLP', language: 'es' },
  'CO': { location: 'Colombia', currency: 'COP', language: 'es' },
  'PE': { location: 'Peru', currency: 'PEN', language: 'es' },
  'VE': { location: 'Venezuela', currency: 'VES', language: 'es' },
  'EC': { location: 'Ecuador', currency: 'USD', language: 'es' },
  'UY': { location: 'Uruguay', currency: 'UYU', language: 'es' },
  'PY': { location: 'Paraguay', currency: 'PYG', language: 'es' },
  'BO': { location: 'Bolivia', currency: 'BOB', language: 'es' },
  'ZA': { location: 'South Africa', currency: 'ZAR', language: 'en' },
  'NG': { location: 'Nigeria', currency: 'NGN', language: 'en' },
  'EG': { location: 'Egypt', currency: 'EGP', language: 'ar' },
  'KE': { location: 'Kenya', currency: 'KES', language: 'en' },
  'GH': { location: 'Ghana', currency: 'GHS', language: 'en' },
  'UG': { location: 'Uganda', currency: 'UGX', language: 'en' },
  'TZ': { location: 'Tanzania', currency: 'TZS', language: 'en' },
  'ZM': { location: 'Zambia', currency: 'ZMW', language: 'en' },
  'ZW': { location: 'Zimbabwe', currency: 'ZWL', language: 'en' },
  'MW': { location: 'Malawi', currency: 'MWK', language: 'en' },
  'MZ': { location: 'Mozambique', currency: 'MZN', language: 'pt' },
  'MG': { location: 'Madagascar', currency: 'MGA', language: 'fr' },
  'MU': { location: 'Mauritius', currency: 'MUR', language: 'en' },
  'SC': { location: 'Seychelles', currency: 'SCR', language: 'en' },
  'RU': { location: 'Russia', currency: 'RUB', language: 'ru' },
  'BY': { location: 'Belarus', currency: 'BYN', language: 'be' },
  'UA': { location: 'Ukraine', currency: 'UAH', language: 'uk' },
  'MD': { location: 'Moldova', currency: 'MDL', language: 'ro' },
  'GE': { location: 'Georgia', currency: 'GEL', language: 'ka' },
  'AM': { location: 'Armenia', currency: 'AMD', language: 'hy' },
  'AZ': { location: 'Azerbaijan', currency: 'AZN', language: 'az' },
  'TR': { location: 'Turkey', currency: 'TRY', language: 'tr' },
  'IL': { location: 'Israel', currency: 'ILS', language: 'he' },
  'JO': { location: 'Jordan', currency: 'JOD', language: 'ar' },
  'LB': { location: 'Lebanon', currency: 'LBP', language: 'ar' },
  'SA': { location: 'Saudi Arabia', currency: 'SAR', language: 'ar' },
  'AE': { location: 'United Arab Emirates', currency: 'AED', language: 'ar' },
  'QA': { location: 'Qatar', currency: 'QAR', language: 'ar' },
  'BH': { location: 'Bahrain', currency: 'BHD', language: 'ar' },
  'KW': { location: 'Kuwait', currency: 'KWD', language: 'ar' },
  'OM': { location: 'Oman', currency: 'OMR', language: 'ar' },
  'PK': { location: 'Pakistan', currency: 'PKR', language: 'ur' },
  'BD': { location: 'Bangladesh', currency: 'BDT', language: 'bn' },
  'LK': { location: 'Sri Lanka', currency: 'LKR', language: 'si' },
  'NP': { location: 'Nepal', currency: 'NPR', language: 'ne' },
  'BT': { location: 'Bhutan', currency: 'BTN', language: 'dz' },
  'MV': { location: 'Maldives', currency: 'MVR', language: 'dv' },
  'AF': { location: 'Afghanistan', currency: 'AFN', language: 'fa' },
  'IR': { location: 'Iran', currency: 'IRR', language: 'fa' },
  'IQ': { location: 'Iraq', currency: 'IQD', language: 'ar' },
  'SY': { location: 'Syria', currency: 'SYP', language: 'ar' },
  'YE': { location: 'Yemen', currency: 'YER', language: 'ar' }
};

const CURRENCY_SYMBOLS = {
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'CNY': '¥',
  'INR': '₹',
  'KRW': '₩',
  'CAD': 'C$',
  'AUD': 'A$',
  'CHF': 'Fr',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'PLN': 'zł',
  'CZK': 'Kč',
  'HUF': 'Ft',
  'RUB': '₽',
  'BRL': 'R$',
  'MXN': '$',
  'ZAR': 'R',
  'SGD': 'S$',
  'HKD': 'HK$',
  'NZD': 'NZ$',
  'TWD': 'NT$',
  'THB': '฿',
  'MYR': 'RM',
  'IDR': 'Rp',
  'PHP': '₱',
  'VND': '₫',
  'TRY': '₺',
  'ILS': '₪',
  'SAR': '﷼',
  'AED': 'د.إ',
  'PKR': '₨',
  'BDT': '৳',
  'LKR': '₨',
  'NPR': '₨',
  'RON': 'lei',
  'BGN': 'лв',
  'CLP': '$',
  'COP': '$',
  'PEN': 'S/',
  'VES': 'Bs',
  'UYU': '$U',
  'PYG': '₲',
  'BOB': 'Bs.',
  'NGN': '₦',
  'EGP': 'E£',
  'KES': 'KSh',
  'GHS': 'GH₵',
  'UGX': 'USh',
  'TZS': 'TSh',
  'ZMW': 'ZK',
  'ZWL': '$',
  'MWK': 'MK',
  'MZN': 'MT',
  'MGA': 'Ar',
  'MUR': '₨',
  'SCR': '₨',
  'BYN': 'Br',
  'UAH': '₴',
  'MDL': 'L',
  'GEL': '₾',
  'AMD': '֏',
  'AZN': '₼',
  'JOD': 'JD',
  'LBP': 'L£',
  'KWD': 'KD',
  'OMR': 'RO',
  'QAR': 'QR',
  'BHD': 'BD'
};

const ALL_COUNTRIES_DATA = SUPPORTED_COUNTRIES.map(code => {
  const countryInfo = COUNTRY_MAPPINGS[code];
  const displayName = countryInfo ? countryInfo.location : code;
  return {
    code,
    name: displayName
  };
}).sort((a, b) => a.name.localeCompare(b.name));

function App() {
  const [country, setCountry] = useState('US');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('priceSearchHistory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const countrySearchInputRef = useRef(null);

  const currencySymbol = useMemo(() => {
    const currencyCode = COUNTRY_MAPPINGS[country] ? COUNTRY_MAPPINGS[country].currency : 'USD';
    return CURRENCY_SYMBOLS[currencyCode] || '$';
  }, [country]);

  const filteredCountries = useMemo(() => {
    if (!countrySearchTerm) {
      return ALL_COUNTRIES_DATA;
    }
    const lowerCaseSearchTerm = countrySearchTerm.toLowerCase();
    return ALL_COUNTRIES_DATA.filter(c =>
      c.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      c.code.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [countrySearchTerm]);

  useEffect(() => {
    localStorage.setItem('priceSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
        setCountrySearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  useEffect(() => {
    if (showCountryDropdown && countrySearchInputRef.current) {
      countrySearchInputRef.current.focus();
    }
  }, [showCountryDropdown]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    setError('');
    setResults([]);
    
    if (!query.trim() || query.length < 2) {
      setError('Please enter a valid product name (at least 2 characters).');
      return;
    }
    
    const newSearch = { country, query, timestamp: Date.now() };
    setSearchHistory(prev => [newSearch, ...prev.filter(item => item.query !== query || item.country !== country).slice(0, 9)]);
    
    setLoading(true);
    try {
      const response = await fetch(
        `/api/prices?country=${country}&query=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Received an invalid response from the server.');
      }

      setResults(data.results.slice(0, 20));
      
      if (data.results.length === 0) {
        setError('No results found. Try a different search term or country.');
      }
    } catch (err) {
      setError(err.message || 'An unknown error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySearch = (item) => {
    setCountry(item.country);
    setQuery(item.query);
    setTimeout(() => document.getElementById('search-button').click(), 100);
  };

  const handleCountrySelect = (selectedCode) => {
    setCountry(selectedCode);
    setShowCountryDropdown(false);
    setCountrySearchTerm('');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12 animate-fade-in-down">
          <h1 className="text-5xl md:text-6xl font-extrabold text-indigo-800 mb-4 tracking-tight drop-shadow-lg">
            <i className="fas fa-search-dollar mr-4 text-indigo-600"></i>
            Universal Price Finder
          </h1>
          <p className="text-gray-700 max-w-3xl mx-auto text-xl leading-relaxed">
            Discover the **best prices** for any product, from any store, in **any country**. Your smart shopping starts here.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 transform transition-all duration-300 hover:scale-[1.005]">
              <form onSubmit={handleSearch}>
                <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">
                    <div className="flex-grow w-full">
                        <label htmlFor="product-name" className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                        <div className="relative">
                            <i className="fas fa-box absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg"></i>
                            <input 
                                id="product-name" 
                                className="w-full rounded-xl border border-gray-300 pl-12 pr-4 py-3.5 text-lg focus:outline-none focus:ring-3 focus:ring-indigo-400 focus:border-indigo-500 transition-all duration-200 shadow-sm" 
                                type="text" 
                                placeholder="e.g., iPhone 15 Pro, 256GB" 
                                value={query} 
                                onChange={e => setQuery(e.target.value)} 
                                disabled={loading} 
                            />
                        </div>
                    </div>
                    <div className="w-full md:w-60 relative" ref={dropdownRef}>
                        <label htmlFor="country-select" className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                        <div 
                          className="relative flex items-center w-full rounded-xl border border-gray-300 pr-4 py-3.5 bg-white cursor-pointer focus-within:ring-3 focus-within:ring-indigo-400 focus-within:border-indigo-500 transition-all duration-200 shadow-sm"
                          onClick={() => {
                            setShowCountryDropdown(prev => !prev);
                            if (!showCountryDropdown) {
                                setCountrySearchTerm('');
                                setTimeout(() => countrySearchInputRef.current?.focus(), 50);
                            }
                          }}
                        >
                            <i className="fas fa-globe-americas absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none"></i>
                            <input
                              id="country-search-input"
                              type="text"
                              className="w-full pl-12 pr-10 bg-transparent outline-none text-lg cursor-pointer"
                              placeholder={showCountryDropdown ? "Search country..." : (COUNTRY_MAPPINGS[country] ? COUNTRY_MAPPINGS[country].location : country)}
                              value={showCountryDropdown ? countrySearchTerm : (COUNTRY_MAPPINGS[country] ? COUNTRY_MAPPINGS[country].location : country)}
                              onChange={(e) => setCountrySearchTerm(e.target.value)}
                              onFocus={() => setShowCountryDropdown(true)}
                              disabled={loading}
                              ref={countrySearchInputRef}
                            />
                            <i className={`fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`}></i>
                        </div>
                        
                        {showCountryDropdown && (
                          <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-2 max-h-72 overflow-y-auto animate-fade-in-up">
                            <ul>
                              {filteredCountries.length > 0 ? (
                                filteredCountries.map(c => {
                                  const searchTerm = countrySearchTerm.toLowerCase();
                                  const nameLower = c.name.toLowerCase();
                                  const matchIndex = nameLower.indexOf(searchTerm);

                                  let nameHighlighted;
                                  if (matchIndex !== -1 && searchTerm) {
                                    const before = c.name.slice(0, matchIndex);
                                    const match = c.name.slice(matchIndex, matchIndex + searchTerm.length);
                                    const after = c.name.slice(matchIndex + searchTerm.length);
                                    nameHighlighted = (
                                      <>
                                        {before}
                                        <span className="font-bold text-indigo-700">{match}</span>
                                        {after}
                                      </>
                                    );
                                  } else {
                                    nameHighlighted = c.name;
                                  }

                                  return (
                                    <li
                                      key={c.code}
                                      className="px-5 py-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center text-lg transition-colors duration-150"
                                      onClick={() => handleCountrySelect(c.code)}
                                    >
                                      <span>{nameHighlighted} ({c.code})</span>
                                      {country === c.code && <i className="fas fa-check text-green-600"></i>}
                                    </li>
                                  );
                                })
                              ) : (
                                <li className="px-5 py-3 text-gray-500 text-lg">No countries found.</li>
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                    <div className="w-full md:w-auto">
                        <button id="search-button" className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-8 py-3.5 rounded-xl hover:from-indigo-700 hover:to-indigo-800 disabled:from-indigo-300 disabled:to-indigo-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl w-full flex items-center justify-center font-bold text-lg transform hover:-translate-y-0.5" type="submit" disabled={loading}>
                            {loading ? <><i className="fas fa-spinner fa-spin mr-3 text-xl"></i><span>Searching...</span></> : <><i className="fas fa-search mr-3 text-xl"></i><span>Search</span></>}
                        </button>
                    </div>
                </div>
              </form>

              <div className="min-h-[400px] flex flex-col justify-center items-center p-4">
                {loading && <div className="loader-lg"></div>}
                {error && !loading && (
                  <div className="p-6 bg-red-100 border border-red-300 text-red-800 rounded-xl w-full text-center shadow-md animate-fade-in">
                    <i className="fas fa-exclamation-circle mr-3 text-2xl"></i><span className="text-lg font-medium">{error}</span>
                  </div>
                )}
                {!loading && !error && results.length > 0 && (
                  <div className="w-full animate-fade-in">
                    <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b-2 border-indigo-200 pb-4 flex items-center">
                      <i className="fas fa-tags mr-4 text-green-600"></i>
                      Search Results ({results.length})
                    </h2>
                    <div className="space-y-5">
                      {results.map((result, index) => (
                        <a href={result.link} target="_blank" rel="noopener noreferrer" key={index} className="block bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group transform hover:-translate-y-1">
                          <div className="flex flex-col sm:flex-row items-center p-5">
                            {result.thumbnail && (
                              <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 mr-0 sm:mr-5 mb-4 sm:mb-0 rounded-lg overflow-hidden border border-gray-100 p-1 flex items-center justify-center">
                                <img src={result.thumbnail} alt={result.productName} className="w-full h-full object-contain" onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/96x96/e0e0e0/555555?text=No+Image`; }} />
                              </div>
                            )}
                            <div className="flex-grow text-center sm:text-left">
                              <h3 className="text-xl font-semibold text-indigo-700 group-hover:text-indigo-800 line-clamp-2 mb-1">{result.productName}</h3>
                              <p className="text-gray-600 text-base mb-2 line-clamp-1">{result.source}</p>
                              {result.rating && (
                                <div className="flex items-center justify-center sm:justify-start text-base text-gray-500 mb-1">
                                  <span className="text-yellow-500 mr-1 text-lg">
                                    {'★'.repeat(Math.floor(result.rating))}
                                    {'☆'.repeat(5 - Math.floor(result.rating))}
                                  </span>
                                  ({result.reviews || 'No'} reviews)
                                </div>
                              )}
                              {result.delivery && <p className="text-sm text-gray-500 mt-1">{result.delivery}</p>}
                            </div>
                            <div className="flex-shrink-0 text-right mt-4 sm:mt-0 sm:ml-6">
                              <p className="text-3xl font-bold text-green-700 price-tag" data-currency={currencySymbol}>{result.price}</p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {!loading && !error && results.length === 0 && query && (
                  <div className="p-6 bg-blue-100 border border-blue-300 text-blue-800 rounded-xl w-full text-center shadow-md animate-fade-in">
                    <i className="fas fa-info-circle mr-3 text-2xl"></i><span className="text-lg font-medium">No results found. Try a different search term or country.</span>
                  </div>
                )}
                 {!loading && !error && results.length === 0 && !query && (
                  <div className="p-6 bg-gray-100 border border-gray-300 text-gray-700 rounded-xl w-full text-center shadow-md animate-fade-in">
                    <i className="fas fa-info-circle mr-3 text-2xl"></i><span className="text-lg font-medium">Enter a product name and select a country to find prices.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-3xl shadow-2xl p-6 transform transition-all duration-300 hover:scale-[1.005]">
              <h3 className="font-bold text-2xl text-gray-800 mb-5 flex items-center"><i className="fas fa-history mr-4 text-indigo-600"></i>Recent Searches</h3>
              {searchHistory.length === 0 ? (
                <p className="text-gray-500 text-base">No recent searches yet. Start finding amazing deals!</p>
              ) : (
                <ul className="space-y-3">
                  {searchHistory.map((item, index) => (
                    <li key={index} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                      <button 
                        onClick={() => handleHistorySearch(item)} 
                        className="w-full text-left p-4 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-between text-gray-700 text-base shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-center">
                          <i className="fas fa-tag mr-3 text-indigo-500"></i>
                          <span className="font-medium truncate mr-2">{item.query}</span>
                          <span className="text-gray-500 text-sm">({item.country})</span>
                        </div>
                        <div className="text-gray-400 text-xs flex-shrink-0">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="bg-indigo-50/10 border border-indigo-200 rounded-3xl shadow-2xl p-6 transform transition-all duration-300 hover:scale-[1.005]">
              <h3 className="font-bold text-2xl text-gray-800 mb-5 flex items-center"><i className="fas fa-lightbulb mr-4 text-yellow-500"></i>Smart Search Tips</h3>
              <ul className="space-y-4 text-base text-gray-700">
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 mt-1 text-lg flex-shrink-0"></i>
                  <span>**Be specific!** Include model numbers, storage sizes, or colors for pinpoint accuracy.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 mt-1 text-lg flex-shrink-0"></i>
                  <span>Prices are updated frequently but may vary slightly on the seller's site due to real-time changes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="fas fa-check-circle text-green-500 mt-1 text-lg flex-shrink-0"></i>
                  <span>Results are powered by Google Shopping and intelligently processed by **Gemini AI** for relevance.</span>
                </li>
              </ul>
            </div>
          </div>
        </main>
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>Universal Price Finder © {new Date().getFullYear()} • Powered by SerpAPI and Google Gemini</p>
        </footer>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));