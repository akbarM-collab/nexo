import React, { useState, useMemo } from 'react';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Category, CategoryKind } from '../../types';

export const CategoriesView: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory } = useFinancial();

  const [activeKind, setActiveKind] = useState<CategoryKind>('expense');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('Tags');

  const parentCategories = useMemo(() => {
    return categories.filter((c) => c.kind === activeKind && c.parentId === null);
  }, [categories, activeKind]);

  const openAddModal = (presetParentId?: string) => {
    setEditingCat(null);
    setName('');
    setParentId(presetParentId || '');
    setColor('#3b82f6');
    setIcon('Tags');
    setIsAddModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setParentId(cat.parentId || '');
    setColor(cat.color || '#3b82f6');
    setIcon(cat.icon || 'Tags');
    setIsAddModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCat) {
      updateCategory(editingCat.id, {
        name: name.trim(),
        parentId: parentId || null,
        color,
        icon,
      });
    } else {
      addCategory({
        name: name.trim(),
        kind: activeKind,
        parentId: parentId || null,
        color,
        icon,
        enabled: true,
        order: categories.length,
      });
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Categories</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Organize transactions and budgets with parent and sub-categories.
          </p>
        </div>

        <button
          onClick={() => openAddModal()}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-xs self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>New Category</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-neutral-900/50 p-1 border border-neutral-800 max-w-fit">
        <button
          onClick={() => setActiveKind('expense')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            activeKind === 'expense'
              ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Expense Categories
        </button>
        <button
          onClick={() => setActiveKind('income')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            activeKind === 'income'
              ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Income Categories
        </button>
      </div>

      {/* Categories Tree list */}
      <div className="space-y-3">
        {parentCategories.map((parent) => {
          const children = categories.filter((c) => c.parentId === parent.id);

          return (
            <div
              key={parent.id}
              className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-3 hover:border-neutral-700 transition-colors"
            >
              {/* Parent Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: parent.color || '#3b82f6' }}
                  />
                  <div>
                    <h3 className="text-xs font-bold text-neutral-100">{parent.name}</h3>
                    <p className="text-[10px] text-neutral-500">
                      {children.length} sub-categories
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openAddModal(parent.id)}
                    className="flex items-center gap-1 rounded-lg border border-neutral-800 px-2 py-1 text-[11px] text-neutral-300 hover:bg-neutral-800 transition-colors"
                    title="Add sub-category"
                  >
                    <Plus className="size-3" /> Sub-category
                  </button>
                  <button
                    onClick={() => openEditModal(parent)}
                    className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${parent.name}" and its subcategories?`)) deleteCategory(parent.id);
                    }}
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-categories List */}
              {children.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-2 border-t border-neutral-800/60">
                  {children.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-800/60 bg-neutral-950/40 px-3 py-2 text-xs hover:border-neutral-700 transition-colors"
                    >
                      <span className="text-neutral-300 font-medium truncate">{child.name}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => openEditModal(child)}
                          className="p-0.5 text-neutral-500 hover:text-neutral-300"
                        >
                          <Edit2 className="size-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete subcategory "${child.name}"?`)) deleteCategory(child.id);
                          }}
                          className="p-0.5 text-neutral-500 hover:text-rose-400"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add / Edit Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-neutral-800 px-5 py-4 bg-neutral-950/60">
              <h2 className="text-sm font-semibold text-neutral-100">
                {editingCat ? 'Edit Category' : 'New Category'}
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dining Out, Software, Bonus..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-600 focus:border-neutral-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Parent Category <span className="text-neutral-500">(Leave empty for top-level)</span>
                </label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 focus:border-neutral-600 focus:outline-none"
                >
                  <option value="">None (Top-level Category)</option>
                  {parentCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Color Theme</label>
                <div className="flex items-center gap-2">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setColor(col)}
                      className={`size-6 rounded-full transition-transform ${
                        color === col ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-neutral-800 px-4 py-2 text-xs font-medium text-neutral-300 hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-4 py-2 text-xs font-semibold text-neutral-950 hover:bg-white active:translate-y-px transition-all shadow-sm"
                >
                  <Check className="size-3.5" /> Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
