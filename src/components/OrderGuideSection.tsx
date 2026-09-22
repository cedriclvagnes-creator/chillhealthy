import React from 'react';
import { CheckCircle2, Clock, Truck, MessageCircle, Calendar, ShieldCheck, HeartPulse, ExternalLink, Sparkles } from 'lucide-react';
import { Language, SiteSettings } from '../types';
import { buildWhatsAppUrl, OFFICIAL_WA_DISPLAY } from '../utils/whatsapp';

interface OrderGuideSectionProps {
  language: Language;
  siteSettings: SiteSettings;
  onSelectPlansClick: () => void;
  onOpenMemberPortal: () => void;
}

export const OrderGuideSection: React.FC<OrderGuideSectionProps> = ({
  language,
  siteSettings,
  onSelectPlansClick,
  onOpenMemberPortal,
}) => {
  const isEn = language === 'en';
  const whatsappDisplay = siteSettings.whatsappDisplay || OFFICIAL_WA_DISPLAY;

  const defaultMsg = isEn
    ? 'Hi CHILL Healthy! I would like to confirm my Meal Plan order. My registered name is: '
    : '您好 潮轻食 CHILL Healthy！我想确认我的健康餐配套订单，我的注册姓名是：';

  const whatsappUrl = buildWhatsAppUrl(siteSettings.whatsappNumber, defaultMsg);

  return (
    <section id="order-guide" className="py-16 bg-gradient-to-b from-stone-50 via-emerald-50/25 to-white border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold tracking-wide mb-4 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{isEn ? '📣 Confirm Order & How It Works' : '📣 Confirm Order｜订单确认与订餐流程'}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            {isEn ? 'Thank you for choosing Chill Healthy!' : '感谢您下单我们的【潮轻食健康配套】❤️'}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-stone-600">
            {isEn
              ? 'Follow our quick 3-step guide from package checkout to daily fresh lunch delivery right to your desk.'
              : '从选购健康餐配套到每日新鲜配送至工位或家门，轻松三步开启规律控卡生活。'}
          </p>
        </div>

        {/* 3 Steps Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12">
          {/* Step 1 */}
          <div className="relative bg-white rounded-3xl p-7 border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="absolute -top-4 left-7 px-3.5 py-1 rounded-full bg-stone-900 text-white text-xs font-bold uppercase tracking-wider">
              {isEn ? 'Step 1' : '第一步'}
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl mb-5">
                🛒
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">
                {isEn ? 'Step 1 ｜ Choose Your Meal Plan' : '第一步 ｜ 选择配套'}
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed mb-4">
                {isEn ? (
                  <>
                    Visit our website <span className="font-semibold text-emerald-700">www.chill-healthy.com</span>. Choose your preferred Single Person pass (5-Day, 10-Day, 20-Day) or team package and complete payment.
                  </>
                ) : (
                  <>
                    请前往我们的官方网站：<span className="font-semibold text-emerald-700">www.chill-healthy.com</span>。选择您想要的单人轻食计划（5天/10天/20天）或团队配套，并完成付款。
                  </>
                )}
              </p>
            </div>
            <button
              onClick={onSelectPlansClick}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer border border-emerald-200/60"
            >
              <span>{isEn ? 'Browse Official Meal Packages' : '立即浏览官方健康配套'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          {/* Step 2 */}
          <div className="relative bg-white rounded-3xl p-7 border-2 border-emerald-500/50 shadow-md flex flex-col justify-between">
            <div className="absolute -top-4 left-7 px-3.5 py-1 rounded-full bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs">
              {isEn ? 'Step 2' : '第二步'}
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl mb-5 shadow-sm">
                📲
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">
                {isEn ? 'Step 2 ｜ WhatsApp Us' : '第二步 ｜ WhatsApp 通知我们'}
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed mb-4">
                {isEn ? (
                  <>
                    After payment, please return to WhatsApp and let us know. Kindly provide us with your <strong className="text-stone-900">registered name</strong> so we can verify your order.
                  </>
                ) : (
                  <>
                    付款完成后，请回到 WhatsApp 通知我们，并提供您的<strong className="text-stone-900">注册名字</strong>，以便我们快速为您确认开通餐点额度！
                  </>
                )}
              </p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{isEn ? `Notify on WhatsApp (${whatsappDisplay})` : `前往 WhatsApp 报备姓名 (${whatsappDisplay})`}</span>
            </a>
          </div>

          {/* Step 3 */}
          <div className="relative bg-white rounded-3xl p-7 border border-stone-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
            <div className="absolute -top-4 left-7 px-3.5 py-1 rounded-full bg-stone-900 text-white text-xs font-bold uppercase tracking-wider">
              {isEn ? 'Step 3' : '第三步'}
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl mb-5">
                ✅
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">
                {isEn ? 'Step 3 ｜ Order Confirmation' : '第三步 ｜ 确认配套与选餐'}
              </h3>
              <p className="text-stone-600 text-sm leading-relaxed mb-4">
                {isEn ? (
                  <>
                    Once we confirm your package, you can immediately start choosing your meals for each delivery day through our online web system!
                  </>
                ) : (
                  <>
                    我们确认您的配套后，您的会员账户即可激活，随时在电脑/手机网页端开始自选每天的美味轻食餐点啦！🥗
                  </>
                )}
              </p>
            </div>
            <button
              onClick={onOpenMemberPortal}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isEn ? 'Open Member Portal' : '打开会员兑换中心'}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Meal Selection Rules & Delivery Time Details */}
        <div className="bg-stone-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl relative overflow-hidden">
          {/* Background subtle leaf glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left: Selection options & Cutoff */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🍱</span>
                <h3 className="text-2xl font-bold tracking-tight">
                  {isEn ? 'Meal Selection Policy' : '餐点选择方式 ｜ Meal Selection'}
                </h3>
              </div>
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
                {isEn ? 'You have full flexibility on how you redeem your meals:' : '您可以根据作息与日程，随时灵活安排餐点选择：'}
              </p>

              <div className="space-y-3.5 mb-6">
                <div className="flex items-start gap-3 bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white text-sm sm:text-base">
                      {isEn ? 'Daily Next-Day Selection' : '每天选择隔天的餐点'}
                    </span>
                    <p className="text-stone-400 text-xs sm:text-sm mt-0.5">
                      {isEn ? 'Select your meal one day in advance whenever you need it.' : '根据每日心情与胃口，提前一天选择隔日餐点。'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-stone-800/80 p-3.5 rounded-2xl border border-stone-700/60">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white text-sm sm:text-base">
                      {isEn ? 'Or Select All Meals in Advance' : '或一次性选择好所有餐点'}
                    </span>
                    <p className="text-stone-400 text-xs sm:text-sm mt-0.5">
                      {isEn ? 'Plan out your whole 20-day cycle in one sitting with no daily hassle.' : '一次性规划好整月20天的轻食菜单，无需每日提醒，安心坐等送达。'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cutoff Alert Box */}
              <div className="flex items-center gap-3 bg-amber-500/20 border border-amber-500/40 px-4 py-3 rounded-2xl text-amber-200">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-pulse" />
                <span className="text-sm font-semibold">
                  {isEn
                    ? '⏰ Daily Cutoff: Please select your next-day meal before 5:00 PM.'
                    : '⏰ 重要提醒：每天请在下午 5:00 前完成隔天餐点选择。'}
                </span>
              </div>
            </div>

            {/* Right: Delivery Time & Guarantee */}
            <div className="bg-stone-800/90 rounded-2xl p-6 sm:p-8 border border-stone-700 space-y-6">
              <div className="flex items-center gap-3">
                <Truck className="w-6 h-6 text-emerald-400" />
                <h4 className="text-xl font-bold text-white">
                  {isEn ? 'Delivery Time ｜ 配送时间' : '配送时间 ｜ Delivery Time'}
                </h4>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-stone-300 text-sm">
                  <Calendar className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>
                    <strong className="text-white">
                      {isEn ? 'Monday to Friday' : '星期一至星期五'}
                    </strong>{' '}
                    ({isEn ? 'Excluding Public Holidays & Weekends' : '公假及周末除外'})
                  </span>
                </div>

                <div className="space-y-2 text-stone-300 text-sm">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-white">
                        {isEn ? 'Lunch Delivery: 10:00 AM – 2:00 PM' : '🍱 午餐配送：10:00 AM – 2:00 PM'}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    <span>
                      <strong className="text-white">
                        {isEn ? 'Dinner Delivery: 3:00 PM – 7:00 PM' : '🍲 晚餐配送：3:00 PM – 7:00 PM'}
                      </strong>
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 pl-8">
                    {isEn
                      ? 'Daily meals delivered fresh. Daily meal selection cutoff before 5:00 PM.'
                      : '每日新鲜现做配送。隔天餐点请在每天下午 5:00 前完成选择。'}
                  </p>
                </div>

                <div className="border-t border-stone-700 pt-4 space-y-3">
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-stone-300">
                    <Truck className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">
                        {isEn ? 'Klang Valley Free Delivery: ' : '巴生谷全境免运费：'}
                      </strong>
                      {isEn
                        ? 'Coverage across Klang Valley. 1 account supports up to 2 addresses. One day deliver one address for each account.'
                        : '覆盖巴生河流域免运费。1 个账户支持最多 2 个地址，每个账户一天派送一个地址。'}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-stone-300">
                    <HeartPulse className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>
                      {isEn
                        ? 'Special Health Consultation: Custom dietary guidance for 3-Highs risk groups'
                        : '特别质询服务：针对高血压、高血糖、高血脂风险群定制健康饮食建议'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
