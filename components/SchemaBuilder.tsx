import React, { useState } from 'react';
import { Plus, Trash2, Type, Calendar, Hash, LayoutTemplate, RotateCcw } from 'lucide-react';
import { SchemaField, FieldType } from '../types';

interface SchemaBuilderProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
}

const TEMPLATES = [
  {
    id: 'test-template',
    label: 'Testowy szablon',
    fields: [
      { name: 'nr_umowy', type: 'number', description: 'Numer umowy' },
      { name: 'data_umowy', type: 'date', description: 'Data zawarcia umowy' }
    ]
  }
];

export const SchemaBuilder: React.FC<SchemaBuilderProps> = ({ fields, onChange }) => {
  // We use a controlled value for the select to allow resetting it after selection
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const addField = () => {
    const newField: SchemaField = {
      id: crypto.randomUUID(),
      name: '',
      type: 'text',
      description: ''
    };
    onChange([...fields, newField]);
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const clearAllFields = () => {
    if (fields.length > 0) {
        // Optional: could add window.confirm here if needed, but for this UI instant action is often preferred with an "Add" button nearby
        onChange([]);
    }
  };

  const updateField = (id: string, key: keyof SchemaField, value: string) => {
    onChange(
      fields.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
  };

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value;
    const template = TEMPLATES.find(t => t.id === templateId);
    
    if (template) {
      // Map template fields to new SchemaField objects with unique IDs
      const newFields: SchemaField[] = template.fields.map(tf => ({
        id: crypto.randomUUID(),
        name: tf.name,
        type: tf.type as FieldType,
        description: tf.description
      }));
      
      // Append new fields to existing ones (User requested "uzupełniał" - supplement/add to)
      onChange([...fields, ...newFields]);
      
      // Reset the select so the user can click it again if they want to add the same template twice
      setSelectedTemplate("");
    }
  };

  const getTypeIcon = (type: FieldType) => {
    switch (type) {
      case 'number': return <Hash className="w-3 h-3" />;
      case 'date': return <Calendar className="w-3 h-3" />;
      default: return <Type className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Selector */}
      <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
        <label className="block text-sm font-bold text-indigo-900 mb-2.5 flex items-center gap-2">
            <div className="bg-indigo-100 p-1 rounded-md">
               <LayoutTemplate className="w-4 h-4 text-indigo-600" />
            </div>
            Wybierz szablon (opcjonalnie)
        </label>
        <div className="relative">
            <select 
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className="w-full text-sm p-3 rounded-lg border border-indigo-200 bg-white text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm transition-all cursor-pointer appearance-none"
            >
                <option value="">-- Wybierz gotowy szablon, aby dodać pola --</option>
                {TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-400">
                <LayoutTemplate className="w-4 h-4" />
            </div>
        </div>
        <p className="text-xs text-indigo-400 mt-2 pl-1">
            Wybranie szablonu doda pola do Twojej listy. Możesz klikać wielokrotnie.
        </p>
      </div>

      <div className="h-px bg-slate-100 w-full"></div>

      {/* Fields Header & Clear Action */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Zdefiniowane pola ({fields.length})</h3>
        {fields.length > 0 && (
            <button 
                onClick={clearAllFields}
                className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
            >
                <Trash2 className="w-3 h-3" />
                Wyczyść wszystko
            </button>
        )}
      </div>

      {/* Fields List */}
      <div className="space-y-3">
        {fields.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-slate-400 text-sm">Brak zdefiniowanych pól. Dodaj pole ręcznie lub wybierz szablon.</p>
            </div>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all space-y-3 group animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Nazwa Pola (JSON Key)
                </label>
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(field.id, 'name', e.target.value)}
                  placeholder="np. nr_faktury"
                  className="w-full text-sm p-2.5 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm text-slate-800 placeholder:text-slate-300"
                />
              </div>
              <div className="w-full sm:w-1/3">
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Typ Danych
                </label>
                <div className="relative">
                  <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, 'type', e.target.value as FieldType)}
                    className="w-full text-sm p-2.5 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none shadow-sm cursor-pointer text-slate-800"
                  >
                    <option value="text">Tekst</option>
                    <option value="number">Numer</option>
                    <option value="date">Data</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    {getTypeIcon(field.type)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Opis (Opcjonalnie)
                </label>
                <input
                  type="text"
                  value={field.description}
                  onChange={(e) => updateField(field.id, 'description', e.target.value)}
                  placeholder="Opisz co wyciągnąć..."
                  className="w-full text-sm p-2.5 rounded-lg border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm text-slate-800 placeholder:text-slate-300"
                />
              </div>
               <button
                onClick={() => removeField(field.id)}
                className="p-2.5 mb-[1px] text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                title="Usuń pole"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={addField}
        className="w-full py-3.5 px-4 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 group bg-white"
      >
        <div className="bg-slate-100 group-hover:bg-indigo-200 text-slate-500 group-hover:text-indigo-600 rounded-full p-1 transition-colors">
            <Plus className="w-3 h-3" />
        </div>
        Dodaj pole ręcznie
      </button>
    </div>
  );
};