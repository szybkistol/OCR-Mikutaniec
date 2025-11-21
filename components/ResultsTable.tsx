
import React from 'react';
import { SchemaField, AggregatedResult } from '../types';
import { CheckCircle2, AlertTriangle, FileText, Key, Search, Link } from 'lucide-react';

interface ResultsTableProps {
  result: AggregatedResult | null;
  schema: SchemaField[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ result, schema }) => {
  if (!result) return null;

  if (result.status === 'error') {
      return (
          <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Błąd analizy</h3>
              <p className="text-slate-500 mt-2">{result.error}</p>
          </div>
      )
  }

  return (
    <div className="w-full">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                Nazwa Pola (Klucz)
              </div>
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-2/5">
               <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Wyodrębniona Wartość
              </div>
            </th>
            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
               <div className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Źródło
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {schema.map((field) => {
            const item = result.data[field.name];
            const value = item?.value;
            const source = item?.source;
            
            const hasValue = value !== null && value !== undefined && value !== '';
            
            return (
                <tr key={field.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap align-top">
                   <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{field.name}</span>
                        <span className="text-xs text-slate-400">{field.description || field.type}</span>
                   </div>
                </td>
                <td className="px-6 py-4 align-top">
                    {hasValue ? (
                         <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span className="text-sm text-slate-700 font-medium break-words">
                                {String(value)}
                            </span>
                        </div>
                    ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-400">
                            Nie znaleziono
                        </span>
                    )}
                </td>
                <td className="px-6 py-4 align-top">
                    {source ? (
                        <div className="flex items-center gap-1.5 text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded w-fit">
                            <Search className="w-3 h-3" />
                            <span className="truncate max-w-[200px]" title={source}>{source}</span>
                        </div>
                    ) : (
                         <span className="text-xs text-slate-400 italic">
                            -
                        </span>
                    )}
                </td>
                </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
