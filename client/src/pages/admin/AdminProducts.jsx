import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Upload, Image, X, Loader2 } from 'lucide-react';

const EMPTY_FORM = {
  name_en: '',
  name_ar: '',
  description_en: '',
  description_ar: '',
  category_id: '',
  price: '',
  main_image_url: '',
  images: [],
};

export default function AdminProducts() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const isAr = i18n.language === 'ar';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingList, setUploadingList] = useState(false);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => api.get('/products?limit=100').then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (body) =>
      editingId
        ? api.put(`/products/${editingId}`, body)
        : api.post('/products', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('messages.saved'));
      closeModal();
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || t('common.error'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      toast.success(t('messages.deleted'));
    },
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product.id);
    setForm({
      name_en: product.name_en,
      name_ar: product.name_ar,
      description_en: product.description_en || '',
      description_ar: product.description_ar || '',
      category_id: product.category_id || '',
      price: product.price,
      main_image_url: product.main_image_url,
      images: product.images ? product.images.map((img) => img.url) : [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  // Upload main image to Cloudinary via backend
  const handleMainImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMain(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({ ...f, main_image_url: res.data.url }));
      toast.success(isAr ? 'تم رفع الصورة بنجاح' : 'Image uploaded to Cloudinary');
    } catch (err) {
      toast.error(isAr ? 'فشل رفع الصورة' : 'Upload failed');
    } finally {
      setUploadingMain(false);
    }
  };

  // Upload list images to Cloudinary via backend
  const handleMultipleImagesUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingList(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await api.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm((f) => ({
        ...f,
        images: [...f.images, ...(res.data.urls || [])],
      }));
      toast.success(isAr ? 'تم رفع الصور الإضافية بنجاح' : 'Additional images uploaded');
    } catch {
      toast.error(isAr ? 'فشل رفع الصور' : 'Upload failed');
    } finally {
      setUploadingList(false);
    }
  };

  const removeListImage = (idx) => {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.main_image_url) {
      toast.error(isAr ? 'الصورة الرئيسية مطلوبة' : 'Main image is required');
      return;
    }

    saveMutation.mutate({
      ...form,
      price: parseFloat(form.price),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.products')}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {isAr ? 'إدارة وتحديث كتالوج معدات الصيد والأسعار' : 'Add, edit, or remove fishing equipment and inventory'}
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

      {/* Products Table */}
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
                  <th className="py-3 px-4 text-start">Image</th>
                  <th className="py-3 px-4 text-start">{t('admin.nameEn')}</th>
                  <th className="py-3 px-4 text-start">{t('admin.nameAr')}</th>
                  <th className="py-3 px-4 text-start">{t('products.category')}</th>
                  <th className="py-3 px-4 text-start">{t('products.price')}</th>
                  <th className="py-3 px-4 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:border-gray-800">
                {productsData?.products?.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                    <td className="py-3 px-4">
                      <img
                        src={prod.main_image_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=100';
                        }}
                      />
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">
                      {prod.name_en}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100" dir="rtl">
                      {prod.name_ar}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {isAr ? prod.category_name_ar : prod.category_name_en || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400">
                      {Number(prod.price).toFixed(2)} {t('common.egp')}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 text-gray-600 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-300"
                          title={t('admin.edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(isAr ? 'هل أنت متأكد من حذف هذا المنتج؟' : 'Are you sure you want to delete this product?')) {
                              deleteMutation.mutate(prod.id);
                            }
                          }}
                          className="p-1.5 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
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

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold">
                {editingId ? t('admin.edit') : t('admin.add')}
              </h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('admin.nameEn')}</label>
                  <input
                    type="text"
                    required
                    value={form.name_en}
                    onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
                    className="input"
                    placeholder="e.g. Carbon Fiber Spinning Rod"
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
                    placeholder="مثال: صنارة صيد كاربون فايبر"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('admin.price')}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="input"
                    placeholder="250.00"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">{t('products.category')}</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="input"
                  >
                    <option value="">— {isAr ? 'بدون فئة' : 'None'} —</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {isAr ? c.name_ar : c.name_en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">{t('admin.descriptionEn')}</label>
                  <textarea
                    rows={3}
                    value={form.description_en}
                    onChange={(e) => setForm((f) => ({ ...f, description_en: e.target.value }))}
                    className="input resize-none"
                    placeholder="Detailed specifications in English..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">{t('admin.descriptionAr')}</label>
                  <textarea
                    rows={3}
                    dir="rtl"
                    value={form.description_ar}
                    onChange={(e) => setForm((f) => ({ ...f, description_ar: e.target.value }))}
                    className="input resize-none"
                    placeholder="المواصفات الفنية بالعربية..."
                  />
                </div>
              </div>

              {/* Main Image Upload via Cloudinary */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold">{t('admin.mainImage')}</label>
                  <label className="btn-secondary text-[11px] py-1 px-2.5 cursor-pointer inline-flex items-center gap-1.5">
                    {uploadingMain ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingMain ? t('admin.uploading') : t('admin.uploadImage')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      disabled={uploadingMain}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="text"
                  required
                  value={form.main_image_url}
                  onChange={(e) => setForm((f) => ({ ...f, main_image_url: e.target.value }))}
                  className="input text-xs"
                  placeholder="https://res.cloudinary.com/... or upload image above"
                />

                {form.main_image_url && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white">
                    <img
                      src={form.main_image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Additional Images Upload via Cloudinary */}
              <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold">{t('admin.additionalImages')}</label>
                  <label className="btn-secondary text-[11px] py-1 px-2.5 cursor-pointer inline-flex items-center gap-1.5">
                    {uploadingList ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>{uploadingList ? t('admin.uploading') : t('admin.uploadImage')}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleMultipleImagesUpload}
                      disabled={uploadingList}
                      className="hidden"
                    />
                  </label>
                </div>

                {form.images?.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {form.images.map((img, i) => (
                      <div
                        key={i}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeListImage(i)}
                          className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full p-0.5 opacity-90 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button type="button" onClick={closeModal} className="btn-secondary text-xs">
                  {t('admin.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending || uploadingMain || uploadingList}
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
