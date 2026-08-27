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
  Palette,
  CheckCircle2,
  Flame,
  Leaf,
  ShieldCheck,
  LayoutGrid,
  List,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { MenuItem, RestaurantProfile, StaffUser, MenuTag, TagColor } from '../types';
import { formatCurrency, generateId } from '../utils/formatters';
import { compressImageFile, CULINARY_IMAGE_PRESETS } from '../utils/imageUtils';
import { isAdminOrOwner } from '../utils/permissions';
import { AdminAuthModal } from './AdminAuthModal';
import { getTagStyle, AVAILABLE_TAG_COLORS } from '../utils/tagUtils';

interface MenuManagerProps {
  menuItems: MenuItem[];
  categories?: string[];
  tags?: MenuTag[];
  profile: RestaurantProfile;
  currentUser?: StaffUser | null;
  onSaveMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onAddCategory?: (categoryName: string) => void;
  onDeleteCategory?: (categoryName: string, reassignTo?: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  onAddTag?: (tag: MenuTag) => void;
  onEditTag?: (tagId: string, newName: string, newColor?: TagColor, newDescription?: string) => void;
  onDeleteTag?: (tagId: string, tagName: string) => void;
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

type DietaryFilter = 'ALL' | 'VEG' | 'NON_VEG' | 'SPICY' | 'GF';
type ViewMode = 'grid' | 'table';

export const MenuManager: React.FC<MenuManagerProps> = ({
  menuItems,
  categories: passedCategories,
  tags: passedTags = [],
  profile,
  currentUser,
  onSaveMenuItem,
  onDeleteMenuItem,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  onAddTag,
  onEditTag,
  onDeleteTag,
}) => {
  const isAdmin = isAdminOrOwner(currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTagFilter, setSelectedTagFilter] = useState('All');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeQuickTagDishId, setActiveQuickTagDishId] = useState<string | null>(null);

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

  // ================= TAGS STATE =================
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [newTagNameInput, setNewTagNameInput] = useState('');
  const [newTagColorInput, setNewTagColorInput] = useState<TagColor>('amber');
  const [newTagDescInput, setNewTagDescInput] = useState('');
  const [editingTag, setEditingTag] = useState<MenuTag | null>(null);
  const [editTagNameValue, setEditTagNameValue] = useState('');
  const [editTagColorValue, setEditTagColorValue] = useState<TagColor>('amber');
  const [editTagDescValue, setEditTagDescValue] = useState('');
  const [tagToDelete, setTagToDelete] = useState<MenuTag | null>(null);

  // Delete Confirmations State
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
  
  // Tags assigned to current dish in modal
  const [selectedDishTags, setSelectedDishTags] = useState<string[]>([]);
  const [inlineNewTagName, setInlineNewTagName] = useState('');
  const [inlineNewTagColor, setInlineNewTagColor] = useState<TagColor>('amber');
  const [isInlineAddingTag, setIsInlineAddingTag] = useState(false);

  // Compute unified dynamic categories list
  const allCategories = Array.from(
    new Set([
      ...(passedCategories && passedCategories.length > 0 ? passedCategories : DEFAULT_FALLBACK_CATEGORIES),
      ...menuItems.map(item => item.category)
    ])
  ).filter(Boolean);

  // Compute unified dynamic tags list
  const allKnownTags: MenuTag[] = [...passedTags];
  menuItems.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tName => {
        if (tName && typeof tName === 'string' && tName.trim()) {
          const cleanTName = tName.trim().toLowerCase();
          if (!allKnownTags.some(kt => kt && kt.name && kt.name.trim().toLowerCase() === cleanTName)) {
            allKnownTags.push({
              id: `tag-${cleanTName.replace(/[^a-z0-9]/g, '-')}`,
              name: tName.trim(),
              color: 'indigo'
            });
          }
        }
      });
    }
  });

  // Filtered Menu Items
  const filteredItems = menuItems.filter(item => {
    const q = (searchQuery || '').trim().toLowerCase();
    const matchesSearch = !q ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.tags && Array.isArray(item.tags) && item.tags.some(t => t && typeof t === 'string' && t.toLowerCase().includes(q)));
    
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const filterTagLower = (selectedTagFilter || 'All').toLowerCase();
    const matchesTag = filterTagLower === 'all' || 
      (item.tags && Array.isArray(item.tags) && item.tags.some(t => t && typeof t === 'string' && t.toLowerCase() === filterTagLower));
    
    let matchesDietary = true;
    if (dietaryFilter === 'VEG') {
      matchesDietary = !!item.isVeg;
    } else if (dietaryFilter === 'NON_VEG') {
      matchesDietary = !item.isVeg;
    } else if (dietaryFilter === 'SPICY') {
      matchesDietary = !!item.isSpicy;
    } else if (dietaryFilter === 'GF') {
      matchesDietary = !!item.isGlutenFree;
    }

    return matchesSearch && matchesCategory && matchesTag && matchesDietary;
  });

  // Dietary Counts
  const vegCount = menuItems.filter(i => i.isVeg).length;
  const nonVegCount = menuItems.filter(i => !i.isVeg).length;
  const spicyCount = menuItems.filter(i => i.isSpicy).length;
  const gfCount = menuItems.filter(i => i.isGlutenFree).length;

  // Quick Dietary Toggles directly on Dish Cards or Table rows
  const handleToggleVegDirect = (item: MenuItem) => {
    const doToggle = () => {
      onSaveMenuItem({
        ...item,
        isVeg: !item.isVeg,
      });
    };

    if (isAdmin) {
      doToggle();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        title: `Admin Authorization: Toggle Veg status for "${item.name}"`,
        description: 'Only Admin/Owner can update dietary tags. Enter Admin Master PIN to authorize.',
        onSuccess: doToggle,
      });
    }
  };

  const handleToggleSpicyDirect = (item: MenuItem) => {
    const doToggle = () => {
      onSaveMenuItem({
        ...item,
        isSpicy: !item.isSpicy,
      });
    };

    if (isAdmin) {
      doToggle();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        title: `Admin Authorization: Toggle Spicy status for "${item.name}"`,
        description: 'Only Admin/Owner can update dietary tags. Enter Admin Master PIN to authorize.',
        onSuccess: doToggle,
      });
    }
  };

  const handleToggleGFDirect = (item: MenuItem) => {
    const doToggle = () => {
      onSaveMenuItem({
        ...item,
        isGlutenFree: !item.isGlutenFree,
      });
    };

    if (isAdmin) {
      doToggle();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        title: `Admin Authorization: Toggle Gluten-Free status for "${item.name}"`,
        description: 'Only Admin/Owner can update dietary tags. Enter Admin Master PIN to authorize.',
        onSuccess: doToggle,
      });
    }
  };

  const handleQuickAddTagToDish = (item: MenuItem, tagName: string) => {
    if (!tagName) return;
    const clean = tagName.trim();
    const doAdd = () => {
      const currentTags = item.tags ? [...item.tags] : [];
      if (!currentTags.some(t => t && t.toLowerCase() === clean.toLowerCase())) {
        currentTags.push(clean);
        onSaveMenuItem({
          ...item,
          tags: currentTags,
        });
      }
    };

    if (isAdmin) {
      doAdd();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        title: `Admin Authorization: Add Tag to "${item.name}"`,
        description: 'Only Admin/Owner can modify dish tags. Enter Admin Master PIN to authorize.',
        onSuccess: doAdd,
      });
    }
  };

  const handleQuickRemoveTagFromDish = (item: MenuItem, tagName: string) => {
    if (!tagName) return;
    const clean = tagName.trim();
    const doRemove = () => {
      if (!item.tags) return;
      const updatedTags = item.tags.filter(t => t && t.toLowerCase() !== clean.toLowerCase());
      onSaveMenuItem({
        ...item,
        tags: updatedTags.length > 0 ? updatedTags : undefined,
      });
    };

    if (isAdmin) {
      doRemove();
    } else {
      setAdminAuthPrompt({
        isOpen: true,
        title: `Admin Authorization: Remove Tag from "${item.name}"`,
        description: 'Only Admin/Owner can modify dish tags. Enter Admin Master PIN to authorize.',
        onSuccess: doRemove,
      });
    }
  };

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
    setSelectedDishTags([]);
    setInlineNewTagName('');
    setIsInlineAddingTag(false);
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
    setSelectedDishTags(item.tags ? [...item.tags] : []);
    setInlineNewTagName('');
    setIsInlineAddingTag(false);
    setIsModalOpen(true);
  };

  // Toggle tag in dish form
  const handleToggleDishTag = (tagName: string) => {
    if (!tagName) return;
    const clean = tagName.trim();
    setSelectedDishTags(prev => {
      const exists = prev.some(t => t && t.toLowerCase() === clean.toLowerCase());
      if (exists) {
        return prev.filter(t => t && t.toLowerCase() !== clean.toLowerCase());
      } else {
        return [...prev, clean];
      }
    });
  };

  // Inline Add Tag inside Dish Form
  const handleAddInlineTagSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inlineNewTagName.trim();
    if (!trimmed) return;

    if (!selectedDishTags.some(t => t && t.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedDishTags(prev => [...prev, trimmed]);
    }

    if (onAddTag && !allKnownTags.some(t => t && t.name && t.name.toLowerCase() === trimmed.toLowerCase())) {
      onAddTag({
        id: generateId('tag'),
        name: trimmed,
        color: inlineNewTagColor,
      });
    }

    setInlineNewTagName('');
    setIsInlineAddingTag(false);
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
      tags: selectedDishTags.length > 0 ? selectedDishTags : undefined,
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

  // ================= TAGS HANDLERS =================
  const handleCreateNewTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTagNameInput.trim();
    if (!trimmed) return;

    if (onAddTag) {
      onAddTag({
        id: generateId('tag'),
        name: trimmed,
        color: newTagColorInput,
        description: newTagDescInput.trim() || undefined,
      });
    }

    setNewTagNameInput('');
    setNewTagDescInput('');
    setNewTagColorInput('amber');
  };

  const handleStartEditTag = (tag: MenuTag) => {
    setEditingTag(tag);
    setEditTagNameValue(tag.name);
    setEditTagColorValue(tag.color || 'amber');
    setEditTagDescValue(tag.description || '');
  };

  const handleSaveEditTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingTag || !editTagNameValue.trim()) return;

    if (onEditTag) {
      onEditTag(
        editingTag.id, 
        editTagNameValue.trim(), 
        editTagColorValue, 
        editTagDescValue.trim() || undefined
      );
    }

    setEditingTag(null);
  };

  const handleConfirmDeleteTag = () => {
    if (!tagToDelete) return;
    if (onDeleteTag) {
      onDeleteTag(tagToDelete.id, tagToDelete.name);
    }
    if (tagToDelete.name && selectedTagFilter.toLowerCase() === tagToDelete.name.toLowerCase()) {
      setSelectedTagFilter('All');
    }
    setTagToDelete(null);
  };

  // Tags filtered in Tag Manager
  const filteredTagsInManager = allKnownTags.filter(t => {
    const q = (tagSearchQuery || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-500" />
              Menu Catalog & Recipe Tags
            </h2>
            {!isAdmin && (
              <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Staff View-Only (Admin for Edits)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure dish categories, culinary tags, prices, recipe badges & profit margins.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold font-mono">
            Avg Menu Margin: {avgMargin.toFixed(1)}%
          </div>

          {/* Manage Tags Facility Button */}
          <button
            id="btn-manage-tags"
            type="button"
            onClick={() => {
              if (isAdmin) {
                setIsTagManagerOpen(true);
              } else {
                setAdminAuthPrompt({
                  isOpen: true,
                  title: 'Admin Authorization: Manage Tags',
                  description: 'Only Admin/Owner can add, customize, edit, or delete culinary tags. Enter Admin Master PIN to authorize.',
                  onSuccess: () => setIsTagManagerOpen(true),
                });
              }
            }}
            className="px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            title="Create, edit, colorize, and delete recipe & menu tags"
          >
            <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Manage Tags</span>
            <span className="px-1.5 py-0.2 bg-amber-200/60 dark:bg-amber-800/60 text-amber-950 dark:text-amber-200 rounded-full text-[10px]">
              {allKnownTags.length}
            </span>
          </button>

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
            <span>Categories</span>
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
              placeholder="Search dishes, tags, categories, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500 focus:outline-none"
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
            <Layers className="w-3.5 h-3.5" />
            <span>All Dishes ({menuItems.length})</span>
          </button>

          {allCategories.map((cat) => {
            const count = menuItems.filter(i => i.category === cat).length;
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
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected 
                    ? 'bg-slate-800 dark:bg-amber-600 text-slate-200 dark:text-slate-950 font-black' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter & Category Navigation Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Dietary Flags Quick Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" /> Dietary:
            </span>

            <button
              type="button"
              onClick={() => setDietaryFilter('ALL')}
              className={`px-2.5 py-1 text-xs rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                dietaryFilter === 'ALL'
                  ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>All</span>
              <span className="text-[10px] font-mono opacity-80">({menuItems.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setDietaryFilter(dietaryFilter === 'VEG' ? 'ALL' : 'VEG')}
              className={`px-2.5 py-1 text-xs rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                dietaryFilter === 'VEG'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
              }`}
            >
              <Leaf className="w-3.5 h-3.5" />
              <span>Veg Only</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                dietaryFilter === 'VEG' ? 'bg-emerald-800 text-white' : 'bg-emerald-200/80 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100'
              }`}>
                {vegCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDietaryFilter(dietaryFilter === 'NON_VEG' ? 'ALL' : 'NON_VEG')}
              className={`px-2.5 py-1 text-xs rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                dietaryFilter === 'NON_VEG'
                  ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>Non-Veg</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                dietaryFilter === 'NON_VEG' ? 'bg-slate-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
              }`}>
                {nonVegCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDietaryFilter(dietaryFilter === 'SPICY' ? 'ALL' : 'SPICY')}
              className={`px-2.5 py-1 text-xs rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                dietaryFilter === 'SPICY'
                  ? 'bg-red-600 text-white border-red-700 shadow-xs'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/40'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Spicy</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                dietaryFilter === 'SPICY' ? 'bg-red-800 text-white' : 'bg-red-200/80 dark:bg-red-800 text-red-950 dark:text-red-100'
              }`}>
                {spicyCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setDietaryFilter(dietaryFilter === 'GF' ? 'ALL' : 'GF')}
              className={`px-2.5 py-1 text-xs rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                dietaryFilter === 'GF'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Gluten-Free (GF)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                dietaryFilter === 'GF' ? 'bg-amber-800 text-white' : 'bg-amber-200/80 dark:bg-amber-800 text-amber-950 dark:text-amber-100'
              }`}>
                {gfCount}
              </span>
            </button>
          </div>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Grid Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-500" />
              <span>Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Dense Table View"
            >
              <List className="w-3.5 h-3.5 text-amber-500" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Recipe Tags Filter Bar */}
        {allKnownTags.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <Tag className="w-3 h-3 text-amber-500" /> Filter by Tag:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTagFilter('All')}
              className={`px-2.5 py-1 text-[11px] rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTagFilter === 'All'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs font-extrabold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Tags
            </button>
            {allKnownTags.filter(tag => tag && tag.name).map(tag => {
              const count = menuItems.filter(i => i.tags && Array.isArray(i.tags) && i.tags.some(t => t && tag.name && t.toLowerCase() === tag.name.toLowerCase())).length;
              const isSelected = !!(tag.name && selectedTagFilter.toLowerCase() === tag.name.toLowerCase());
              const style = getTagStyle(tag.name, allKnownTags);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => setSelectedTagFilter(isSelected ? 'All' : tag.name)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-slate-900 text-amber-400 dark:bg-amber-400 dark:text-slate-950 border-amber-500 shadow-xs'
                      : `${style.bg} ${style.text} ${style.border} hover:opacity-80`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  <span>{tag.name}</span>
                  <span className="text-[9px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Menu Items: GRID VIEW or TABLE VIEW */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const margin = calculateMargin(item.price, item.costPrice);
            const profit = Math.max(0, item.price - item.costPrice);
            const isTagDropdownOpen = activeQuickTagDishId === item.id;

            return (
              <div 
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Dish Card Photo Header */}
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
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

                    {/* Interactive Dietary Badges: Quick 1-Click Toggles for Veg, Spicy, GF */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      {/* Veg / Non-Veg Toggle Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleVegDirect(item)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer active:scale-95 ${
                          item.isVeg
                            ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 shadow-2xs font-extrabold hover:bg-emerald-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title={item.isVeg ? "Vegetarian Dish (Click to toggle Non-Veg)" : "Non-Veg (Click to toggle Veg)"}
                      >
                        <Leaf className={`w-3 h-3 ${item.isVeg ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                        <span>{item.isVeg ? 'VEG' : 'NON-VEG'}</span>
                      </button>

                      {/* Spicy Toggle Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleSpicyDirect(item)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer active:scale-95 ${
                          item.isSpicy
                            ? 'bg-red-50 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 shadow-2xs font-extrabold hover:bg-red-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title={item.isSpicy ? "Spicy Dish (Click to toggle Mild)" : "Mild Dish (Click to toggle Spicy)"}
                      >
                        <Flame className={`w-3 h-3 ${item.isSpicy ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                        <span>{item.isSpicy ? 'SPICY' : 'MILD'}</span>
                      </button>

                      {/* GF Toggle Badge */}
                      <button
                        type="button"
                        onClick={() => handleToggleGFDirect(item)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer active:scale-95 ${
                          item.isGlutenFree
                            ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-2xs font-extrabold hover:bg-amber-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title={item.isGlutenFree ? "Gluten-Free Certified (Click to toggle Contains Gluten)" : "Contains Gluten (Click to toggle GF)"}
                      >
                        <ShieldCheck className={`w-3 h-3 ${item.isGlutenFree ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                        <span>{item.isGlutenFree ? 'GF' : 'GLUTEN'}</span>
                      </button>

                      {item.preparationTime && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" /> {item.preparationTime}m
                        </span>
                      )}
                    </div>

                    {/* Recipe & Culinary Tags with Quick Add Button */}
                    <div className="mt-3 relative">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.tags && item.tags.map(tagName => {
                          const style = getTagStyle(tagName, allKnownTags);
                          return (
                            <span
                              key={tagName}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border ${style.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                              <span>{tagName}</span>
                              <button
                                type="button"
                                onClick={() => handleQuickRemoveTagFromDish(item, tagName)}
                                className="hover:opacity-80 p-0.5 cursor-pointer ml-0.5"
                                title={`Remove ${tagName}`}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          );
                        })}

                        {/* Quick Add Tag Button on Dish Card */}
                        <button
                          type="button"
                          onClick={() => setActiveQuickTagDishId(isTagDropdownOpen ? null : item.id)}
                          className="px-1.5 py-0.5 rounded-md text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 flex items-center gap-0.5 cursor-pointer"
                          title="Attach Tag to this dish"
                        >
                          <Plus className="w-2.5 h-2.5" /> Tag
                        </button>
                      </div>

                      {/* Quick Tag Popover on Card */}
                      {isTagDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl shadow-xl p-2.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                              Attach Tag to Dish:
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveQuickTagDishId(null)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                            {allKnownTags.filter(tag => tag && tag.name).map(tag => {
                              const isAlreadyAdded = item.tags && Array.isArray(item.tags) && item.tags.some(t => t && tag.name && t.toLowerCase() === tag.name.toLowerCase());
                              const style = getTagStyle(tag.name, allKnownTags);
                              return (
                                <button
                                  key={tag.id}
                                  type="button"
                                  onClick={() => {
                                    if (isAlreadyAdded) {
                                      handleQuickRemoveTagFromDish(item, tag.name);
                                    } else {
                                      handleQuickAddTagToDish(item, tag.name);
                                    }
                                  }}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                                    isAlreadyAdded
                                      ? `${style.badge} ring-1 ring-amber-400 font-extrabold`
                                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                  <span>{tag.name}</span>
                                  {isAlreadyAdded ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Plus className="w-2.5 h-2.5 text-slate-400" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
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
                              description: 'Only Admin/Owner can modify menu items, tags, prices, or COGS. Enter Admin Master PIN to authorize.',
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
      ) : (
        /* TABLE VIEW: Tabular Recipe & Menu Inventory */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Dish & Recipe</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Veg / Non-Veg</th>
                  <th className="py-3 px-4 text-center">Spicy</th>
                  <th className="py-3 px-4 text-center">Gluten-Free</th>
                  <th className="py-3 px-4">Culinary Tags</th>
                  <th className="py-3 px-4 text-right">Price</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredItems.map((item) => {
                  const margin = calculateMargin(item.price, item.costPrice);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Dish & Recipe Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-amber-500">
                                <ChefHat className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white leading-tight">{item.name}</div>
                            {item.preparationTime && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                <Clock className="w-2.5 h-2.5" /> {item.preparationTime} min prep
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[11px] font-semibold">
                          {item.category}
                        </span>
                      </td>

                      {/* 1-Click Interactive Veg Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleVegDirect(item)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                            item.isVeg
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-extrabold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                          title="Click to toggle Veg / Non-Veg"
                        >
                          <Leaf className={`w-3 h-3 ${item.isVeg ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                          <span>{item.isVeg ? 'VEG' : 'NON-VEG'}</span>
                        </button>
                      </td>

                      {/* 1-Click Interactive Spicy Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSpicyDirect(item)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                            item.isSpicy
                              ? 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-300 border-red-300 dark:border-red-700 font-extrabold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                          title="Click to toggle Spicy"
                        >
                          <Flame className={`w-3 h-3 ${item.isSpicy ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                          <span>{item.isSpicy ? 'SPICY' : 'MILD'}</span>
                        </button>
                      </td>

                      {/* 1-Click Interactive GF Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleGFDirect(item)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 border transition-all cursor-pointer ${
                            item.isGlutenFree
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-extrabold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                          title="Click to toggle Gluten-Free"
                        >
                          <ShieldCheck className={`w-3 h-3 ${item.isGlutenFree ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                          <span>{item.isGlutenFree ? 'GF' : 'GLUTEN'}</span>
                        </button>
                      </td>

                      {/* Tags */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap items-center gap-1 max-w-xs">
                          {item.tags && item.tags.map(tagName => {
                            const style = getTagStyle(tagName, allKnownTags);
                            return (
                              <span key={tagName} className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${style.badge}`}>
                                {tagName}
                              </span>
                            );
                          })}
                          {(!item.tags || item.tags.length === 0) && (
                            <span className="text-[10px] text-slate-400 italic">No tags</span>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.price, profile.currencySymbol)}
                      </td>

                      {/* Margin */}
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={`${
                          margin >= 70 ? 'text-emerald-700 dark:text-emerald-400' :
                          margin >= 55 ? 'text-amber-700 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {margin.toFixed(0)}%
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(item)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            item.isAvailable
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.isAvailable ? 'In Stock' : 'Sold Out'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (isAdmin) {
                                handleOpenEditModal(item);
                              } else {
                                setAdminAuthPrompt({
                                  isOpen: true,
                                  title: `Admin Authorization: Edit "${item.name}"`,
                                  description: 'Only Admin/Owner can modify menu items. Enter Admin Master PIN to authorize.',
                                  onSuccess: () => handleOpenEditModal(item),
                                });
                              }
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Edit Dish"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors"
                            title="Delete Dish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          <ChefHat className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No menu items found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Try adjusting your search query, category filter, or tag filter.
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

      {/* ================= MODAL 1: ADD / EDIT DISH MODAL WITH TAGS ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-slate-900 dark:text-white">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">
                  {editingItem ? 'Edit Dish & Margin' : 'Add New Restaurant Dish'}
                </h3>
                <p className="text-xs text-slate-400">Configure dish photo, tags, recipe ingredients, price & category</p>
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
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-lg">
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
                    <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-white dark:bg-slate-800 hover:bg-amber-50/20 dark:hover:bg-slate-700 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
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

              {/* Name and Category */}
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

              {/* ================= SECTION: CULINARY TAGS & BADGES ================= */}
              <div className="p-4 bg-amber-50/40 dark:bg-slate-800/80 border border-amber-200/80 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Culinary Tags & Recipe Badges</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsTagManagerOpen(true)}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Palette className="w-3 h-3" /> Manage Master Tags
                  </button>
                </div>

                {/* Active Selected Tags Display */}
                {selectedDishTags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    {selectedDishTags.map(tagName => {
                      const style = getTagStyle(tagName, allKnownTags);
                      return (
                        <span
                          key={tagName}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border shadow-2xs ${style.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          <span>{tagName}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleDishTag(tagName)}
                            className="hover:opacity-75 p-0.5 rounded-full cursor-pointer ml-0.5"
                            title={`Remove ${tagName}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    No tags selected yet. Click any tag below to assign to this dish:
                  </p>
                )}

                {/* Clickable Quick Tags Grid */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Available Tags (Click to Toggle):
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 max-h-28 overflow-y-auto p-1">
                    {allKnownTags.filter(tag => tag && tag.name).map(tag => {
                      const isAssigned = selectedDishTags.some(t => t && tag.name && t.toLowerCase() === tag.name.toLowerCase());
                      const style = getTagStyle(tag.name, allKnownTags);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleToggleDishTag(tag.name)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                            isAssigned
                              ? `${style.badge} ring-2 ring-amber-400 dark:ring-amber-500 shadow-xs font-black`
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          <span>{tag.name}</span>
                          {isAssigned && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inline Quick Add Tag */}
                {!isInlineAddingTag ? (
                  <button
                    type="button"
                    onClick={() => setIsInlineAddingTag(true)}
                    className="text-[11px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create & Attach New Tag
                  </button>
                ) : (
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-300 dark:border-amber-700 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Type new tag name (e.g. Wood-Fired, Vegan, Halal)..."
                        value={inlineNewTagName}
                        onChange={(e) => setInlineNewTagName(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none font-semibold text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddInlineTagSubmit()}
                        disabled={!inlineNewTagName.trim()}
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg cursor-pointer"
                      >
                        + Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInlineAddingTag(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Color selection pills for inline tag */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Color:</span>
                      {AVAILABLE_TAG_COLORS.slice(0, 6).map(c => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setInlineNewTagColor(c.color)}
                          className={`w-5 h-5 rounded-full ${c.bgSample} transition-transform ${
                            inlineNewTagColor === c.color ? 'ring-2 ring-slate-900 dark:ring-white scale-110' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                )}
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

              {/* Dietary Flags Selection Cards */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700 dark:text-slate-300">Dietary & Recipe Flags</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Veg Toggle Card */}
                  <button
                    type="button"
                    onClick={() => setIsVeg(!isVeg)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isVeg
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Leaf className={`w-4 h-4 ${isVeg ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-bold text-xs">Vegetarian</div>
                        <div className="text-[10px] opacity-75">{isVeg ? 'Pure Veg' : 'Non-Veg'}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isVeg ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      {isVeg ? '✓' : '✕'}
                    </div>
                  </button>

                  {/* Spicy Toggle Card */}
                  <button
                    type="button"
                    onClick={() => setIsSpicy(!isSpicy)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSpicy
                        ? 'bg-red-50 dark:bg-red-950/60 border-red-400 dark:border-red-700 text-red-950 dark:text-red-200 ring-1 ring-red-500'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Flame className={`w-4 h-4 ${isSpicy ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-bold text-xs">Spicy Dish</div>
                        <div className="text-[10px] opacity-75">{isSpicy ? 'Chili / Hot' : 'Mild'}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isSpicy ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      {isSpicy ? '✓' : '✕'}
                    </div>
                  </button>

                  {/* Gluten-Free Toggle Card */}
                  <button
                    type="button"
                    onClick={() => setIsGlutenFree(!isGlutenFree)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isGlutenFree
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 dark:border-amber-700 text-amber-950 dark:text-amber-200 ring-1 ring-amber-500'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`w-4 h-4 ${isGlutenFree ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} />
                      <div>
                        <div className="font-bold text-xs">Gluten-Free</div>
                        <div className="text-[10px] opacity-75">{isGlutenFree ? 'GF Safe' : 'Contains Gluten'}</div>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isGlutenFree ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                      {isGlutenFree ? '✓' : '✕'}
                    </div>
                  </button>
                </div>
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

      {/* ================= MODAL 2: MANAGE RECIPE & MENU TAGS MODAL ================= */}
      {isTagManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-white my-auto">
            <div className="px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Menu & Recipe Tags Manager</h3>
                  <p className="text-xs text-slate-400">Add, color-customize, edit, or delete culinary tags & dietary badges</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsTagManagerOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              
              {/* Create New Tag Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                  <Plus className="w-4 h-4 text-amber-500" />
                  <span>Create New Tag</span>
                </h4>

                {/* Quick Add Common Dietary & Recipe Tags Presets */}
                <div className="space-y-1.5 pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Quick-Add Common Tags:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { name: 'Pure Veg', color: 'emerald', desc: '100% Vegetarian certified' },
                      { name: 'Non-Veg', color: 'red', desc: 'Contains meat, poultry or seafood' },
                      { name: 'Spicy', color: 'red', desc: 'Spiced with chili peppers & seasonings' },
                      { name: 'Gluten-Free', color: 'amber', desc: 'Certified wheat & gluten-free' },
                      { name: 'Vegan', color: 'emerald', desc: '100% plant-based, no dairy or honey' },
                      { name: 'Jain Friendly', color: 'teal', desc: 'No root vegetables (onion, garlic, potato)' },
                      { name: 'Halal', color: 'cyan', desc: 'Prepared according to Halal culinary laws' },
                      { name: 'Keto Friendly', color: 'purple', desc: 'High fat, very low carb keto recipe' },
                      { name: 'Nut-Free', color: 'blue', desc: 'Safe for tree nut and peanut allergies' },
                      { name: "Chef's Special", color: 'amber', desc: 'Signature culinary creation' },
                      { name: 'Bestseller', color: 'rose', desc: 'Top ordered guest favorite' },
                      { name: 'Dairy-Free', color: 'indigo', desc: 'Zero milk, cream, cheese or butter' }
                    ].map(preset => {
                      const alreadyExists = allKnownTags.some(t => t && t.name && t.name.toLowerCase() === preset.name.toLowerCase());
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          disabled={alreadyExists}
                          onClick={() => {
                            if (!alreadyExists && onAddTag) {
                              onAddTag(preset.name, preset.color, preset.desc);
                            }
                          }}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            alreadyExists
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 opacity-60 cursor-default'
                              : 'bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-amber-400 active:scale-95'
                          }`}
                          title={alreadyExists ? `${preset.name} already in tag registry` : `Click to add ${preset.name} tag`}
                        >
                          <Plus className={`w-2.5 h-2.5 ${alreadyExists ? 'text-slate-400' : 'text-amber-500'}`} />
                          <span>{preset.name}</span>
                          {alreadyExists && <span className="text-[8px] text-emerald-600 font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleCreateNewTagSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Tag Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chef's Special, Kids Choice, Wood-Fired..."
                        value={newTagNameInput}
                        onChange={(e) => setNewTagNameInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Short Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Daily recommendation by Executive Chef"
                        value={newTagDescInput}
                        onChange={(e) => setNewTagDescInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Color Palette Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Tag Color Palette:
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {AVAILABLE_TAG_COLORS.map(c => {
                        const isSelected = newTagColorInput === c.color;
                        return (
                          <button
                            key={c.color}
                            type="button"
                            onClick={() => setNewTagColorInput(c.color)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                              isSelected
                                ? 'ring-2 ring-amber-500 ring-offset-1 bg-white dark:bg-slate-900 font-extrabold shadow-xs'
                                : 'opacity-80 hover:opacity-100 bg-slate-100 dark:bg-slate-800'
                            }`}
                          >
                            <span className={`w-3 h-3 rounded-full ${c.bgSample}`} />
                            <span className="capitalize">{c.color}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!newTagNameInput.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Create Tag
                    </button>
                  </div>
                </form>
              </div>

              {/* Tag Search & List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    Existing Tags ({allKnownTags.length})
                  </h4>
                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search tags..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto">
                  {filteredTagsInManager.map((tag) => {
                    const dishUsageCount = menuItems.filter(i => 
                      i.tags && Array.isArray(i.tags) && i.tags.some(t => t && tag.name && t.toLowerCase() === tag.name.toLowerCase())
                    ).length;

                    const isEditing = editingTag?.id === tag.id;
                    const style = getTagStyle(tag.name, allKnownTags);

                    return (
                      <div key={tag.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        {isEditing ? (
                          <form onSubmit={handleSaveEditTag} className="space-y-2.5 bg-amber-50/50 dark:bg-slate-800 p-2.5 rounded-lg border border-amber-300 dark:border-amber-700">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Tag Name</label>
                                <input
                                  type="text"
                                  autoFocus
                                  value={editTagNameValue}
                                  onChange={(e) => setEditTagNameValue(e.target.value)}
                                  className="w-full px-2.5 py-1 text-xs border border-amber-400 rounded-lg focus:outline-none font-semibold bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Description</label>
                                <input
                                  type="text"
                                  value={editTagDescValue}
                                  onChange={(e) => setEditTagDescValue(e.target.value)}
                                  className="w-full px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                              </div>
                            </div>

                            {/* Color Selector for Edit Mode */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1">Color Palette</label>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {AVAILABLE_TAG_COLORS.map(c => (
                                  <button
                                    key={c.color}
                                    type="button"
                                    onClick={() => setEditTagColorValue(c.color)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border ${
                                      editTagColorValue === c.color
                                        ? 'ring-2 ring-amber-500 bg-white dark:bg-slate-900 font-extrabold'
                                        : 'opacity-70 bg-slate-100 dark:bg-slate-800'
                                    }`}
                                  >
                                    <span className={`w-2.5 h-2.5 rounded-full ${c.bgSample}`} />
                                    <span className="capitalize">{c.color}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingTag(null)}
                                className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={!editTagNameValue.trim()}
                                className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Save Changes
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border shrink-0 ${style.badge}`}>
                                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                {tag.name}
                              </span>

                              {tag.description && (
                                <span className="text-slate-500 dark:text-slate-400 text-xs truncate max-w-xs sm:max-w-sm hidden sm:inline">
                                  {tag.description}
                                </span>
                              )}

                              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full font-mono shrink-0">
                                {dishUsageCount} {dishUsageCount === 1 ? 'dish' : 'dishes'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditTag(tag)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
                                title="Edit Tag & Color"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTagToDelete(tag)}
                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg cursor-pointer transition-colors"
                                title="Delete Tag"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredTagsInManager.length === 0 && (
                    <div className="p-6 text-center text-slate-400">
                      No tags matched your search.
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsTagManagerOpen(false)}
                  className="px-5 py-2 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: MANAGE CATEGORIES MODAL ================= */}
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
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-900 dark:focus:ring-amber-500 focus:outline-none font-semibold text-slate-900 dark:text-white"
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
                          <FolderPlus className="w-3.5 h-3.5 text-amber-500" />
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

      {/* ================= MODAL 4: DELETE TAG CONFIRMATION ================= */}
      {tagToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto">
                <Tag className="w-6 h-6" />
              </div>

              <div className="text-center">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Culinary Tag?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Are you sure you want to delete tag <strong className="text-slate-900 dark:text-white">"{tagToDelete.name}"</strong>?
                </p>

                {(() => {
                  const affectedCount = tagToDelete && tagToDelete.name ? menuItems.filter(i => 
                    i.tags && Array.isArray(i.tags) && i.tags.some(t => t && t.toLowerCase() === tagToDelete.name.toLowerCase())
                  ).length : 0;

                  return (
                    <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-800 text-left text-xs">
                      <p className="text-red-900 dark:text-red-300 font-medium">
                        This tag is currently assigned to <strong>{affectedCount}</strong> dish(es). Deleting it will automatically detach this tag from all dishes.
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTagToDelete(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-delete-tag"
                  type="button"
                  onClick={handleConfirmDeleteTag}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95"
                >
                  Yes, Delete Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: DELETE MENU DISH CONFIRMATION ================= */}
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

      {/* ================= MODAL 6: DELETE CATEGORY CONFIRMATION ================= */}
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
