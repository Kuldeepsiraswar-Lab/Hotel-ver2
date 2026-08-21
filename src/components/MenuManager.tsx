import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ChefHat, 
  Clock, 
  FolderPlus,
  Tag,
  Check,
  X,
  Layers,
  AlertTriangle,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { MenuItem, RestaurantProfile, StaffUser } from '../types';
import { formatCurrency, generateId } from '../utils/formatters';
import { compressImageFile, CULINARY_IMAGE_PRESETS } from '../utils/imageUtils';
import { isAdminOrOwner } from '../utils/permissions';
import { AdminAuthModal } from './AdminAuthModal';

interface MenuManagerProps {
  menuItems: MenuItem[];
  categories?: string[];
  profile: RestaurantProfile;
  currentUser?: StaffUser | null;
  onSaveMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onAddCategory?: (categoryName: string) => void;
  onDeleteCategory?: (categoryName: string, reassignTo?: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
}

const DEFAULT_FALLBACK_CATEGORIES = [
  'Appetizers & Starters',
  'Artisan Pizzas',
  'Handcrafted Pastas',
  'Main Courses',
  'Sides & Salads',
  'Desserts & Sweets',
  'Beverages & Cocktails',
  'Catering Trays & Combos',
];

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  categories: passedCategories,
  profile,
  currentUser,
  onSaveMenuItem,
  onDeleteMenuItem,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
}) => {
  const isAdmin = isAdminOrOwner(currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminAuthPrompt, setAdminAuthPrompt] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onSuccess: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onSuccess: () => {},
  });

  // Quick Add Category State
  const [isQuickAddCategoryOpen, setIsQuickAddCategoryOpen] = useState(false);
  const [quickCategoryName, setQuickCategoryName] = useState('');

  // Category Manager Modal State
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [editCategoryInputValue, setEditCategoryInputValue] = useState('');

  // Delete Confirmations State (Custom in-app modals for 100% iframe reliability)
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [reassignCategoryTarget, setReassignCategoryTarget] = useState<string>('');

  // Form Fields for Add/Edit Dish
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [isCreatingCustomCategoryInForm, setIsCreatingCustomCategoryInForm] = useState(false);
  const [customCategoryInputInForm, setCustomCategoryInputInForm] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageInputTab, setImageInputTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isVeg, setIsVeg] = useState(false);
  const [isSpicy, setIsSpicy] = useState(false);
  const [isGlutenFree, setIsGlutenFree] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [preparationTime, setPreparationTime] = useState<number>(10);

  // Compute unified dynamic categories list
  const allCategories = Array.from(
    new Set([
      ...(passedCategories && passedCategories.length > 0 ? passedCategories : DEFAULT_FALLBACK_CATEGORIES),
      ...menuItems.map(item => item.category)
    ])
  ).filter(Boolean);

  // Filtered Menu Items
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate Average Margin
  const avgMargin = menuItems.length > 0
    ? menuItems.reduce((sum, item) => sum + ((item.price - item.costPrice) / (item.price || 1)) * 100, 0) / menuItems.length
    : 0;

  // Margin calculation helper
  const calculateMargin = (sellPrice: number, cost: number) => {
    if (!sellPrice || sellPrice <= 0) return 0;
    return (((sellPrice - cost) / sellPrice) * 100);
  };

  // Handle local image file upload & compression
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setIsProcessingImage(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 600, 0.85);
      setImageUrl(compressedDataUrl);
    } catch (err) {
      setImageError("Could not process image file. Please try another image.");
    } finally {
      setIsProcessingImage(false);
      // Reset input value so re-selecting same file fires onChange
      e.target.value = '';
    }
  };

  // Open Create Dish Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setName('');
    const defaultCat = selectedCategory !== 'All' ? selectedCategory : (allCategories[0] || 'Main Courses');
    setCategory(defaultCat);
    setIsCreatingCustomCategoryInForm(false);
    setCustomCategoryInputInForm('');
    setPrice(450);
    setCostPrice(120);
    setDescription('');
    setImageUrl('');
    setImageError(null);
    setImageInputTab('upload');
    setIsVeg(false);
    setIsSpicy(false);
    setIsGlutenFree(false);
    setIsAvailable(true);
    setPreparationTime(12);
    setIsModalOpen(true);
  };

  // Open Edit Dish Modal
  const handleOpenEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setIsCreatingCustomCategoryInForm(false);
    setCustomCategoryInputInForm('');
    setPrice(item.price);
    setCostPrice(item.costPrice);
    setDescription(item.description);
    setImageUrl(item.imageUrl || '');
    setImageError(null);
    setImageInputTab(item.imageUrl ? 'upload' : 'upload');
    setIsVeg(!!item.isVeg);
    setIsSpicy(!!item.isSpicy);
    setIsGlutenFree(!!item.isGlutenFree);
    setIsAvailable(item.isAvailable);
    setPreparationTime(item.preparationTime || 10);
    setIsModalOpen(true);
  };

  // Save Dish Submit
  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) {
      return;
    }

    let finalCategory = category;
    if (isCreatingCustomCategoryInForm && customCategoryInputInForm.trim()) {
      finalCategory = customCategoryInputInForm.trim();
      if (onAddCategory) {
        onAddCategory(finalCategory);
      }
    }

    if (!finalCategory) {
      finalCategory = allCategories[0] || 'General Menu';
    }

    const itemToSave: MenuItem = {
      id: editingItem ? editingItem.id : generateId('menu'),
      name: name.trim(),
      category: finalCategory,
      price: Number(price),
      costPrice: Number(costPrice) || 0,
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      isVeg,
      isSpicy,
      isGlutenFree,
      isAvailable,
      preparationTime: Number(preparationTime) || 10,
    };

    onSaveMenuItem(itemToSave);
    setIsModalOpen(false);
  };

  const handleToggleAvailability = (item: MenuItem) => {
    onSaveMenuItem({
      ...item,
      isAvailable: !item.isAvailable,
    });
  };

  // Quick Add Category Submit
  const handleQuickAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickCategoryName.trim();
    if (!trimmed) return;
    if (onAddCategory) {
      onAddCategory(trimmed);
    }
    setSelectedCategory(trimmed);
    setQuickCategoryName('');
    setIsQuickAddCategoryOpen(false);
  };

  // Category Manager: Add Category
  const handleManagerAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (onAddCategory) {
      onAddCategory(trimmed);
    }
    setNewCategoryInput('');
  };

  // Category Manager: Start Rename
  const handleStartRenameCategory = (catName: string) => {
    setEditingCategoryName(catName);
    setEditCategoryInputValue(catName);
  };

  // Category Manager: Save Rename
  const handleSaveRenameCategory = (oldName: string) => {
    const trimmed = editCategoryInputValue.trim();
    if (trimmed && trimmed !== oldName && onRenameCategory) {
      onRenameCategory(oldName, trimmed);
      if (selectedCategory === oldName) {
        setSelectedCategory(trimmed);
      }
    }
    setEditingCategoryName(null);
  };

  // Category Manager: Open Delete Modal
  const handleOpenDeleteCategoryModal = (catName: string) => {
    setCategoryToDelete(catName);
    const fallbackTarget = allCategories.find(c => c !== catName) || '';
    setReassignCategoryTarget(fallbackTarget);
  };

  // Confirm Delete Category
  const handleConfirmDeleteCategory = () => {
    if (!categoryToDelete) return;
    if (onDeleteCategory) {
      onDeleteCategory(categoryToDelete, reassignCategoryTarget || undefined);
    }
    if (selectedCategory === categoryToDelete) {
      setSelectedCategory('All');
    }
    setCategoryToDelete(null);
  };

  // Confirm Delete Dish Item
  const handleConfirmDeleteDish = () => {
    if (!itemToDelete) return;
    onDeleteMenuItem(itemToDelete.id);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-500" />
              Menu Catalog & Dish Margin Costing
            </h2>
            {!isAdmin && (
              <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Staff View-Only (Admin for Edits)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure dish categories, prices, Cost of Goods Sold (COGS), profit margins & stock availability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold font-mono">
            Avg Menu Margin: {avgMargin.toFixed(1)}%
          </div>

          <button
            id="btn-manage-categories"
            type="button"
            onClick={() => {
              if (isAdmin) {
                setIsCategoryManagerOpen(true);
              } else {
                setAdminAuthPrompt({
                  isOpen: true,
                  title: 'Admin Authorization: Manage Categories',
                  description: 'Only Admin/Owner can add, rename, or delete menu categories. Enter Admin Master PIN to authorize.',
                  onSuccess: () => setIsCategoryManagerOpen(true),
                });
              }
            }}
            className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Manage, create and delete menu categories"
          >
            <FolderPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Manage Categories</span>
          </button>

          <button
            id="btn-add-menu-item"
            type="button"
            onClick={() => {
              if (isAdmin) {
                handleOpenCreateModal();
              } else {
                setAdminAuthPrompt({
                  isOpen: true,
                  title: 'Admin Authorization: Add Menu Item',
                  description: 'Only Admin/Owner can add new menu items and set prices. Enter Admin Master PIN to authorize.',
                  onSuccess: () => handleOpenCreateModal(),
                });
              }
            }}
            className="px-4 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400 dark:text-slate-950" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Filter & Category Navigation Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search dish name, category, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            {!isQuickAddCategoryOpen ? (
              <button
                id="btn-quick-add-category-toggle"
                type="button"
                onClick={() => setIsQuickAddCategoryOpen(true)}
                className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>+ Add Category</span>
              </button>
            ) : (
              <form onSubmit={handleQuickAddCategorySubmit} className="flex items-center gap-1.5">
                <input
                  type="text"
                  autoFocus
                  placeholder="New Category Name..."
                  value={quickCategoryName}
                  onChange={(e) => setQuickCategoryName(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-amber-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsQuickAddCategoryOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Category Pills List */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'All'
                ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>All</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              selectedCategory === 'All' ? 'bg-slate-800 dark:bg-amber-600 text-amber-300 dark:text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}>
              {menuItems.length}
            </span>
          </button>

          {allCategories.map((cat) => {
            const count = menuItems.filter(item => item.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isSelected ? 'bg-slate-800 dark:bg-amber-600 text-amber-300 dark:text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Dishes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredItems.map((item) => {
          const margin = calculateMargin(item.price, item.costPrice);
          const profit = Math.max(0, item.price - item.costPrice);

          return (
            <div
              key={item.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                item.isAvailable ? 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md' : 'border-slate-200/50 dark:border-slate-800/50 opacity-60 bg-slate-50 dark:bg-slate-950'
              }`}
            >
              <div>
                {/* Dish Photo Banner */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 dark:from-slate-800 via-amber-50/40 dark:via-slate-800/40 to-slate-100 dark:to-slate-800 text-slate-400">
                      <ChefHat className="w-10 h-10 mb-1.5 opacity-40 text-amber-600 dark:text-amber-400" />
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">No Image Added</span>
                    </div>
                  )}

                  {/* Category Pill on Image */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-bold rounded-lg uppercase tracking-wider shadow-xs">
                      {item.category}
                    </span>
                  </div>

                  {/* Stock Availability Toggle Button */}
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer backdrop-blur-md shadow-xs ${
                        item.isAvailable
                          ? 'bg-emerald-500/90 hover:bg-emerald-600 text-white'
                          : 'bg-slate-900/90 hover:bg-slate-950 text-slate-200'
                      }`}
                      title={item.isAvailable ? "Mark as Sold Out" : "Mark as In Stock"}
                    >
                      {item.isAvailable ? '● In Stock' : '✕ Sold Out'}
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{item.name}</h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">
                    {item.description || 'No description provided.'}
                  </p>

                  {/* Dietary & Time Tags */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {item.isVeg && <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md">VEG</span>}
                    {item.isSpicy && <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-[10px] font-bold rounded-md">SPICY</span>}
                    {item.isGlutenFree && <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold rounded-md">GF</span>}
                    {item.preparationTime && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" /> {item.preparationTime} min
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dish Financial Margins Box */}
              <div className="px-5 pb-5 pt-0">
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
                    <div>
                      <span className="text-[10px] font-sans text-slate-400 dark:text-slate-500 block">Sell Price</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(item.price, profile.currencySymbol)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-sans text-slate-400 dark:text-slate-500 block">COGS Cost</span>
                      <span className="text-slate-600 dark:text-slate-400">{formatCurrency(item.costPrice, profile.currencySymbol)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-sans text-slate-400 dark:text-slate-500 block">Gross Margin</span>
                      <span className={`font-bold ${
                        margin >= 70 ? 'text-emerald-700 dark:text-emerald-400' :
                        margin >= 55 ? 'text-amber-700 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {margin.toFixed(0)}% (+{formatCurrency(profit, profile.currencySymbol)})
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (isAdmin) {
                          handleOpenEditModal(item);
                        } else {
                          setAdminAuthPrompt({
                            isOpen: true,
                            title: `Admin Authorization: Edit "${item.name}"`,
                            description: 'Only Admin/Owner can modify menu items, prices, or COGS. Enter Admin Master PIN to authorize.',
                            onSuccess: () => handleOpenEditModal(item),
                          });
                        }
                      }}
                      className="px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isAdmin) {
                          setItemToDelete(item);
                        } else {
                          setAdminAuthPrompt({
                            isOpen: true,
                            title: `Admin Authorization: Delete "${item.name}"`,
                            description: 'Only Admin/Owner can delete menu items. Enter Admin Master PIN to authorize.',
                            onSuccess: () => setItemToDelete(item),
                          });
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                        isAdmin 
                          ? 'text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40' 
                          : 'text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                      }`}
                      title={isAdmin ? "Delete Menu Dish (Admin)" : "Delete Dish (Requires Admin PIN)"}
                    >
                      {isAdmin ? <Trash2 className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <ChefHat className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No menu items found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Try adjusting your search filter or add a new dish to this category.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950" />
            <span>Add Dish Now</span>
          </button>
        </div>
      )}

      {/* ================= MODAL 1: ADD / EDIT DISH MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900 dark:text-white">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">
                  {editingItem ? 'Edit Dish & Margin' : 'Add New Restaurant Dish'}
                </h3>
                <p className="text-xs text-slate-400">Configure dish photo, ingredient cost, selling price & category</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              
              {/* Dish Photo / Image Configuration */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Dish Photo / Image</span>
                  </label>

                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-[11px] text-red-600 dark:text-red-400 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Remove Photo
                    </button>
                  )}
                </div>

                {/* Live Preview if image exists */}
                {imageUrl ? (
                  <div className="relative h-36 w-full rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group">
                    <img
                      src={imageUrl}
                      alt="Dish preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="text-xs text-white font-bold bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-xs">
                        Photo Loaded
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Image Selection Tabs */}
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-750 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setImageInputTab('upload')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      imageInputTab === 'upload' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputTab('preset')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      imageInputTab === 'preset' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Presets Gallery
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageInputTab('url')}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                      imageInputTab === 'url' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Web URL
                  </button>
                </div>

                {/* Tab 1: Upload from Device */}
                {imageInputTab === 'upload' && (
                  <div>
                    <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-800 hover:bg-amber-50/20 dark:hover:bg-slate-750 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
                      {isProcessingImage ? (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin text-amber-600 dark:text-amber-400" />
                          <span className="font-semibold">Optimizing image...</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-1" />
                          <span className="font-bold text-slate-700 dark:text-slate-300">Choose or drop a dish image</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">PNG, JPG, WebP (auto-optimized & resized)</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isProcessingImage}
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {/* Tab 2: Curated Presets Gallery */}
                {imageInputTab === 'preset' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Click any preset culinary photo to apply:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                      {CULINARY_IMAGE_PRESETS.map((preset) => {
                        const isSelected = imageUrl === preset.url;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setImageUrl(preset.url)}
                            className={`group relative rounded-lg overflow-hidden border-2 text-left cursor-pointer transition-all aspect-video ${
                              isSelected ? 'border-amber-500 ring-2 ring-amber-400' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1">
                              <span className="text-[9px] font-bold text-white leading-tight line-clamp-1">
                                {preset.name}
                              </span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow-xs">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tab 3: Custom Web URL */}
                {imageInputTab === 'url' && (
                  <div>
                    <input
                      type="url"
                      placeholder="Paste image link (e.g. https://.../photo.jpg)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500 text-xs font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {imageError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">{imageError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Dish / Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lobster & Saffron Ravioli"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none font-semibold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Menu Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCustomCategoryInForm(!isCreatingCustomCategoryInForm)}
                      className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 hover:underline cursor-pointer"
                    >
                      {isCreatingCustomCategoryInForm ? "Choose Existing" : "+ New Category"}
                    </button>
                  </div>

                  {!isCreatingCustomCategoryInForm ? (
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none font-medium text-slate-900 dark:text-white"
                    >
                      {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Type custom category name..."
                      value={customCategoryInputInForm}
                      onChange={(e) => setCustomCategoryInputInForm(e.target.value)}
                      className="w-full px-3 py-2 bg-amber-50 dark:bg-amber-950/50 border border-amber-400 dark:border-amber-600 rounded-lg focus:outline-none font-semibold text-amber-950 dark:text-amber-200"
                    />
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Prep Time (Minutes)</label>
                  <input
                    type="number"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(parseInt(e.target.value, 10) || 10)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Menu Selling Price ({profile.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={price || ''}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-amber-400 font-mono font-bold text-sm rounded-lg focus:outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Raw Ingredient Cost / COGS ({profile.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.10"
                    value={costPrice || ''}
                    onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-sm rounded-lg focus:outline-none text-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>

              {/* Real-time Profit Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Calculated Profit per Serving:</span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  +{formatCurrency(Math.max(0, price - costPrice), profile.currencySymbol)} ({calculateMargin(price, costPrice).toFixed(1)}% margin)
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Description & Ingredients</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, sauce reduction, serving garnishes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              {/* Dietary Flags */}
              <div className="flex items-center gap-4 pt-1 text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isVeg}
                    onChange={(e) => setIsVeg(e.target.checked)}
                    className="rounded text-slate-900 dark:text-amber-500 cursor-pointer"
                  />
                  <span>Vegetarian</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpicy}
                    onChange={(e) => setIsSpicy(e.target.checked)}
                    className="rounded text-slate-900 dark:text-amber-500 cursor-pointer"
                  />
                  <span>Spicy</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGlutenFree}
                    onChange={(e) => setIsGlutenFree(e.target.checked)}
                    className="rounded text-slate-900 dark:text-amber-500 cursor-pointer"
                  />
                  <span>Gluten-Free</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl font-bold shadow-md cursor-pointer active:scale-95 transition-transform"
                >
                  {editingItem ? 'Update Dish' : 'Add to Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: MANAGE CATEGORIES MODAL ================= */}
      {isCategoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-base">Menu Categories Manager</h3>
                  <p className="text-xs text-slate-400">Add, rename, or delete restaurant categories</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsCategoryManagerOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              
              {/* Add New Category Form */}
              <form onSubmit={handleManagerAddCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Create new category (e.g. Chef Tasting, Cocktails)..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-850 focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500 focus:outline-none font-semibold text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newCategoryInput.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </form>

              {/* Categories List */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                {allCategories.map((cat) => {
                  const itemCount = menuItems.filter(i => i.category === cat).length;
                  const isEditing = editingCategoryName === cat;

                  return (
                    <div key={cat} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input
                            type="text"
                            autoFocus
                            value={editCategoryInputValue}
                            onChange={(e) => setEditCategoryInputValue(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-xs border border-amber-400 rounded-lg focus:outline-none font-semibold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRenameCategory(cat)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategoryName(null)}
                            className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold text-slate-900 dark:text-white">{cat}</span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full font-mono">
                            {itemCount} {itemCount === 1 ? 'dish' : 'dishes'}
                          </span>
                        </div>
                      )}

                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartRenameCategory(cat)}
                            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                            title="Rename Category"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteCategoryModal(cat)}
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded cursor-pointer"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(false)}
                  className="px-4 py-2 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: DELETE MENU DISH CONFIRMATION ================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Menu Item?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">{itemToDelete.name}</strong> from the restaurant menu?
                </p>

                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Category:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{itemToDelete.category}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400 mt-1">
                    <span>Selling Price:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(itemToDelete.price, profile.currencySymbol)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete-dish"
                  type="button"
                  onClick={handleConfirmDeleteDish}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  Yes, Delete Dish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: DELETE CATEGORY CONFIRMATION ================= */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Menu Category?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  You are deleting category: <strong className="text-slate-900 dark:text-white">{categoryToDelete}</strong>
                </p>

                {(() => {
                  const affectedCount = menuItems.filter(i => i.category === categoryToDelete).length;
                  if (affectedCount > 0) {
                    return (
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-left text-xs space-y-2">
                        <p className="text-amber-900 dark:text-amber-300 font-medium">
                          There are <strong>{affectedCount}</strong> dish(es) currently assigned to this category.
                        </p>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Reassign dishes to:
                          </label>
                          <select
                            value={reassignCategoryTarget}
                            onChange={(e) => setReassignCategoryTarget(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                          >
                            {allCategories.filter(c => c !== categoryToDelete).map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      There are no dishes assigned to this category.
                    </p>
                  );
                })()}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete-category"
                  type="button"
                  onClick={handleConfirmDeleteCategory}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin PIN Override Modal */}
      <AdminAuthModal
        isOpen={adminAuthPrompt.isOpen}
        onClose={() => setAdminAuthPrompt(prev => ({ ...prev, isOpen: false }))}
        onAuthorized={() => {
          const fn = adminAuthPrompt.onSuccess;
          setAdminAuthPrompt(prev => ({ ...prev, isOpen: false }));
          if (fn) fn();
        }}
        actionTitle={adminAuthPrompt.title}
        actionDescription={adminAuthPrompt.description}
        adminPin={profile.adminPin}
      />
    </div>
  );
};
