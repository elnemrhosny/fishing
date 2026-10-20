import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api.js';
import toast from 'react-hot-toast';
import { Save, Eye, FileText } from 'lucide-react';

export default function AdminAbout() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const isAr = i18n.language === 'ar';

  const [form, setForm] = useState({ content_en: '', content_ar: '' });
  const [previewTab, setPreviewTab] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['page', 'about'],
    queryFn: () => api.get('/pages/about').then((r) => r.data),
  });

  useEffect(() => {
    if (data) {
      setForm({
        content_en: data.content_en || '',
        content_ar: data.content_ar || '',
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => api.put('/pages/about', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['page', 'about'] });
      toast.success(t('messages.saved'));
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || t('common.error'));
    },
  });

  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="animate-spin w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('about.edit')}</h1>
          <p className="text-xs text-gray-500 mt-1">
            {isAr
              ? 'تعديل محتوى صفحة من نحن باللغتين الإنجليزية والعربية (يدعم تنسيق HTML)'
              : 'Customize the About Us page in English and Arabic (HTML formatting supported)'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewTab(!previewTab)}
            className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>{previewTab ? (isAr ? 'تعديل' : 'Editor') : (isAr ? 'معاينة' : 'Preview')}</span>
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saveMutation.isPending ? t('common.loading') : t('admin.save')}</span>
          </button>
        </div>
      </div>

      {previewTab ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              English Preview
            </span>
            <div
              className="prose dark:prose-invert max-w-none text-xs sm:text-sm"
              dangerouslySetInnerHTML={{ __html: form.content_en }}
            />
          </div>

          <div className="card p-6 space-y-3" dir="rtl">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              معاينة بالعربية
            </span>
            <div
              className="prose dark:prose-invert max-w-none text-xs sm:text-sm"
              dangerouslySetInnerHTML={{ __html: form.content_ar }}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* English Editor */}
          <div className="card p-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              English Content (HTML)
            </label>
            <textarea
              rows={16}
              value={form.content_en}
              onChange={(e) => setForm((f) => ({ ...f, content_en: e.target.value }))}
              className="input font-mono text-xs leading-relaxed"
              placeholder="<h2>Our Story</h2><p>Founded in 2024 by passionate fishermen...</p>"
            />
          </div>

          {/* Arabic Editor */}
          <div className="card p-5 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              المحتوى العربي (HTML)
            </label>
            <textarea
              rows={16}
              dir="rtl"
              value={form.content_ar}
              onChange={(e) => setForm((f) => ({ ...f, content_ar: e.target.value }))}
              className="input font-mono text-xs leading-relaxed"
              placeholder="<h2>قصتنا</h2><p>تأسس متجرنا عام 2024 بواسطة صيادين محترفين...</p>"
            />
          </div>
        </div>
      )}
    </div>
  );
}
