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
  onAddUpsize?: () => void;
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
  onAddUpsize,
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
                        <div className="text-[11px] text-stone-500 mt-0.5">
                          {item.planDetails.days} Days · {item.planDetails.mealsTotal} Meals total
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

                {/* Upsize Portion Suggestion Box */}
                <div className="pt-4 border-t border-amber-200/80">
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">⚡</span>
                        <h5 className="font-bold text-xs text-amber-950">
                          {language === 'en' ? 'Suggest Upsize Portion (+RM 3.50)' : '推荐升级大份量 (+RM 3.50)'}
                        </h5>
                      </div>
                      <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                        +80g Protein
                      </span>
                    </div>

                    <p className="text-[11px] text-amber-900/80 leading-relaxed">
                      {language === 'en'
                        ? 'Need more protein or higher satiety? Upsize with +80g extra lean grilled chicken/salmon & garden greens!'
                        : '增肌减脂或食量较大？升级大份量加码 +80g 优质低脂肉类及双倍纤维时蔬，饱腹感倍增！'}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      {onAddUpsize && (
                        <button
                          type="button"
                          onClick={onAddUpsize}
                          className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Add Upsize Portion (+RM 3.50)' : '加购大份量 (+RM 3.50)'}</span>
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
