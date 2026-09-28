import React, { useState } from 'react';
import { 
  X, 
  Crown, 
  Sparkles, 
  Truck, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  UtensilsCrossed, 
  ShieldCheck, 
  ShoppingBag 
} from 'lucide-react';
import { Language, CartItem } from '../types';

interface UrgeBuyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: () => void;
  onProceedAlaCarte: () => void;
  language: Language;
  pendingItemTitle?: string;
}

export const UrgeBuyPlanModal: React.FC<UrgeBuyPlanModalProps> = ({
  isOpen,
  onClose,
  onSelectPlan,
  onProceedAlaCarte,
  language,
  pendingItemTitle,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const isEn = language === 'en';

  if (!isOpen) return null;

  const handleProceed = () => {
    if (dontShowAgain) {
      try {
        sessionStorage.setItem('chillhealthy_dismiss_urge_plan', 'true');
      } catch {
        // ignore
      }
    }
    onProceedAlaCarte();
  };

  const handleChoosePlan = () => {
    if (dontShowAgain) {
      try {
        sessionStorage.setItem('chillhealthy_dismiss_urge_plan', 'true');
      } catch {
        // ignore
      }
    }
    onSelectPlan();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-amber-400/80 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Header */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 p-5 sm:p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-100 text-xs font-black uppercase tracking-wider mb-2 border border-white/30">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>{isEn ? 'Member Smart Recommendation' : '会员专属省钱建议'}</span>
          </div>

          <h3 className="font-heading text-xl sm:text-2xl font-black tracking-tight text-white">
            {isEn
              ? 'Urge to Buy a Meal Plan First!'
              : '强烈推荐：先选购健康餐配套更超值！'}
          </h3>
          <p className="text-xs sm:text-sm text-amber-100 mt-1 leading-relaxed">
            {isEn
              ? 'Before ordering single Ala Carte boxes, consider a CHILL Healthy Meal Plan to save up to RM120+ with 100% Free Klang Valley Delivery!'
              : '在单点单个餐盒前，强烈建议您升级选购周期配套，立省高达 RM120+ 并享受巴生谷全境免费送达！'}
          </p>

          {pendingItemTitle && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-950/30 backdrop-blur-sm text-xs text-white border border-white/20">
              <ShoppingBag className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="truncate max-w-[280px]">
                {isEn ? `You selected: ${pendingItemTitle}` : `您正在单点：${pendingItemTitle}`}
              </span>
            </div>
          )}
        </div>

        {/* Content Body: Plan vs Ala Carte Comparison */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Left: Ala Carte Limitations */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 mb-2">
                  <UtensilsCrossed className="w-4 h-4 text-stone-500" />
                  <span>{isEn ? 'Single Ala Carte Order' : '单次单点外卖'}</span>
                </div>
                <div className="space-y-2 text-xs text-stone-600">
                  <div className="flex items-start gap-1.5">
                    <span className="text-stone-400 font-bold shrink-0">•</span>
                    <span>{isEn ? 'RM16.90 – RM24.90 per bento' : '每份 RM16.90 – RM24.90 原价'}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-rose-700">
                    <span className="font-bold shrink-0">✕</span>
                    <span>{isEn ? 'Delivery fee: RM15 (<RM100)' : '未满 RM100 需付每趟 RM15 运费'}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-stone-500">
                    <span className="font-bold shrink-0">✕</span>
                    <span>{isEn ? 'No flexible 30-day rescheduling' : '无法享受30天灵活顺延'}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-stone-500">
                    <span className="font-bold shrink-0">✕</span>
                    <span>{isEn ? 'VIP Calorie Matcher locked' : '热量规划工具专属功能锁定'}</span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-stone-500 font-medium block mt-3 pt-2 border-t border-stone-200">
                {isEn ? 'Good for one-time tryouts' : '适合单次尝鲜'}
              </span>
            </div>

            {/* Right: Meal Plan Perks (Highlighted) */}
            <div className="p-4 rounded-2xl bg-emerald-50/90 border-2 border-emerald-500/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 font-black text-[9px] px-2 py-0.5 rounded-bl-lg shadow-xs uppercase">
                ★ {isEn ? 'Best Value' : '超值首选'}
              </span>
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 mb-2">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>{isEn ? 'CHILL Meal Plans (1–6 Pax)' : '周期健康餐配套 (1-6人)'}</span>
                </div>
                <div className="space-y-2 text-xs text-emerald-950">
                  <div className="flex items-start gap-1.5 font-bold text-emerald-800">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isEn ? 'From RM19.90/meal (Save RM120+)' : '低至 RM19.90/餐（立省超RM120）'}</span>
                  </div>
                  <div className="flex items-start gap-1.5 font-bold text-emerald-800">
                    <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isEn ? '100% FREE Delivery across Klang Valley' : '包含巴生谷全境免费送达（免运）'}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{isEn ? '30 Days Flexible: Pause anytime' : '30天弹性享用，出差忙碌随时顺延'}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{isEn ? 'VIP Calorie Matcher fully unlocked' : '尊享会员热量规划测算工具'}</span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] text-emerald-700 font-extrabold block mt-3 pt-2 border-t border-emerald-200">
                {isEn ? 'From only RM398 per package' : '整套仅 RM398 起 · 全包无附加费'}
              </span>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-[11px] leading-relaxed">
              {isEn
                ? 'We highly encourage getting a meal plan for maximum health results & savings. However, you can still proceed to order ala carte below!'
                : '我们非常建议您选择周期配套以达到最佳健康效果与省钱效益；当然，您也可以随时直接单点今日轻食！'}
            </p>
          </div>

          {/* Checkbox: Remember decision */}
          <label className="flex items-center gap-2 text-xs text-stone-500 cursor-pointer pt-1 select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
            <span>{isEn ? "Don't show this comparison again during this session" : '本次访问记住我的选择，不再弹出此提醒'}</span>
          </label>
        </div>

        {/* Modal Action Buttons: Urge on buying plan, but ALWAYS allow ordering ala carte too! */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Secondary: Allow customer to order ala carte */}
          <button
            onClick={handleProceed}
            className="w-full sm:w-auto order-2 sm:order-1 px-4 py-3 rounded-2xl bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs sm:text-sm border border-stone-300 transition-all cursor-pointer shadow-xs text-center flex items-center justify-center gap-1.5"
          >
            <span>{isEn ? 'Continue to Order Ala Carte' : '仍继续单点餐品 (Ala Carte)'}</span>
          </button>

          {/* Primary: Urge to buy a plan */}
          <button
            onClick={handleChoosePlan}
            className="w-full sm:w-auto order-1 sm:order-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-emerald-700 hover:from-amber-400 hover:to-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-98"
          >
            <Crown className="w-4 h-4 text-amber-200" />
            <span>{isEn ? 'Upgrade to a Meal Plan (From RM398)' : '👑 升级选购超值健康餐配套 (RM398起)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
