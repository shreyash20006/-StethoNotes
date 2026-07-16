import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToastStore } from '../../store/useToastStore';
import { COURSE_CATEGORIES, CourseIcon } from '../icons/CourseIcons';
import { Settings, Save, Loader2 } from 'lucide-react';

export default function SiteContentManager() {
  const { addToast } = useToastStore();
  const [heroEnabled, setHeroEnabled] = useState(true);
  const [mobileLightweight, setMobileLightweight] = useState(true);
  const [stats, setStats] = useState({ notes: 500, students: 12000, sellers: 150, courses: 7 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: heroData } = await supabase.from('settings').select('value').eq('key', 'hero_animation').single();
      const { data: statsData } = await supabase.from('settings').select('value').eq('key', 'landing_stats').single();
      if (heroData?.value) {
        setHeroEnabled(heroData.value.enabled ?? true);
        setMobileLightweight(heroData.value.mobile_lightweight ?? true);
      }
      if (statsData?.value) setStats(statsData.value);
    };
    load();
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await supabase.from('settings').upsert([
        { key: 'hero_animation', value: { enabled: heroEnabled, mobile_lightweight: mobileLightweight } },
        { key: 'landing_stats', value: stats },
      ]);
      addToast('success', 'Saved', 'Site content settings updated.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          Site Content Manager
        </h2>
        <p className="text-slate-400 text-xs mt-1">Manage hero animation, course icons, and landing page content</p>
      </div>

      {/* Hero Animation Settings */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-sm">Hero 3D Animation</h3>
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input type="checkbox" checked={heroEnabled} onChange={(e) => setHeroEnabled(e.target.checked)} className="rounded" />
          Enable 3D hero animation on desktop
        </label>
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input type="checkbox" checked={mobileLightweight} onChange={(e) => setMobileLightweight(e.target.checked)} className="rounded" />
          Use lightweight animation on mobile
        </label>
      </div>

      {/* Landing Stats */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-sm">Animated Counters</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(stats).map(([key, val]) => (
            <div key={key}>
              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">{key}</label>
              <input
                type="number"
                value={val}
                onChange={(e) => setStats(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:border-cyan-500 outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Course Icons Preview */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-sm">Course Icons Preview</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {COURSE_CATEGORIES.map(cat => (
            <div key={cat.id} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16">
                <CourseIcon name={cat.name} size={56} />
              </div>
              <span className="text-[10px] text-slate-400 text-center">{cat.name}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-500">Premium SVG icons are automatically used across the landing page and courses catalog.</p>
      </div>

      <button
        onClick={saveSettings}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl disabled:opacity-50 transition-colors"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  );
}
