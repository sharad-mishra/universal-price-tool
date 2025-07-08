const { useState, useEffect, useMemo } = React;

// This data is based on your `src/utils/constants.js`. 
// In a setup without a build step, it's practical to have it here.
const CURRENCY_MAP = {
  'US': 'USD', 'IN': 'INR', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 
  'JP': 'JPY', 'CN': 'CNY', 'BR': 'BRL', 'RU': 'RUB', 'AU': 'AUD', 
  'CA': 'CAD', 'MX': 'MXN', 'KR': 'KRW', 'IT': 'EUR', 'ES': 'EUR'
};

// Generate a sorted list of countries for the dropdown
const COUNTRIES = Object.keys(CURRENCY_MAP).map(code => {
  try {
    return {
      code,
      name: new Intl.DisplayNames(['en'], { type: 'region' }).of(code)
    };
  } catch (e) {
    return { code, name: code }; // Fallback for invalid codes
  }
}).sort((a, b) => a.name.localeCompare(b.name));

function App() {
  // --- STATE MANAGEMENT ---
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

  // --- DERIVED STATE ---
  const currencySymbol = useMemo(() => {
    try {
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: CURRENCY_MAP[country] || 'USD'
        });
        return formatter.format(0).replace(/[0-9.,\s]/g, '');
    } catch (e) {
        return '$'; // Default symbol
    }
  }, [country]);

  // --- EFFECTS ---
  // Persist search history to localStorage
  useEffect(() => {
    localStorage.setItem('priceSearchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

  // --- EVENT HANDLERS ---
  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    // Reset states
    setError('');
    setResults([]);
    
    // Basic validation
    if (!query.trim() || query.length < 2) {
      setError('Please enter a valid product name (at least 2 characters).');
      return;
    }
    
    // Add to search history
    const newSearch = { country, query, timestamp: Date.now() };
    setSearchHistory(prev => [newSearch, ...prev.filter(item => item.query !== query || item.country !== country).slice(0, 9)]);
    
    setLoading(true);
    try {
      // Fetch data from the backend API
      const response = await fetch(
        `/api/prices?country=${country}&query=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
      
      const data = await response.json();

      if (!Array.isArray(data)) {
         throw new Error("Received an invalid response from the server.");
      }

      setResults(data.slice(0, 20)); // Limit to 20 results
      
      if (data.length === 0) {
        setError('No results found. Try a different search term or country.');
      }
    } catch (err) {
      setError(err.message || 'An unknown error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle clicking on a recent search item
  const handleHistorySearch = (item) => {
    setCountry(item.country);
    setQuery(item.query);
    // Use a timeout to ensure state updates before triggering search
    setTimeout(() => document.getElementById('search-button').click(), 100);
  };
  
  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 mb-2 tracking-tight">
            <i className="fas fa-search-dollar mr-3 text-indigo-500"></i>
            Universal Price Finder
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Find the best deals on any product, anywhere in the world.
          </p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* --- Main Content: Search and Results --- */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <form onSubmit={handleSearch}>
                <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                    <div className="flex-grow w-full">
                        <label htmlFor="product-name" className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <div className="relative">
                            <i className="fas fa-box absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input id="product-name" className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" type="text" placeholder="e.g., iPhone 15 Pro, 256GB" value={query} onChange={e => setQuery(e.target.value)} disabled={loading} />
                        </div>
                    </div>
                    <div className="w-full md:w-56">
                        <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <div className="relative">
                            <i className="fas fa-globe-americas absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <select id="country-select" className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none transition" value={country} onChange={e => setCountry(e.target.value)} disabled={loading}>
                                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                        </div>
                    </div>
                    <div className="w-full md:w-auto">
                        <button id="search-button" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg w-full flex items-center justify-center font-semibold" type="submit" disabled={loading}>
                            {loading ? <><i className="fas fa-spinner fa-spin mr-2"></i><span>Searching...</span></> : <><i className="fas fa-search mr-2"></i><span>Search</span></>}
                        </button>
                    </div>
                </div>
              </form>
              
              {/* --- Status Display Area --- */}
              <div className="min-h-[400px] flex flex-col justify-center items-center">
                {loading && <div className="loader"></div>}
                
                {error && !loading && (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3 max-w-md text-center">
                    <i className="fas fa-exclamation-circle text-xl"></i>
                    <span>{error}</span>
                  </div>
                )}

                {!loading && !error && results.length === 0 && (
                    <div className="text-center text-gray-500">
                        <i className="fas fa-receipt text-5xl mb-4"></i>
                        <h3 className="text-xl font-semibold">Ready to find deals?</h3>
                        <p>Enter a product and country to begin.</p>
                    </div>
                )}
                
                {results.length > 0 && !loading && (
                  <div className="w-full overflow-hidden rounded-lg border border-gray-200 fade-in">
                      <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                          <h2 className="font-semibold text-gray-800"><i className="fas fa-list mr-2 text-indigo-500"></i>Found {results.length} result{results.length !== 1 ? 's' : ''}</h2>
                          <div className="text-sm text-gray-500">Sorted by Price (Low to High)</div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                              <tbody className="bg-white divide-y divide-gray-200">
                                  {results.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                          <td className="px-4 py-4 w-2/5">
                                              <div className="font-semibold text-gray-900">{item.productName}</div>
                                              <div className="text-sm text-gray-500 mt-1">Relevance: <span className="font-bold text-indigo-600">{(item.relevanceScore * 100).toFixed(0)}%</span></div>
                                          </td>
                                          <td className="px-4 py-4 text-right">
                                              <div className="font-bold text-xl text-indigo-700"><span className="price-tag" data-currency={currencySymbol}>{item.price}</span></div>
                                              <div className="text-xs text-gray-500 mt-1">{item.currency}</div>
                                          </td>
                                          <td className="px-4 py-4">
                                              <div className="flex items-center gap-3">
                                                  <div className="bg-gray-100 border rounded-full w-10 h-10 flex items-center justify-center text-gray-500 text-lg"><i className="fas fa-store"></i></div>
                                                  <div>
                                                      <div className="font-medium">{item.source}</div>
                                                      <div className="text-sm text-gray-500">{COUNTRIES.find(c => c.code === (item.country || country))?.name}</div>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="px-4 py-4 text-right">
                                              <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
                                                  Visit Store <i className="fas fa-external-link-alt ml-2 text-xs"></i>
                                              </a>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* --- Sidebar: History and Tips --- */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center"><i className="fas fa-history mr-3 text-indigo-600"></i>Recent Searches</h3>
              {searchHistory.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Your recent searches will appear here.</p>
              ) : (
                <ul className="space-y-3">
                  {searchHistory.map((item, idx) => (
                    <li key={idx}>
                      <button onClick={() => handleHistorySearch(item)} className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-300 transition-colors group">
                        <div className="font-medium text-gray-800 group-hover:text-indigo-700 truncate">{item.query}</div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{COUNTRIES.find(c => c.code === item.country)?.name || item.country}</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-xl text-gray-800 mb-4 flex items-center"><i className="fas fa-lightbulb mr-3 text-yellow-500"></i>Search Tips</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-3"><i className="fas fa-check-circle text-green-500 mt-1"></i><span>Be specific! Include model numbers or storage sizes for better results.</span></li>
                <li className="flex items-start gap-3"><i className="fas fa-check-circle text-green-500 mt-1"></i><span>Prices are updated frequently but may vary slightly on the seller's site.</span></li>
                <li className="flex items-start gap-3"><i className="fas fa-check-circle text-green-500 mt-1"></i><span>Results are powered by Google Shopping and processed by Gemini AI.</span></li>
              </ul>
            </div>
          </div>
        </main>
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Universal Price Finder &copy; {new Date().getFullYear()} &bull; Powered by SerpAPI and Google Gemini</p>
        </footer>
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));