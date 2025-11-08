import React, { useState, useCallback } from 'react';
import { fetchBusinesses } from './services/geminiService';
import { BusinessData } from './types';
import { SearchIcon, DownloadIcon, LoadingSpinner } from './components/IconComponents';

const App: React.FC = () => {
  const [country, setCountry] = useState<string>('Brasil');
  const [state, setState] = useState<string>('São Paulo');
  const [city, setCity] = useState<string>('São Paulo');
  const [sector, setSector] = useState<string>('restaurante');
  
  const [results, setResults] = useState<BusinessData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!country || !state || !city || !sector) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const data = await fetchBusinesses(country, state, city, sector);
      setResults(data);
      if (data.length === 0) {
        setError('Nenhuma empresa encontrada com os critérios fornecidos.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  }, [country, state, city, sector]);
  
  const handleExport = useCallback(() => {
    if (results.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    const headers = ['Nome da Empresa', 'WhatsApp', 'Status do Site', 'Cidade', 'Setor', 'País'];
    const csvRows = [headers.join(',')];

    results.forEach(item => {
      const values = [
        `"${item.nome.replace(/"/g, '""')}"`,
        `"${(item.whatsapp || '').replace(/"/g, '""')}"`,
        `"${(item.websiteStatus || '').replace(/"/g, '""')}"`,
        `"${city.replace(/"/g, '""')}"`,
        `"${sector.replace(/"/g, '""')}"`,
        `"${country.replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `extratorzap_${city}_${sector}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [results, city, sector, country]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-blue-600">ExtratorZap Maps</h1>
          <p className="text-lg text-gray-600 mt-2">Encontre e extraia contatos de empresas diretamente do Google Maps.</p>
        </header>

        <main className="bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">País</label>
              <input type="text" id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Ex: Brasil"/>
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input type="text" id="state" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Ex: São Paulo"/>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input type="text" id="city" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Ex: Rio de Janeiro"/>
            </div>
            <div>
              <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">Setor</label>
              <input type="text" id="sector" value={sector} onChange={(e) => setSector(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition" placeholder="Ex: academia, pet shop"/>
            </div>
            <div className="md:col-span-4">
              <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:bg-blue-300 disabled:cursor-not-allowed">
                {isLoading ? <><LoadingSpinner className="w-5 h-5"/> Buscando...</> : <><SearchIcon/> Buscar Empresas</>}
              </button>
            </div>
          </form>

          <div className="mt-8">
            {isLoading && (
              <div className="text-center py-10">
                <div className="flex justify-center items-center gap-3">
                  <LoadingSpinner className="text-blue-600 w-8 h-8"/>
                  <p className="text-gray-600 text-lg">Buscando empresas, aguarde...</p>
                </div>
              </div>
            )}
            
            {error && !isLoading && (
              <div className="text-center py-10 bg-red-50 text-red-700 rounded-lg">
                <p>{error}</p>
              </div>
            )}

            {results.length > 0 && !isLoading && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold text-gray-800">Resultados Encontrados: {results.length}</h2>
                  <button onClick={handleExport} className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition">
                    <DownloadIcon/> Exportar para CSV
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-gray-200 max-h-[60vh]">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Empresa</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status do Site</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nome}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.whatsapp || 'N/A'}</td>
                           <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.websiteStatus === 'Não Tem Site' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {item.websiteStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
