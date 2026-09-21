import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { MenuSection } from './components/MenuSection';
import { MealPlansSection } from './components/MealPlansSection';
import { OrderGuideSection } from './components/OrderGuideSection';
import { CalorieGoalCalculator } from './components/CalorieGoalCalculator';
import { MealDetailModal } from './components/MealDetailModal';
import { BrandStorySection } from './components/BrandStorySection';
import { InstagramFeedSection } from './components/InstagramFeedSection';
import { DeliverySection } from './components/DeliverySection';
import { ReviewsSection } from './components/ReviewsSection';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { MemberPortalModal } from './components/MemberPortalModal';
import { BackOfficeModal } from './components/BackOfficeModal';
import { Footer } from './components/Footer';
import {
  Language,
  CartItem,
  MealItem,
  MealPlan,
  SiteSettings,
  MemberAccount,
  MealRedemption,
} from './types';
import { MEAL_ITEMS, MEAL_PLANS } from './data/menuData';
import {
  DEFAULT_SITE_SETTINGS,
  INITIAL_MEMBERS,
  INITIAL_REDEMPTIONS,
} from './data/initialStore';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [activeSection, setActiveSection] = useState('hero');

  // Site Settings (WhatsApp, phone, announcements, logo)
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('chillhealthy_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SITE_SETTINGS,
          ...parsed,
          whatsappNumber: '60126189919',
          whatsappDisplay: '+60126189919',
        };
      }
      return DEFAULT_SITE_SETTINGS;
    } catch {
      return DEFAULT_SITE_SETTINGS;
    }
  });

  // Dynamic Packages (5-day, 10-day, 20-day single person & team plans, editable via Back Office)
  const [packages, setPackages] = useState<MealPlan[]>(() => {
    try {
      const saved = localStorage.getItem('chillhealthy_packages_v3');
      return saved ? JSON.parse(saved) : MEAL_PLANS;
    } catch {
      return MEAL_PLANS;
    }
  });

  // Dynamic Menu Items (dishes and photos editable via Back Office, synced with official chillhealthy.com items)
  const [menuItems, setMenuItems] = useState<MealItem[]>(() => {
    try {
      const saved = localStorage.getItem('chillhealthy_menu_v2');
      if (saved) {
        const parsed: MealItem[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 20) {
          // Ensure all official items including the last two ala carte items are present!
          const existingIds = new Set(parsed.map((m) => m.id));
          const missing = MEAL_ITEMS.filter((m) => !existingIds.has(m.id));
          return missing.length > 0 ? [...parsed, ...missing] : parsed;
        }
      }
      localStorage.setItem('chillhealthy_menu_v2', JSON.stringify(MEAL_ITEMS));
      return MEAL_ITEMS;
    } catch {
      return MEAL_ITEMS;
    }
  });

  // Member Accounts
  const [members, setMembers] = useState<MemberAccount[]>(() => {
    try {
      const saved = localStorage.getItem('chillhealthy_members');
      if (saved) {
        const parsed: MemberAccount[] = JSON.parse(saved);
        return parsed.map((m) => ({
          ...m,
          memberNumber: m.memberNumber || m.phone,
          password: m.password && m.password !== 'password123' ? m.password : '123456',
        }));
      }
      return INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  // Current Logged-in Member (default to demo member for instant experience)
  const [currentMember, setCurrentMember] = useState<MemberAccount | null>(() => {
    try {
      const saved = localStorage.getItem('chillhealthy_current_member');
      if (saved) {
        const parsed: MemberAccount = JSON.parse(saved);
        return {
          ...parsed,
          memberNumber: parsed.memberNumber || parsed.phone,
          password: parsed.password && parsed.password !== 'password123' ? parsed.password : '123456',
        };
      }
      return INITIAL_MEMBERS[0];
    } catch {
      return INITIAL_MEMBERS[0];
    }
  });

  // Daily Meal Redemptions
  const [redemptions, setRedemptions] = useState<MealRedemption[]>(() => {
    try {
      const saved = localStorage.getItem('chillhealthy_redemptions');
      return saved ? JSON.parse(saved) : INITIAL_REDEMPTIONS;
    } catch {
      return INITIAL_REDEMPTIONS;
    }
  });

  // Cart state persisted with localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('chillhealthy_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modals visibility
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCalorieModalOpen, setIsCalorieModalOpen] = useState(false);
  const [selectedMealForDetail, setSelectedMealForDetail] = useState<MealItem | null>(null);
  const [isMemberPortalOpen, setIsMemberPortalOpen] = useState(false);
  const [isBackOfficeOpen, setIsBackOfficeOpen] = useState(false);
  const [backOfficeTab, setBackOfficeTab] = useState<'settings' | 'packages' | 'menu' | 'redemptions' | 'members'>('settings');

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('chillhealthy_settings', JSON.stringify(siteSettings));
    } catch {
      // ignore
    }
  }, [siteSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('chillhealthy_packages_v3', JSON.stringify(packages));
    } catch {
      // ignore
    }
  }, [packages]);

  useEffect(() => {
    try {
      localStorage.setItem('chillhealthy_menu_v2', JSON.stringify(menuItems));
    } catch {
      // ignore
    }
  }, [menuItems]);

  useEffect(() => {
    try {
      localStorage.setItem('chillhealthy_members', JSON.stringify(members));
    } catch {
      // ignore
    }
  }, [members]);

  useEffect(() => {
    try {
      localStorage.setItem('chillhealthy_current_member', JSON.stringify(currentMember));
    } catch {
      // ignore
    }
  }, [currentMember]);

  useEffect(() => {
    try {
      localStorage.setItem('chillhealthy_redemptions', JSON.stringify(redemptions));
    } catch {
      // ignore
    }
  }, [redemptions]);

  useEffect(() => {
    try {
      localStorage.setItem('chillhealthy_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  // Private Admin Route & Back Office / Kitchen / Portal Detection
  useEffect(() => {
    const checkAdminRoute = () => {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();

      // Member portal & order/redeem portal sublink
      if (
        hash === '#portal' ||
        hash === '#member' ||
        hash === '#order' ||
        hash === '#redeem' ||
        search.includes('portal=true') ||
        search.includes('page=portal') ||
        search.includes('redeem=true') ||
        search.includes('page=redeem') ||
        pathname.endsWith('/portal') ||
        pathname.endsWith('/redeem')
      ) {
        setIsMemberPortalOpen(true);
      }

      // Kitchen preparation and order report sublink
      if (
        hash === '#kitchen' ||
        hash === '#kitchen-report' ||
        hash === '#report' ||
        hash === '#orders' ||
        search.includes('kitchen=true') ||
        search.includes('page=kitchen') ||
        pathname.endsWith('/kitchen')
      ) {
        setBackOfficeTab('redemptions');
        setIsBackOfficeOpen(true);
      } else if (
        search.includes('admin=true') ||
        search.includes('admin=1') ||
        search.includes('page=admin') ||
        search.includes('backoffice=true') ||
        hash === '#admin' ||
        hash === '#backoffice' ||
        pathname.endsWith('/admin')
      ) {
        setBackOfficeTab('settings');
        setIsBackOfficeOpen(true);
      }
    };

    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);

    // Keyboard shortcut for quick owner access: Ctrl+Alt+A / Cmd+Alt+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsBackOfficeOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Member Authentication Handlers
  const handleMemberLogin = (loginIdOrPhone: string, pass: string): boolean => {
    const rawInput = loginIdOrPhone.trim();
    const phoneDigits = rawInput.replace(/\D/g, '');

    const found = members.find((m) => {
      const mPhoneDigits = (m.phone || '').replace(/\D/g, '');
      const mMemberNumDigits = (m.memberNumber || m.phone || '').replace(/\D/g, '');
      const mEmail = (m.email || '').toLowerCase().trim();

      const matchesPhone =
        phoneDigits.length >= 7 &&
        (mPhoneDigits.includes(phoneDigits) ||
          phoneDigits.includes(mPhoneDigits) ||
          mMemberNumDigits.includes(phoneDigits));
      const matchesEmail = rawInput.toLowerCase() === mEmail;

      return matchesPhone || matchesEmail;
    });

    if (found) {
      const userPass = found.password || '123456';
      // Can login with their custom password or default '123456'
      if (pass === userPass || pass === '123456') {
        setCurrentMember(found);
        return true;
      }
      return false;
    }

    // If new phone number entered, auto-create account with memberNumber = phone and default password 123456
    if (pass === '123456' || !pass) {
      const cleanPhone =
        phoneDigits.length >= 8
          ? phoneDigits.startsWith('60')
            ? phoneDigits.slice(1)
            : phoneDigits.startsWith('0')
            ? phoneDigits
            : `0${phoneDigits}`
          : rawInput.startsWith('01')
          ? rawInput
          : '0126189919';

      const newAcct: MemberAccount = {
        id: cleanPhone,
        memberNumber: cleanPhone, // Member login number same as handphone number
        name: rawInput.includes('@') ? rawInput.split('@')[0] : `Member ${cleanPhone}`,
        email: rawInput.includes('@') ? rawInput : `${cleanPhone}@customer.chill-healthy.com`,
        phone: cleanPhone,
        password: '123456', // Default 123456
        address: 'Bandar Bukit Tinggi, Klang',
        area: 'Klang / Bukit Tinggi',
        postalCode: '41200',
        activePackage: {
          planId: 'plan-20day',
          planName: '20-Day Transformation Plan (20 Meals)',
          planNameZh: '20天全效塑形月度餐包 (20餐)',
          totalMeals: 20,
          remainingMeals: 15,
          purchasedDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        },
        creditsHistory: [
          {
            id: `cr-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'purchase',
            amount: 20,
            note: 'Online package subscription activation',
          },
        ],
      };
      setMembers((prev) => [newAcct, ...prev]);
      setCurrentMember(newAcct);
      return true;
    }

    return false;
  };

  const handleMemberRegister = (newMemberData: Partial<MemberAccount>) => {
    const rawPhone = (newMemberData.phone || '').replace(/\D/g, '');
    const cleanPhone =
      rawPhone.length >= 8
        ? rawPhone.startsWith('60')
          ? rawPhone.slice(1)
          : rawPhone.startsWith('0')
          ? rawPhone
          : `0${rawPhone}`
        : rawPhone || '0126189919';

    const existingIndex = members.findIndex(
      (m) => m.phone === cleanPhone || m.memberNumber === cleanPhone || m.id === cleanPhone
    );

    const newAcct: MemberAccount = {
      id: cleanPhone,
      memberNumber: cleanPhone, // Member login number same as handphone number
      name: newMemberData.name || 'New Member',
      email: newMemberData.email || `${cleanPhone}@customer.chill-healthy.com`,
      phone: cleanPhone,
      password: newMemberData.password || '123456', // Default password 123456
      address: newMemberData.address || '',
      area: newMemberData.area || 'Klang / Bukit Tinggi',
      postalCode: newMemberData.postalCode || '41200',
      address2: newMemberData.address2 || undefined,
      area2: newMemberData.area2 || undefined,
      postalCode2: newMemberData.postalCode2 || undefined,
      activeAddressSlot: 1,
      dietaryPreferences: newMemberData.dietaryPreferences,
      activePackage: existingIndex >= 0 && members[existingIndex].activePackage
        ? members[existingIndex].activePackage
        : {
            planId: 'plan-10day',
            planName: '10-Day Workday Vitality Plan (10 Meals)',
            planNameZh: '10天工作日元气定制套餐 (10餐)',
            totalMeals: 10,
            remainingMeals: 10,
            purchasedDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
          },
      creditsHistory: existingIndex >= 0 && members[existingIndex].creditsHistory?.length
        ? members[existingIndex].creditsHistory
        : [
            {
              id: `cr-${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              type: 'purchase',
              amount: 10,
              note: 'Welcome membership package bonus',
            },
          ],
    };

    if (existingIndex >= 0) {
      setMembers((prev) => {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], ...newAcct };
        return copy;
      });
    } else {
      setMembers((prev) => [newAcct, ...prev]);
    }
    setCurrentMember(newAcct);
  };

  const handleUpdateMemberPassword = (newPassword: string): boolean => {
    if (!currentMember) return false;
    const updated: MemberAccount = { ...currentMember, password: newPassword };
    setCurrentMember(updated);
    setMembers((prev) =>
      prev.map((m) =>
        m.id === currentMember.id || m.phone === currentMember.phone || m.memberNumber === currentMember.memberNumber
          ? updated
          : m
      )
    );
    return true;
  };

  const handleMemberLogout = () => {
    setCurrentMember(null);
  };

  // Member Meal Redemption Handler
  const handleRedeemMeal = (redemptionData: Omit<MealRedemption, 'id' | 'createdAt' | 'status'>): boolean => {
    const qty = redemptionData.quantity || 1;
    if (!currentMember || !currentMember.activePackage || currentMember.activePackage.remainingMeals < qty) {
      return false;
    }

    // Create redemption ticket
    const newRedemption: MealRedemption = {
      ...redemptionData,
      id: `RED-${Date.now().toString().slice(-6)}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    // Deduct credits
    const updatedMember: MemberAccount = {
      ...currentMember,
      activePackage: {
        ...currentMember.activePackage,
        remainingMeals: Math.max(0, currentMember.activePackage.remainingMeals - qty),
      },
      creditsHistory: [
        {
          id: `cr-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'redeem',
          amount: -qty,
          note: `Redeemed ${qty}x ${redemptionData.mealName} for ${redemptionData.deliveryDate}`,
        },
        ...currentMember.creditsHistory,
      ],
    };

    setCurrentMember(updatedMember);
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    setRedemptions((prev) => [newRedemption, ...prev]);
    return true;
  };

  const handleBatchRedeemMeals = (
    redemptionsList: Array<Omit<MealRedemption, 'id' | 'createdAt' | 'status'>>
  ): boolean => {
    if (!currentMember || !currentMember.activePackage) return false;
    const totalDeduct = redemptionsList.reduce((sum, r) => sum + (r.quantity || 1), 0);
    if (currentMember.activePackage.remainingMeals < totalDeduct) return false;

    const newTickets: MealRedemption[] = redemptionsList.map((r, i) => ({
      ...r,
      id: `RED-${Date.now().toString().slice(-5)}${i}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }));

    const updatedMember: MemberAccount = {
      ...currentMember,
      activePackage: {
        ...currentMember.activePackage,
        remainingMeals: Math.max(0, currentMember.activePackage.remainingMeals - totalDeduct),
      },
      creditsHistory: [
        {
          id: `cr-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'redeem',
          amount: -totalDeduct,
          note: `Batch redeemed ${redemptionsList.length} advance workdays schedule`,
        },
        ...currentMember.creditsHistory,
      ],
    };

    setCurrentMember(updatedMember);
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
    setRedemptions((prev) => [...newTickets, ...prev]);
    return true;
  };

  const handleUpdateMemberAddresses = (
    addr1: { address: string; area: string; postalCode: string },
    addr2?: { address2: string; area2: string; postalCode2: string }
  ) => {
    if (!currentMember) return;
    const updatedMember: MemberAccount = {
      ...currentMember,
      address: addr1.address,
      area: addr1.area,
      postalCode: addr1.postalCode,
      ...(addr2 ? {
        address2: addr2.address2,
        area2: addr2.area2,
        postalCode2: addr2.postalCode2,
      } : {}),
    };
    setCurrentMember(updatedMember);
    setMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
  };

  const handlePackageOrdered = (
    planItem: CartItem,
    customer: {
      name: string;
      phone: string;
      address: string;
      area: string;
      postalCode: string;
      address2?: string;
      area2?: string;
      postalCode2?: string;
    }
  ) => {
    const pkg = packages.find((p) => p.id === planItem.cartItemId.replace(/^plan-/, '').split('-')[0]) || packages[0];
    const totalMealsToAdd = planItem.planDetails?.mealsTotal || pkg.mealsTotal || 20;

    if (currentMember) {
      const updated: MemberAccount = {
        ...currentMember,
        address: customer.address || currentMember.address,
        area: customer.area || currentMember.area,
        postalCode: customer.postalCode || currentMember.postalCode,
        ...(customer.address2 ? {
          address2: customer.address2,
          area2: customer.area2 || currentMember.area,
          postalCode2: customer.postalCode2 || currentMember.postalCode,
        } : {}),
        activePackage: {
          planId: pkg.id,
          planName: pkg.title,
          planNameZh: pkg.titleZh,
          totalMeals: totalMealsToAdd,
          remainingMeals: (currentMember.activePackage?.remainingMeals || 0) + totalMealsToAdd,
          purchasedDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
        },
        creditsHistory: [
          {
            id: `cr-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'purchase',
            amount: totalMealsToAdd,
            note: `Ordered package: ${pkg.title}`,
          },
          ...currentMember.creditsHistory,
        ],
      };
      setCurrentMember(updated);
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } else {
      const newMember: MemberAccount = {
        id: `MEM-${Date.now().toString().slice(-4)}`,
        name: customer.name,
        email: `${customer.phone.replace(/\D/g, '')}@customer.chill-healthy.com`,
        phone: customer.phone,
        address: customer.address,
        area: customer.area,
        postalCode: customer.postalCode,
        address2: customer.address2,
        area2: customer.area2,
        postalCode2: customer.postalCode2,
        activePackage: {
          planId: pkg.id,
          planName: pkg.title,
          planNameZh: pkg.titleZh,
          totalMeals: totalMealsToAdd,
          remainingMeals: totalMealsToAdd,
          purchasedDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0],
        },
        creditsHistory: [
          {
            id: `cr-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'purchase',
            amount: totalMealsToAdd,
            note: `Online purchase: ${pkg.title}`,
          },
        ],
      };
      setMembers((prev) => [newMember, ...prev]);
      setCurrentMember(newMember);
    }
  };

  // Back Office Maintenance Handlers
  const handleUpdateSiteSettings = (newSettings: SiteSettings) => {
    setSiteSettings(newSettings);
  };

  const handleUpdatePackages = (newPackages: MealPlan[]) => {
    setPackages(newPackages);
  };

  const handleUpdateMenuItems = (newItems: MealItem[]) => {
    setMenuItems(newItems);
  };

  const handleUpdateRedemptionStatus = (id: string, newStatus: MealRedemption['status']) => {
    setRedemptions((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  const handleUpdateRedemptionOrder = (updatedOrder: MealRedemption) => {
    setRedemptions((prev) => {
      const next = prev.map((r) => (r.id === updatedOrder.id ? updatedOrder : r));
      try {
        localStorage.setItem('chillhealthy_redemptions', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleUpdateMemberCredits = (memberId: string, deltaMeals: number) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.id === memberId && m.activePackage) {
          const updated = {
            ...m,
            activePackage: {
              ...m.activePackage,
              remainingMeals: Math.max(0, m.activePackage.remainingMeals + deltaMeals),
            },
          };
          if (currentMember?.id === memberId) {
            setCurrentMember(updated);
          }
          return updated;
        }
        return m;
      })
    );
  };

  const handleUpdateMemberAccount = (updatedMember: MemberAccount) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );
    if (currentMember?.id === updatedMember.id) {
      setCurrentMember(updatedMember);
    }
  };

  const handleAddMemberAccount = (newMember: MemberAccount) => {
    setMembers((prev) => [newMember, ...prev]);
  };

  const handleDeleteMemberAccount = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (currentMember?.id === memberId) {
      setCurrentMember(null);
    }
  };

  // Cart operations
  const handleAddToCart = (newItem: CartItem) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (i) =>
          i.type === newItem.type &&
          i.title === newItem.title &&
          JSON.stringify(i.substitutions) === JSON.stringify(newItem.substitutions) &&
          JSON.stringify(i.planDetails) === JSON.stringify(newItem.planDetails) &&
          i.notes === newItem.notes
      );

      if (existingIdx > -1) {
        const updated = [...prevCart];
        updated[existingIdx].quantity += newItem.quantity;
        return updated;
      }
      return [...prevCart, newItem];
    });

    setIsCartOpen(true);
  };

  const handleQuickAdd = (meal: MealItem) => {
    const cartItem: CartItem = {
      cartItemId: `quick-${meal.id}-${Date.now()}`,
      type: 'meal',
      title: language === 'en' ? meal.name : meal.nameZh,
      titleZh: meal.nameZh,
      price: meal.price,
      quantity: 1,
      image: meal.image,
      calories: meal.calories,
      protein: meal.protein,
      substitutions: {
        dressingOnSide: true,
      },
    };
    handleAddToCart(cartItem);
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderCompleted = () => {
    setCart([]);
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-900">
      {/* Navigation Header with Member & Back Office */}
      <Header
        language={language}
        setLanguage={setLanguage}
        cart={cart}
        setIsCartOpen={setIsCartOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenCalorieModal={() => setIsCalorieModalOpen(true)}
        siteSettings={siteSettings}
        currentMember={currentMember}
        onOpenMemberPortal={() => setIsMemberPortalOpen(true)}
        onOpenBackOffice={() => setIsBackOfficeOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        <HeroBanner
          language={language}
          onExploreMenu={() => scrollToSection('menu')}
          onViewPlans={() => scrollToSection('plans')}
          onViewOrderGuide={() => scrollToSection('order-guide')}
        />

        <MenuSection
          language={language}
          onSelectMeal={(meal) => setSelectedMealForDetail(meal)}
          onQuickAdd={handleQuickAdd}
          menuItems={menuItems}
        />

        <MealPlansSection
          language={language}
          onAddPlanToCart={handleAddToCart}
          packages={packages}
          onOpenMemberPortal={() => setIsMemberPortalOpen(true)}
        />

        <OrderGuideSection
          language={language}
          siteSettings={siteSettings}
          onSelectPlansClick={() => scrollToSection('plans')}
          onOpenMemberPortal={() => setIsMemberPortalOpen(true)}
        />

        <BrandStorySection
          language={language}
          siteSettings={siteSettings}
        />

        <InstagramFeedSection
          language={language}
          siteSettings={siteSettings}
          onSelectMealByName={(name) => {
            const found = menuItems.find((m) =>
              m.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(m.name.toLowerCase())
            );
            if (found) {
              setSelectedMealForDetail(found);
            } else {
              scrollToSection('menu');
            }
          }}
        />

        <DeliverySection language={language} />

        <ReviewsSection language={language} />
      </main>

      {/* Footer with WhatsApp, Member & Back Office Links */}
      <Footer
        language={language}
        siteSettings={siteSettings}
        onNavigate={scrollToSection}
        onOpenCalorie={() => setIsCalorieModalOpen(true)}
        onOpenMemberPortal={() => setIsMemberPortalOpen(true)}
        onOpenBackOffice={() => setIsBackOfficeOpen(true)}
      />

      {/* Meal Detail Customization Modal */}
      {selectedMealForDetail && (
        <MealDetailModal
          meal={selectedMealForDetail}
          language={language}
          onClose={() => setSelectedMealForDetail(null)}
          onAddToCart={handleAddToCart}
          onUpdateMeal={(updatedMeal) => {
            const next = menuItems.map((m) => (m.id === updatedMeal.id ? updatedMeal : m));
            handleUpdateMenuItems(next);
            setSelectedMealForDetail(updatedMeal);
          }}
        />
      )}

      {/* Calorie & TDEE Goal Matcher Modal */}
      {isCalorieModalOpen && (
        <CalorieGoalCalculator
          language={language}
          isOpen={isCalorieModalOpen}
          onClose={() => setIsCalorieModalOpen(false)}
          onSelectRecommendedMeal={(meal) => setSelectedMealForDetail(meal)}
        />
      )}

      {/* Slide-out Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cart={cart}
          language={language}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onProceedToCheckout={handleProceedToCheckout}
        />
      )}

      {/* Checkout & WhatsApp Order Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          language={language}
          siteSettings={siteSettings}
          onOrderCompleted={handleOrderCompleted}
          onPackageOrdered={handlePackageOrdered}
          onOpenMemberPortal={() => setIsMemberPortalOpen(true)}
        />
      )}

      {/* Customer Member Portal & Daily Meal Redemption Modal */}
      {isMemberPortalOpen && (
        <MemberPortalModal
          isOpen={isMemberPortalOpen}
          onClose={() => setIsMemberPortalOpen(false)}
          language={language}
          currentMember={currentMember}
          onLogin={handleMemberLogin}
          onLogout={handleMemberLogout}
          onRegister={handleMemberRegister}
          onRedeemMeal={handleRedeemMeal}
          onBatchRedeemMeals={handleBatchRedeemMeals}
          onUpdateMemberAddresses={handleUpdateMemberAddresses}
          onUpdateMemberPassword={handleUpdateMemberPassword}
          menuItems={menuItems}
          packages={packages}
          allRedemptions={redemptions}
          siteSettings={siteSettings}
          onSelectPackageToBuy={(pkg) => {
            setIsMemberPortalOpen(false);
            const cartItem: CartItem = {
              cartItemId: `plan-${pkg.id}-${Date.now()}`,
              type: 'plan',
              title: language === 'en' ? pkg.title : pkg.titleZh,
              titleZh: pkg.titleZh,
              price: pkg.totalPrice,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
              planDetails: {
                days: pkg.days,
                mealsTotal: pkg.mealsTotal,
                deliveryTime: 'lunch',
              },
            };
            handleAddToCart(cartItem);
          }}
        />
      )}

      {/* Back Office CMS for Maintenance */}
      {isBackOfficeOpen && (
        <BackOfficeModal
          isOpen={isBackOfficeOpen}
          onClose={() => {
            setIsBackOfficeOpen(false);
            if (
              window.location.search.includes('admin') ||
              window.location.search.includes('backoffice') ||
              window.location.hash.includes('admin')
            ) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          }}
          language={language}
          siteSettings={siteSettings}
          onUpdateSiteSettings={handleUpdateSiteSettings}
          packages={packages}
          onUpdatePackages={handleUpdatePackages}
          menuItems={menuItems}
          onUpdateMenuItems={handleUpdateMenuItems}
          redemptions={redemptions}
          onUpdateRedemptionStatus={handleUpdateRedemptionStatus}
          onUpdateRedemptionOrder={handleUpdateRedemptionOrder}
          members={members}
          onUpdateMemberCredits={handleUpdateMemberCredits}
          onUpdateMemberAccount={handleUpdateMemberAccount}
          onAddMemberAccount={handleAddMemberAccount}
          onDeleteMemberAccount={handleDeleteMemberAccount}
          initialTab={backOfficeTab}
        />
      )}
    </div>
  );
}
