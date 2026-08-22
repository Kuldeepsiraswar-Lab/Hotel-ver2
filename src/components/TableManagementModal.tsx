import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Utensils, 
  Users, 
  Search, 
  QrCode, 
  Layers, 
  Sparkles, 
  AlertTriangle, 
  Check, 
  Square, 
  Circle, 
  RectangleHorizontal,
  DollarSign,
  Radio
} from 'lucide-react';
import { RestaurantTable, BillOrder, RestaurantProfile } from '../types';
import { DEFAULT_TABLE_SECTIONS } from '../data/defaultData';
import { TableEditorModal } from './TableEditorModal';
import { BatchAddTablesModal } from './BatchAddTablesModal';
import { formatCurrency } from '../utils/formatters';

interface TableManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  orders: BillOrder[];
  profile: RestaurantProfile;
  onSaveTable: (table: RestaurantTable) => void;
  onDeleteTable: (tableId: string) => void;
  onBatchAddTables: (tables: RestaurantTable[]) => void;
  onSelectTableForPOS?: (tableName: string) => void;
  onOpenQRStandee?: (tableName: string) => void;
}

export const TableManagementModal: React.FC<TableManagementModalProps> = ({
  isOpen,
  onClose,
  tables,
  orders,
  profile,
  onSaveTable,
  onDeleteTable,
  onBatchAddTables,
  onSelectTableForPOS,
  onOpenQRStandee,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied'>('all');
  
  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);
  const [tableToDelete, setTableToDelete] = useState<RestaurantTable | null>(null);

  if (!isOpen) return null;

  // Sections
  const availableSections = ['All', ...Array.from(new Set(tables.map(t => t.section).filter(Boolean)))];

  // Helper for active order
  const getTableActiveOrder = (tblName: string) => {
    if (!tblName) return undefined;
    const cleanTbl = tblName.trim().toLowerCase();
    return orders.find(o => 
      o.tableNumber && o.tableNumber.trim().toLowerCase() === cleanTbl && 
      o.paymentStatus === 'pending' && 
      !o.isArchived
    );
  };

  // Filter tables
  const filteredTables = tables.filter(t => {
    const matchesSection = selectedSection === 'All' || t.section === selectedSection;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || 
      t.name.toLowerCase().includes(q) || 
      (t.section && t.section.toLowerCase().includes(q)) ||
      (t.notes && t.notes.toLowerCase().includes(q));
    
    const activeOrder = getTableActiveOrder(t.name);
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'occupied' ? Boolean(activeOrder) :
      !activeOrder;

    return matchesSection && matchesSearch && matchesStatus;
  });

  const totalSeats = tables.reduce((sum, t) => sum + (t.capacity || 4), 0);
  const occupiedCount = tables.filter(t => !!getTableActiveOrder(t.name)).length;

  const handleDeleteConfirm = () => {
    if (!tableToDelete) return;
    onDeleteTable(tableToDelete.id);
    setTableToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 rounded-2xl shadow-md">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Dining Tables & Floor Setup
                </h2>
                <span className="px-2.5 py-0.5 bg-amber-400/20 text-amber-300 font-bold text-[10px] rounded-full uppercase border border-amber-400/40">
                  {tables.length} Tables Registered
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Add, edit sections, seating capacity, or delete floor tables synced across POS & QR ordering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchOpen(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Bulk Add</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingTable(null);
                setIsEditorOpen(true);
              }}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Stats & Search & Section Filter */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search table, section, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 self-end sm:self-center">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>{totalSeats} Total Seats</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{tables.length - occupiedCount} Free</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{occupiedCount} Occupied</span>
            </span>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="px-4 py-2 bg-slate-100/60 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto">
          {availableSections.map((sec) => {
            const countInSec = sec === 'All' ? tables.length : tables.filter(t => t.section === sec).length;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setSelectedSection(sec)}
                className={`px-3 py-1 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedSection === sec
                    ? 'bg-slate-900 dark:bg-amber-400 text-amber-400 dark:text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{sec}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  selectedSection === sec
                    ? 'bg-amber-500/30 text-amber-300 dark:bg-slate-900 dark:text-amber-400 font-mono font-black'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}>
                  {countInSec}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tables Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/40">
          {filteredTables.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
              <Utensils className="w-12 h-12 mb-2 stroke-1 text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No tables found</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Try adjusting your search filter or click &quot;Add Table&quot; to create a new floor table.
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingTable(null);
                  setIsEditorOpen(true);
                }}
                className="mt-4 px-4 py-2 bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Table</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {filteredTables.map((table) => {
                const activeOrder = getTableActiveOrder(table.name);
                const isOccupied = Boolean(activeOrder);

                return (
                  <div
                    key={table.id}
                    className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition-all group relative ${
                      isOccupied
                        ? 'border-amber-300 dark:border-amber-600/60 bg-amber-50/20 dark:bg-amber-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      {/* Card Top: Name & Section */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {table.name}
                            </h4>
                            {table.isActive === false && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-bold">
                                Inactive
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                            {table.section}
                          </span>
                        </div>

                        {/* Status Pill */}
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                          isOccupied
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span>{isOccupied ? 'Occupied' : 'Ready'}</span>
                        </div>
                      </div>

                      {/* Capacity & Shape */}
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 my-2">
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>{table.capacity} Seats</span>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg capitalize">
                          {table.shape === 'round' ? <Circle className="w-3 h-3" /> :
                           table.shape === 'rectangle' ? <RectangleHorizontal className="w-3 h-3" /> :
                           <Square className="w-3 h-3" />}
                          <span className="text-[11px]">{table.shape || 'Square'}</span>
                        </div>
                      </div>

                      {/* Notes / description */}
                      {table.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic line-clamp-1 mb-2">
                          &ldquo;{table.notes}&rdquo;
                        </p>
                      )}

                      {/* Active Order Details if Occupied */}
                      {activeOrder && (
                        <div className="p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-xs my-2">
                          <div className="flex justify-between items-center font-bold text-amber-950 dark:text-amber-200">
                            <span>Active: #{activeOrder.invoiceNumber}</span>
                            <span className="font-mono font-black">{formatCurrency(activeOrder.total, profile.currencySymbol)}</span>
                          </div>
                          <p className="text-[10px] text-amber-800 dark:text-amber-400 mt-0.5">
                            {activeOrder.customerName ? `Guest: ${activeOrder.customerName} • ` : ''}{activeOrder.items?.length || 0} dishes
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 mt-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTable(table);
                            setIsEditorOpen(true);
                          }}
                          title="Edit table details"
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setTableToDelete(table)}
                          title="Delete table"
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {onOpenQRStandee && (
                          <button
                            type="button"
                            onClick={() => onOpenQRStandee(table.name)}
                            title="Generate QR code standee"
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <QrCode className="w-3 h-3 text-amber-500" />
                            <span>QR</span>
                          </button>
                        )}

                        {onSelectTableForPOS && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectTableForPOS(table.name);
                              onClose();
                            }}
                            className="px-2.5 py-1 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <span>Select for POS</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Alert Modal */}
        {tableToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-red-200 dark:border-red-800/60 p-6 w-full max-w-md shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Delete {tableToDelete.name}?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to remove this table from the floor directory? This will remove its QR code entry.
                </p>
                {getTableActiveOrder(tableToDelete.name) && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/60 rounded-xl text-xs font-bold text-amber-900 dark:text-amber-200 text-left">
                    ⚠️ Warning: {tableToDelete.name} currently has an active pending dine-in order.
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTableToDelete(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sub-modals */}
        <TableEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingTable(null);
          }}
          tableToEdit={editingTable}
          onSave={onSaveTable}
          existingTables={tables}
        />

        <BatchAddTablesModal
          isOpen={isBatchOpen}
          onClose={() => setIsBatchOpen(false)}
          existingTables={tables}
          onBatchSave={onBatchAddTables}
        />
      </div>
    </div>
  );
};
