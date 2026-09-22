import React from 'react';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, MessageCircle } from 'lucide-react';
import { CartItem, Language } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  language: Language;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  onBrowsePlans?: () => void;
  onTogglePlanUpsize?: (cartItemId: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  language,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  onBrowsePlans,
  onTogglePlanUpsize,
}) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasPlan = cart.some((item) => item.type === 'plan' || Boolean(item.planDetails));
  const deliveryFee = hasPlan || subtotal >= 100 || subtotal === 0 ? 0 : 15.0;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
              <h3 className="font-heading text-lg font-bold text-stone-900">
                {language === 'en' ? 'Your Meal Box Basket' : '您的潮轻食餐篮'}
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cart List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-stone-100">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 text-base">
                    {language === 'en' ? 'Your basket is empty' : '餐篮空空如也'}
                  </h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto mt-1">
                    {language === 'en'
                      ? 'Explore our freshly cooked bentos or subscribe to healthy meal plans (1 to 6 persons) with free delivery!'
                      : '挑选招牌低卡餐盒，或选购 1 至 6 人健康餐配套，尊享全马巴生谷免费送达！'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onBrowsePlans) onBrowsePlans();
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Browse More Meal Plans (From RM398)' : '浏览更多健康餐配套 (RM398起)'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.cartItemId} className="pt-4 first:pt-0 flex gap-3">
                    <img
                      src={item.image}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                      }}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                          {item.title}
                        </h4>
                        <button
                          onClick={() => onRemoveItem(item.cartItemId)}
                          className="text-stone-400 hover:text-red-500 p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Custom details / notes */}
                      {item.substitutions && (
                        <div className="text-[11px] text-stone-500 mt-0.5 space-x-1">
                          {item.substitutions.lowCarbBase && (
                            <span className="text-emerald-700 font-medium">Cauliflower Rice</span>
                          )}
                          {item.substitutions.extraProtein && (
                            <span className="text-amber-700 font-medium">+Extra Protein</span>
                          )}
                        </div>
                      )}

                      {item.planDetails && (
                        <div className="space-y-1.5 mt-1">
                          <div className="text-[11px] text-stone-500">
                            {item.planDetails.days} Days · {item.planDetails.mealsTotal} Meals total
                          </div>

                          {/* Interactive Upsize Option for this Specific Plan */}
                          {onTogglePlanUpsize && (() => {
                            const mealsTotal = item.planDetails.mealsTotal || 10;
                            const upsizeCost = item.planDetails.upsizeCost || mealsTotal * 5;
                            const isUpsized = Boolean(item.planDetails.isUpsized);

                            return (
                              <div className="pt-0.5">
                                {isUpsized ? (
                                  <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-850">
                                      <span className="text-xs">⚡</span>
                                      <span>
                                        {language === 'en'
                                          ? `Upsized (+RM ${upsizeCost.toFixed(2)} for ${mealsTotal} meals · +80g Protein)`
                                          : `已升级大份量 (+RM ${upsizeCost.toFixed(2)} / ${mealsTotal} 餐 · +80g 肉量时蔬)`}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onTogglePlanUpsize(item.cartItemId)}
                                      className="text-[10px] text-stone-500 hover:text-red-600 underline font-medium cursor-pointer shrink-0"
                                    >
                                      {language === 'en' ? 'Remove' : '取消'}
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onTogglePlanUpsize(item.cartItemId)}
                                    className="w-full flex items-center justify-between p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] text-amber-950 font-bold transition-all cursor-pointer"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs">⚡</span>
                                      <span>
                                        {language === 'en'
                                          ? `Add Upsize (+RM ${upsizeCost.toFixed(2)} for ${mealsTotal} Meals)`
                                          : `升级大份量 (+RM ${upsizeCost.toFixed(2)} / ${mealsTotal} 餐)`}
                                      </span>
                                    </div>
                                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded-md font-extrabold">
                                      +80g Protein
                                    </span>
                                  </button>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-[10px] text-stone-400 italic truncate mt-0.5">
                          Note: {item.notes}
                        </p>
                      )}

                      {/* Price and Quantity row */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-xs sm:text-sm text-stone-900">
                          RM {(item.price * item.quantity).toFixed(2)}
                        </span>

                        <div className="flex items-center border border-stone-200 rounded-lg bg-stone-50">
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                            className="px-2 py-0.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-stone-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                            className="px-2 py-0.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Plan-specific Upsize Suggestion Box */}
                {(() => {
                  const planItems = cart.filter((i) => i.type === 'plan' || Boolean(i.planDetails));
                  const nonUpsizedPlans = planItems.filter((i) => !i.planDetails?.isUpsized);

                  // Case 1: There are meal plans in cart that are NOT upsized yet
                  if (nonUpsizedPlans.length > 0) {
                    const targetPlan = nonUpsizedPlans[0];
                    const mealsTotal = targetPlan.planDetails?.mealsTotal || 10;
                    const upsizeCost = targetPlan.planDetails?.upsizeCost || mealsTotal * 5;

                    return (
                      <div className="pt-4 border-t border-amber-200/80">
                        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">⚡</span>
                              <h5 className="font-bold text-xs text-amber-950">
                                {language === 'en'
                                  ? `Suggest Upsize Portion (+RM ${upsizeCost.toFixed(2)} for ${mealsTotal} Meals Plan)`
                                  : `推荐升级大份量 (+RM ${upsizeCost.toFixed(2)} / ${mealsTotal} 餐配套)`}
                              </h5>
                            </div>
                            <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                              +80g Protein
                            </span>
                          </div>

                          <p className="text-[11px] text-amber-900/85 leading-relaxed">
                            {language === 'en'
                              ? `Need more protein or higher satiety? Upsize all ${mealsTotal} meals in ${targetPlan.title} with +80g extra lean grilled chicken/salmon & garden greens (only RM 5.00/meal upgrade)!`
                              : `增肌减脂或食量较大？为【${targetPlan.title}】的全部 ${mealsTotal} 餐升级大份量，每餐加码 +80g 优质低脂肉类及双倍纤维时蔬（每餐仅 RM 5.00），饱腹感倍增！`}
                          </p>

                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            {onTogglePlanUpsize && (
                              <button
                                type="button"
                                onClick={() => onTogglePlanUpsize(targetPlan.cartItemId)}
                                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>
                                  {language === 'en'
                                    ? `Add Upsize Portion (+RM ${upsizeCost.toFixed(2)} for ${mealsTotal} Meals Plan)`
                                    : `升级配套大份量 (+RM ${upsizeCost.toFixed(2)} / ${mealsTotal} 餐)`}
                                </span>
                              </button>
                            )}

                            {onBrowsePlans && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onBrowsePlans();
                                }}
                                className="py-2 px-3 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold text-xs transition-colors cursor-pointer text-center"
                              >
                                {language === 'en' ? 'Browse More Plans' : '浏览更多套餐'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Case 2: There are meal plans in cart, and ALL of them are already upsized
                  if (planItems.length > 0) {
                    return (
                      <div className="pt-4 border-t border-emerald-200/80">
                        <div className="p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-start gap-2.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <h5 className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                              <span>⚡</span>
                              <span>
                                {language === 'en'
                                  ? 'All Meal Plans Upsized (+80g Lean Protein & Greens Active)'
                                  : '配套大份量已全部生效 (+80g 优质蛋白质与双倍时蔬)'}
                              </span>
                            </h5>
                            <p className="text-[11px] text-emerald-800 leading-relaxed">
                              {language === 'en'
                                ? 'Your meal plans will each include +80g extra lean grilled chicken/salmon & garden greens with every daily box.'
                                : '您所选购的健康餐配套将为每一份餐盒加码 +80g 优质低脂肉类及双倍蔬菜，健康饱腹！'}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Case 3: No meal plans in cart (Ala carte items only)
                  // Notice: "upsize plan can't buy stand alone" & "no Add Upsize Portion (+RM 3.50)"
                  return (
                    <div className="pt-4 border-t border-stone-200">
                      <div className="p-3 rounded-2xl bg-stone-100/90 border border-stone-200 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">⚡</span>
                            <h5 className="font-bold text-xs text-stone-800">
                              {language === 'en' ? 'Meal Plan Portion Upsize (+80g Protein)' : '健康餐配套大份量升级 (+80g 蛋白)'}
                            </h5>
                          </div>
                          <span className="text-[10px] bg-stone-200 text-stone-700 font-bold px-2 py-0.5 rounded-full">
                            {language === 'en' ? 'Plan Perk Only' : '配套专享'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          {language === 'en'
                            ? 'Need more protein or higher satiety? Portion upsize (e.g. +RM 50 for 10 meals plan, +RM 100 for 20 meals plan) is an exclusive benefit for CHILL Meal Plans and cannot be purchased standalone. Subscribe to a meal plan to enjoy daily fresh delivery & upsize options!'
                            : '增肌减脂或食量较大？大份量升级（如 10 餐配套 +RM 50，20 餐配套 +RM 100）为健康餐配套专享福利，不可单独购买。选购健康餐配套即可享受每日鲜送与加量特权！'}
                        </p>
                        {onBrowsePlans && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onBrowsePlans();
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            <span>{language === 'en' ? 'Browse Meal Plans (From RM398)' : '浏览健康餐配套 (RM398起)'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
              {/* Free delivery reminder */}
              {!hasPlan && subtotal < 100 && (
                <div className="text-[11px] text-amber-800 bg-amber-100/70 p-2 rounded-xl text-center font-medium">
                  {language === 'en'
                    ? `Add RM ${(100 - subtotal).toFixed(2)} more for FREE Klang Valley Delivery (RM15 standard fee)!`
                    : `再点 RM ${(100 - subtotal).toFixed(2)} 即可享巴生河流域免费配送（未满RM100统一运费RM15）！`}
                </div>
              )}

              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>{language === 'en' ? 'Subtotal' : '商品小计'}</span>
                  <span className="font-bold text-stone-900">RM {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'en' ? 'Delivery' : '运费估算'}</span>
                  <span className="font-bold text-emerald-700">
                    {deliveryFee === 0 ? 'FREE' : `RM ${deliveryFee.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-stone-900 pt-2 border-t border-stone-200">
                  <span>{language === 'en' ? 'Total Amount' : '应付总额'}</span>
                  <span className="text-emerald-800 font-heading text-lg">
                    RM {grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                id="btn-proceed-checkout"
                onClick={onProceedToCheckout}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 active:scale-98 transition-all cursor-pointer"
              >
                <span>
                  {language === 'en'
                    ? `Checkout (RM ${grandTotal.toFixed(2)})`
                    : `填写地址立即结算 (RM ${grandTotal.toFixed(2)})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {language === 'en'
                    ? 'Official CHILL Healthy Verified Kitchen Guarantee'
                    : 'CHILL Healthy 潮轻食官方厨房品质保证'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
