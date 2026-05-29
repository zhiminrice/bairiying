import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Award,
  Heart,
  Quote,
  Image,
  User,
  RefreshCw,
} from 'lucide-react';
import { witnessesApi } from '../../api/admin';
import Loading from '../../components/common/Loading';

const GRADIENT_BG = [
  'from-rose-50 to-amber-50',
  'from-sky-50 to-teal-50',
  'from-violet-50 to-pink-50',
  'from-emerald-50 to-cyan-50',
  'from-orange-50 to-yellow-50',
  'from-indigo-50 to-purple-50',
  'from-fuchsia-50 to-rose-50',
  'from-amber-50 to-lime-50',
];

const ACCENT_COLORS = [
  'text-rose-500 bg-rose-100',
  'text-sky-500 bg-sky-100',
  'text-violet-500 bg-violet-100',
  'text-emerald-500 bg-emerald-100',
  'text-orange-500 bg-orange-100',
  'text-indigo-500 bg-indigo-100',
  'text-fuchsia-500 bg-fuchsia-100',
  'text-amber-500 bg-amber-100',
];

export default function WitnessWall() {
  const [witnesses, setWitnesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await witnessesApi.published();
      const data = res.data?.data || res.data || [];
      setWitnesses(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || '加载见证墙失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center px-4">
          <Heart className="w-12 h-12 text-brand-muted mx-auto mb-4" />
          <p className="text-brand-danger text-sm mb-3">{error}</p>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-sm text-brand-accent hover:underline"
          >
            <RefreshCw className="w-4 h-4" />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-4">
          <Award className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          见证墙
        </h1>
        <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto leading-relaxed">
          每一个闪光时刻，都值得被看见。这里记录着百日营学员们的成长瞬间。
        </p>
        {witnesses.length > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            共 {witnesses.length} 条见证
          </p>
        )}
      </div>

      {/* Empty State */}
      {witnesses.length === 0 && (
        <div className="max-w-md mx-auto px-4 pb-20 text-center">
          <div className="bg-white/80 backdrop-blur rounded-2xl p-10 shadow-sm border border-amber-100">
            <Quote className="w-10 h-10 text-amber-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm leading-relaxed">
              还没有见证墙内容。美好的瞬间正在路上...
            </p>
          </div>
        </div>
      )}

      {/* Witness Cards Grid */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {witnesses.map((w, idx) => {
            const bgGradient = GRADIENT_BG[idx % GRADIENT_BG.length];
            const accent = ACCENT_COLORS[idx % ACCENT_COLORS.length];
            const displayName = w.anonymous ? '匿名' : w.student_name || `学员${w.student_id}`;

            return (
              <div
                key={w.id}
                className={`break-inside-avoid bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300`}
              >
                {/* Color accent top bar */}
                <div className={`h-1.5 bg-gradient-to-r ${bgGradient}`} />

                <div className="p-5">
                  {/* Quote icon */}
                  <div className="mb-3">
                    <Quote className="w-5 h-5 text-amber-300" />
                  </div>

                  {/* Content */}
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-4">
                    &ldquo;{w.content}&rdquo;
                  </p>

                  {/* Image (if any) */}
                  {w.image_url && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                      <img
                        src={w.image_url}
                        alt="见证配图"
                        className="w-full object-cover max-h-64"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${accent} flex items-center justify-center`}>
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {displayName}
                      </span>
                    </div>
                    {w.published_at && (
                      <span className="text-xs text-gray-400">
                        {w.published_at}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-12">
        <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
          <Heart className="w-3.5 h-3.5 text-rose-300" />
          百日营学员管理系统 · 见证每一个闪光时刻
        </div>
      </div>
    </div>
  );
}
