import React from 'react';
import { Star, CheckCircle, Quote, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { REVIEWS } from '../data/menuData';

interface ReviewsSectionProps {
  language: Language;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ language }) => {
  return (
    <section className="py-16 sm:py-20 bg-stone-100/60 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span>{language === 'en' ? 'Verified Reviews' : '来自真实顾客的评价'}</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            {language === 'en' ? 'Loved by Over 15,000 Foodies' : '深受巴生谷上班族与健身达人信赖'}
          </h2>
          <p className="mt-3 text-stone-600 text-sm sm:text-base">
            {language === 'en'
              ? 'Real feedback from office workers, fitness coaches, and families eating with CHILL Healthy.'
              : '从每日上班工作餐到月度减脂计划，看他们如何通过潮轻食轻松吃出健康身材。'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {REVIEWS.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                  <span className="text-xs text-stone-400 ml-1 font-medium">{rev.date}</span>
                </div>

                <Quote className="w-8 h-8 text-stone-200 mb-2" />

                <p className="text-stone-700 text-xs sm:text-sm leading-relaxed">
                  "{language === 'en' ? rev.comment : rev.commentZh}"
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={rev.avatar}
                    alt={rev.author}
                    className="w-10 h-10 rounded-full object-cover border border-stone-200"
                  />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-stone-900 flex items-center gap-1.5">
                      <span>{rev.author}</span>
                      {rev.verified && (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 inline" />
                      )}
                    </h4>
                    <p className="text-[11px] text-stone-500">
                      {language === 'en' ? rev.role : rev.roleZh}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                  {language === 'en' ? 'Verified Eater' : '实名好评'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
