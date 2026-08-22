import React, { useState, useEffect } from 'react';
import { X, Check, Utensils, Users, Layers, FileText, Sparkles, LayoutGrid, Circle, Square, RectangleHorizontal } from 'lucide-react';
import { RestaurantTable, TableSection } from '../types';
import { DEFAULT_TABLE_SECTIONS } from '../data/defaultData';
import { generateId } from '../utils/formatters';

interface TableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableToEdit?: RestaurantTable | null;
  onSave: (table: RestaurantTable) => void;
  existingTables?: RestaurantTable[];
}

export const TableEditorModal: React.FC<TableEditorModalProps> = ({
  isOpen,
  onClose,
  tableToEdit,
  onSave,
  existingTables = [],
}) => {
  const isEditing = Boolean(tableToEdit);

  const [name, setName] = useState('');
  const [section, setSection] = useState<TableSection>('Main Dining');
  const [customSection, setCustomSection] = useState('');
  const [isCustomSection, setIsCustomSection] = useState(false);
  const [capacity, setCapacity] = useState<number>(4);
  const [shape, setShape] = useState<'square' | 'rectangle' | 'round'>('square');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract all existing unique sections
  const allSections = Array.from(
    new Set([
      ...DEFAULT_TABLE_SECTIONS,
      ...existingTables.map(t => t.section).filter(Boolean)
    ])
  );

  useEffect(() => {
    if (tableToEdit) {
      setName(tableToEdit.name || '');
      if (DEFAULT_TABLE_SECTIONS.includes(tableToEdit.section as any)) {
        setSection(tableToEdit.section);
        setIsCustomSection(false);
        setCustomSection('');
      } else {
        setSection('custom');
        setIsCustomSection(true);
        setCustomSection(tableToEdit.section);
      }
      setCapacity(tableToEdit.capacity || 4);
      setShape(tableToEdit.shape || 'square');
      setNotes(tableToEdit.notes || '');
      setIsActive(tableToEdit.isActive !== false);
    } else {
      // Suggest next table number
      const nextNum = existingTables.length + 1;
      setName(`Table ${nextNum}`);
      setSection('Main Dining');
      setIsCustomSection(false);
      setCustomSection('');
      setCapacity(4);
      setShape('square');
      setNotes('');
      setIsActive(true);
    }
    setError(null);
  }, [tableToEdit, isOpen, existingTables.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError('Table name or identifier is required');
      return;
    }

    const finalSection = isCustomSection ? (customSection.trim() || 'Main Dining') : section;

    // Check for duplicate name if creating or changing name
    const duplicate = existingTables.find(
      t => t.name.toLowerCase() === cleanName.toLowerCase() && t.id !== tableToEdit?.id
    );
    if (duplicate) {
      setError(`A table named "${cleanName}" already exists in ${duplicate.section}`);
      return;
    }

    const tableData: RestaurantTable = {
      id: tableToEdit?.id || generateId('tbl'),
      name: cleanName,
      section: finalSection,
      capacity: Math.max(1, capacity),
      shape,
      notes: notes.trim(),
      isActive,
      sortOrder: tableToEdit?.sortOrder ?? (existingTables.length + 1),
      updatedAt: new Date().toISOString(),
      createdAt: tableToEdit?.createdAt || new Date().toISOString(),
    };

    onSave(tableData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl shadow-md">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {isEditing ? `Edit ${tableToEdit?.name}` : 'Add New Dining Table'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update seating capacity, section and floor details' : 'Register a new table for POS billing & QR self-ordering'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              {error}
            </div>
          )}

          {/* Table Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Table Name / Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Table 1, T-05, Bar Counter 1, Patio Booth 3"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          {/* Section Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Floor Section / Area <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomSection(!isCustomSection);
                  if (!isCustomSection) setCustomSection('');
                }}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {isCustomSection ? '← Pick from list' : '+ Custom Section'}
              </button>
            </div>

            {isCustomSection ? (
              <input
                type="text"
                placeholder="Enter custom area (e.g. Garden Terrace, Wine Cellar, Mezzanine)..."
                value={customSection}
                onChange={(e) => setCustomSection(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            ) : (
              <select
                value={section}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomSection(true);
                    setCustomSection('');
                  } else {
                    setSection(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-amber-400 focus:outline-none cursor-pointer"
              >
                {allSections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
                <option value="custom">+ New Custom Section...</option>
              </select>
            )}
          </div>

          {/* Seating Capacity & Table Shape */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Seating Capacity
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={capacity}
                  onChange={(e) => setCapacity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {[2, 4, 6, 8, 12].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCapacity(num)}
                      className={`px-2 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        capacity === num
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {num}p
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Table Shape
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setShape('square')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    shape === 'square'
                      ? 'bg-slate-900 dark:bg-amber-400 text-amber-400 dark:text-slate-950 border-slate-900 dark:border-amber-400 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span className="text-[10px]">Square</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShape('round')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    shape === 'round'
                      ? 'bg-slate-900 dark:bg-amber-400 text-amber-400 dark:text-slate-950 border-slate-900 dark:border-amber-400 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Circle className="w-4 h-4" />
                  <span className="text-[10px]">Round</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShape('rectangle')}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    shape === 'rectangle'
                      ? 'bg-slate-900 dark:bg-amber-400 text-amber-400 dark:text-slate-950 border-slate-900 dark:border-amber-400 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <RectangleHorizontal className="w-4 h-4" />
                  <span className="text-[10px]">Long</span>
                </button>
              </div>
            </div>
          </div>

          {/* Location Notes & Features */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Table Location Notes / Features (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Window side, Near ambient fountain, High top bar stool, VIP corner booth"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          {/* Active Status Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">Table Active & Available</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Disabled tables are hidden from customer self-ordering and marked out of service in POS
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
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
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Table'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
