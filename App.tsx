import React, { useState, useEffect } from 'react';
import { FileDropzone } from './components/FileDropzone';
import { SchemaBuilder } from './components/SchemaBuilder';
import { ResultsTable } from './components/ResultsTable';
import { extractDataFromFiles } from './services/geminiService';
import { SchemaField, AggregatedResult, Account } from './types';
import { Sparkles, FileText, AlertCircle, ArrowLeft, Settings, Table as TableIcon, Layers, Send, User, Check, XCircle } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]); // Start empty
  const [result, setResult] = useState<AggregatedResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'config' | 'results'>('config');

  // CRM Integration State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [isSendingToCrm, setIsSendingToCrm] = useState(false);
  const [crmStatus, setCrmStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch accounts when entering results view
  useEffect(() => {
    if (view === 'results' && accounts.length === 0) {
      fetch('https://n8n.mikutaniec.pl/webhook/ocr-app/accounts')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAccounts(data);
          }
        })
        .catch((err) => console.error("Failed to fetch accounts", err));
    }
  }, [view, accounts.length]);

  const handleExtract = async () => {
    if (files.length === 0) {
      setError("Please upload at least one file.");
      return;
    }
    if (schemaFields.length === 0) {
      setError("Please define at least one field to extract.");
      return;
    }

    setIsExtracting(true);
    setError(null);
    setResult(null);
    setCrmStatus('idle'); // Reset CRM status on new extraction

    try {
      const extractionResult = await extractDataFromFiles(files, schemaFields);
      setResult(extractionResult);
      setView('results');
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to extract data. Please check your API key and try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSendToCrm = async () => {
    if (!selectedAccountId || !result) return;

    setIsSendingToCrm(true);
    setCrmStatus('idle');

    try {
      const response = await fetch('https://n8n.mikutaniec.pl/webhook/ocr-app/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: selectedAccountId,
          data: result.data
        }),
      });

      if (response.ok) {
        setCrmStatus('success');
      } else {
        setCrmStatus('error');
      }
    } catch (e) {
      console.error("Error sending to CRM", e);
      setCrmStatus('error');
    } finally {
      setIsSendingToCrm(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center relative">
          
          {/* View Indicator / Nav */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button 
              onClick={() => setView('config')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'config' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Konfiguracja</span>
            </button>
            <button 
              onClick={() => result && setView('results')}
              disabled={!result}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === 'results' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Wyniki</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'config' && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Konfiguracja Ekstrakcji</h2>
              <p className="text-slate-500 max-w-lg mx-auto">Wgraj pliki (dokumenty, audio, obrazy) i zdefiniuj dane, które chcesz uzyskać. AI połączy informacje ze wszystkich źródeł.</p>
            </div>

            {/* Step 1: Files */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-shadow hover:shadow-md">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">1</div>
                <h2 className="font-semibold text-slate-800 text-lg">Wgraj Pliki</h2>
              </div>
              <div className="p-6">
                <FileDropzone files={files} onFilesChanged={setFiles} />
              </div>
            </section>

            {/* Step 2: Schema */}
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-shadow hover:shadow-md">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">2</div>
                <h2 className="font-semibold text-slate-800 text-lg">Zdefiniuj Schemat Danych</h2>
              </div>
              <div className="p-6">
                <SchemaBuilder fields={schemaFields} onChange={setSchemaFields} />
              </div>
            </section>

            {/* Action Area */}
            <div className="space-y-4 pt-4 sticky bottom-4 z-10">
               {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 animate-pulse">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleExtract}
                disabled={isExtracting || files.length === 0}
                className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white shadow-xl transition-all transform active:scale-[0.98] ${
                  isExtracting 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200'
                }`}
              >
                {isExtracting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analizowanie i łączenie danych...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Uruchom Ekstrakcję</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {view === 'results' && (
          <div className="h-full space-y-6 animate-fade-in">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <button 
                 onClick={() => setView('config')}
                 className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors self-start"
               >
                 <ArrowLeft className="w-4 h-4" />
                 Wróć do konfiguracji
               </button>
               
               <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Powered by Gemini 2.5 Flash
               </div>
            </div>

            {/* CRM Integration Bar */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
               <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <User className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span>Przypisz do klienta:</span>
               </div>

               <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto flex-1 justify-end">
                  <div className="relative w-full sm:w-64">
                    <select
                      value={selectedAccountId}
                      onChange={(e) => setSelectedAccountId(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none shadow-sm transition-all cursor-pointer text-slate-700 text-sm"
                      disabled={accounts.length === 0}
                    >
                      <option value="">
                        {accounts.length === 0 ? "Ładowanie klientów..." : "-- Wybierz klienta --"}
                      </option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                     {/* Dropdown Arrow */}
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                     </div>
                  </div>

                  <button
                    onClick={handleSendToCrm}
                    disabled={!selectedAccountId || isSendingToCrm || crmStatus === 'success'}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white shadow-md transition-all ${
                      crmStatus === 'success'
                       ? 'bg-green-500 hover:bg-green-600 shadow-green-100'
                       : crmStatus === 'error'
                       ? 'bg-red-500 hover:bg-red-600 shadow-red-100'
                       : !selectedAccountId
                       ? 'bg-slate-300 cursor-not-allowed'
                       : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                    }`}
                  >
                    {isSendingToCrm ? (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : crmStatus === 'success' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Wysłano!</span>
                      </>
                    ) : crmStatus === 'error' ? (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Błąd</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Wyślij do CRM</span>
                      </>
                    )}
                  </button>
               </div>
            </section>

            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[50vh]">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-semibold text-slate-800 text-lg">Zagregowane Wyniki Analizy</h2>
                </div>
                <span className="text-xs font-medium px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  {files.length} {files.length === 1 ? 'plik' : 'plików'} źródłowych
                </span>
              </div>
              
              <div className="flex-1 p-0 bg-slate-50 relative overflow-hidden">
                 <div className="absolute inset-0 overflow-auto">
                   {result ? (
                     <ResultsTable result={result} schema={schemaFields} />
                   ) : (
                     <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                       <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                         <FileText className="w-8 h-8 text-slate-300" />
                       </div>
                       <p className="text-lg font-medium text-slate-600">Brak wyników</p>
                     </div>
                   )}
                 </div>
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;