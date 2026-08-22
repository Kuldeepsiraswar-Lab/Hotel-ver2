import React, { useState } from 'react';
import { X, Check, Layers, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { RestaurantTable, TableSection } from '../types';
import { DEFAULT_TABLE_SECTIONS } from '../data/defaultData';
import { generateId } from '../utils/formatters';

interface BatchAddTablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTables: RestaurantTable[];
  onBatchSave: (tables: RestaurantTable[]) => void;
}

export const BatchAddTablesModal: React.FC<BatchAddTablesModalProps> = ({
  isOpen,
  onClose,
  existingTables,
  onBatchSave,
}) => {
  const [prefix, setPrefix] = useState('Table ');
  const [startNumber, setStartNumber] = useState<number>(() => {
    return existingTables.length > 0 ? existingTables.length + 1 : 1;
  });
  const [count, setCount] = useState<number>(5);
  const [section, setSection] = useState<TableSection>('Main Dining');
  const [capacity, setCapacity] = useState<number>(4);
  const [shape, setShape] = useState<'square' | 'round' | 'rectangle'>('square');

  if (!isOpen) return null;

  // Generate preview of tables
  const generatedPreview: Array<{ name: string; isDuplicate: boolean }> = [];
  for (let i = 0; i < count; i++) {
    const num = startNumber + i;
    const name = `${prefix}${num}`.trim();
    const isDuplicate = existingTables.some(t => t.name.toLowerCase() === name.toLowerCase());
    generatedPreview.push({ name, isDuplicate });
  }

  const duplicatesCount = generatedPreview.filter(p => p.isDuplicate).length;

  const handleBatchCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newTables: RestaurantTable[] = [];

    let currentSort = existingTables.length + 1;
    for (let i = 0; i < count; i++) {
      const num = startNumber + i;
      const name = `${prefix}${num}`.trim();
      
      // If duplicate, append suffix or skip duplicate
      const exists = existingTables.some(t => t.name.toLowerCase() === name.toLowerCase());
      const finalName = exists ? `${name} (New)` : name;

      newTables.push({
        id: generateId('tbl'),
        name: finalName,
        section,
        capacity: Math.max(1, capacity),
        shape,
        isActive: true,
        sortOrder: currentSort++,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    onBatchSave(newTables);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Bulk Add Dining Tables</h2>
              <p className="text-xs text-slate-400">
                Generate multiple floor tables automatically in a specific section
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleBatchCreate} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Name Prefix
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. Table , Patio , Bar "
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Start Number
              </label>
              <input
                type="number"
                min={1}
                value={startNumber}
                onChange={(e) => setStartNumber(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                How Many Tables?
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={count}
                onChange={(e) => setCount(Math.min(50, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Section / Area
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {DEFAULT_TABLE_SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Capacity Per Table
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={capacity}
                  onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-16 px-2.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-xs text-slate-500 font-medium">seats</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Shape
              </label>
              <select
                value={shape}
                onChange={(e) => setShape(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                <option value="square">Square</option>
                <option value="round">Round</option>
                <option value="rectangle">Rectangle (Long)</option>
              </select>
            </div>
          </div>

          {/* Generated Preview Box */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <span>Preview of {count} Tables ({section})</span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-mono">
                {count * capacity} total seats added
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {generatedPreview.map((p, idx) => (
                <span
                  key={idx}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                    p.isDuplicate
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {p.name} {p.isDuplicate ? '(Will Rename)' : ''}
                </span>
              ))}
            </div>

            {duplicatesCount > 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {duplicatesCount} table name(s) already exist and will be automatically safely disambiguated.
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Create {count} Tables</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
