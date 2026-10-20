import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

const EMPTY = { name_en: '', name_ar: '', slug: '' };

export default function AdminCategories() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const isAr = i18n.language === 'ar';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body) =>
      editingId
        ? api.put(`/categories/${editingId}`, body)
        : api.post('/categories', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('messages.saved'));
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success(t('messages.deleted'));
    },
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY);
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingId(cat.id);
    setForm({
      name_en: cat.name_en,
      name_ar: cat.name_ar,
      slug: cat.slug,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.categories')}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {isAr ? 'تصنيفات المعدات والفئات الرئيسية' : 'Organize fishing gear into categories'}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.add')}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="py-3 px-4 text-start">{t('admin.nameEn')}</th>
                  <th className="py-3 px-4 text-start">{t('admin.nameAr')}</th>
                  <th className="py-3 px-4 text-start">Slug</th>
                  <th className="py-3 px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:border-gray-800">
                {categories?.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                      {cat.name_en}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100" dir="rtl">
                      {cat.name_ar}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400">
                      {cat.slug}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(cat)}
                          className="p-1.5 text-gray-600 hover:text-brand-600 dark:text-gray-400"
                          title={t('admin.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذه الفئة؟' : 'Are you sure you want to delete this category?')) {
                              deleteMutation.mutate(cat.id);
                            }
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-600 dark:text-gray-400"
                          title={t('admin.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-bold">
                {editingId ? t('admin.edit') : t('admin.add')}
              </h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">{t('admin.nameEn')}</label>
                <input
                  type="text"
                  required
                  value={form.name_en}
                  onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                  className="input"
                  placeholder="e.g. Fishing Rods"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">{t('admin.nameAr')}</label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  value={form.name_ar}
                  onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                  className="input"
                  placeholder="مثال: صنارات الصيد"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Slug</label>
                <input
                  type="text"
                  required
                  pattern="^[a-z0-9-]+$"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="input font-mono"
                  placeholder="fishing-rods"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={closeModal} className="btn-secondary text-xs">
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary text-xs"
                >
                  {saveMutation.isPending ? t('common.loading') : t('admin.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
