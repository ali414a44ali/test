import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useOrders } from "../contexts/OrderContext";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { supabase } from "../lib/supabaseClient";

export default function CustomerPage() {
  const { tableNumber = "1" } = useParams();
  const { menuItems, orders, addOrder, updateMenuItem } = useOrders();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [cart, setCart] = useState({});
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [search, setSearch] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [showCart, setShowCart] = useState(false);

  // طلبات هذه الطاولة
  const myOrders = orders.filter(o => o.table_number === tableNumber);
  const latestOrder = myOrders[0];
  const orderStatus = latestOrder?.status;

  // اقتراحات ذكية تعتمد على آخر صنف تمت إضافته
  useEffect(() => {
    const lastItemId = Object.keys(cart).pop();
    if (lastItemId) {
      const item = menuItems.find(i => i.id === lastItemId);
      if (item?.category === "مشاوي") setSuggestions([{ name: "مشروب غازي", price: 1500 }, { name: "لبن", price: 2000 }]);
      else if (item?.category === "بيتزا") setSuggestions([{ name: "بطاطا مقلية", price: 3000 }, { name: "صوص ثوم", price: 500 }]);
      else if (item?.category === "قهوة") setSuggestions([{ name: "كنافة", price: 6000 }, { name: "بسبوسة", price: 4000 }]);
      else setSuggestions([]);
    } else setSuggestions([]);
  }, [cart, menuItems]);

  // حساب الإجمالي بعد الخصم
  const subtotal = Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal - discount;

  const addToCart = (item, qty = 1) => {
    setCart(prev => ({
      ...prev,
      [item.id]: { ...item, qty: (prev[item.id]?.qty || 0) + qty, note: prev[item.id]?.note || "" }
    }));
    toast.success(`أضيف ${item.name}`);
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      const newQty = (prev[id]?.qty || 0) + delta;
      if (newQty <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: { ...prev[id], qty: newQty } };
    });
  };

  const updateNote = (id, note) => {
    setCart(prev => ({ ...prev, [id]: { ...prev[id], note } }));
  };

  const submitOrder = async () => {
    const itemsList = Object.values(cart).map(({ id, name, price, qty, note }) => ({ id, name, price, qty, note }));
    if (itemsList.length === 0) return toast.error("السلة فارغة");
    const newOrder = {
      id: `ORD-${Date.now()}`,
      table_number: tableNumber,
      items: itemsList,
      total: total,
      status: "new",
      created_at: new Date().toISOString(),
      waiter_id: null,
      discount: discount,
      coupon_code: couponCode || null,
    };
    await addOrder(newOrder);
    setCart({});
    setDiscount(0);
    setCouponCode("");
    toast.success("تم إرسال طلبك");
    setShowCart(false);
  };

  const callWaiter = async () => {
    await supabase.from("waiter_calls").insert({ table_number: tableNumber, created_at: new Date() });
    toast.success("تم إرسال إشعار للنادل");
  };

  const requestBill = async () => {
    await supabase.from("bill_requests").insert({ table_number: tableNumber });
    toast.success("سيتم تجهيز الفاتورة");
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    const { data, error } = await supabase.from("coupons").select("*").eq("code", couponCode).single();
    if (error || !data) return toast.error("الكود غير صالح");
    if (new Date(data.expires_at) < new Date()) return toast.error("انتهت صلاحية الكود");
    let discountValue = 0;
    if (data.type === "percentage") discountValue = (subtotal * data.value) / 100;
    else if (data.type === "fixed") discountValue = data.value;
    else if (data.type === "bogo") discountValue = 0; // سيعالج لاحقاً
    setDiscount(discountValue);
    toast.success(`تم تطبيق خصم ${discountValue} د.ع`);
  };

  const rateItem = async (itemId, rating) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    const newCount = (item.rating_count || 0) + 1;
    const newAvg = ((item.rating_avg || 0) * (item.rating_count || 0) + rating) / newCount;
    await updateMenuItem({ ...item, rating_avg: newAvg, rating_count: newCount });
    toast.success("شكراً لتقييمك");
  };

  // فلترة الأصناف
  const filteredMenu = menuItems.filter(item => {
    const matchCategory = activeCategory === "الكل" || item.category === activeCategory;
    const matchSearch = item.name.includes(search) || item.description.includes(search);
    const matchPrice = item.price >= priceRange.min && item.price <= priceRange.max;
    const matchAvailable = !showOnlyAvailable || item.available;
    return matchCategory && matchSearch && matchPrice && matchAvailable;
  });

  // ترتيب حسب التقييم (الأعلى أولاً)
  const sortedMenu = [...filteredMenu].sort((a,b) => (b.rating_avg||0) - (a.rating_avg||0));

  // تتبع الحالة بأيقونات
  const statusSteps = [
    { key: "new", label: "تم الاستلام", icon: "📥" },
    { key: "confirmed", label: "تم التأكيد", icon: "✅" },
    { key: "preparing", label: "قيد التحضير", icon: "🍳" },
    { key: "ready", label: "جاهز", icon: "🍽️" },
    { key: "delivered", label: "تم التوصيل", icon: "🏁" }
  ];
  const currentStepIndex = statusSteps.findIndex(s => s.key === orderStatus);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-28">
      {/* شريط علوي */}
      <div className="sticky top-0 z-20 bg-teal-700 text-white p-3 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{t('table')} {tableNumber}</h1>
        <div className="flex gap-2">
          <LanguageSwitcher />
          <button onClick={callWaiter} className="bg-orange-600 px-3 py-1 rounded text-sm">📢 {t('callWaiter')}</button>
          <button onClick={requestBill} className="bg-red-600 px-3 py-1 rounded text-sm">🧾 {t('bill')}</button>
        </div>
      </div>

      {/* تتبع حالة الطلب */}
      {latestOrder && (
        <div className="bg-white dark:bg-gray-800 shadow m-3 p-3 rounded-lg overflow-x-auto">
          <div className="flex justify-between min-w-[500px]">
            {statusSteps.map((step, idx) => (
              <div key={step.key} className="text-center flex-1">
                <div className={`text-2xl ${idx <= currentStepIndex ? "text-teal-600" : "text-gray-300"}`}>{step.icon}</div>
                <div className="text-xs mt-1">{step.label}</div>
                {idx < currentStepIndex && <div className="h-1 bg-teal-600 w-full mt-1"></div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* أدوات البحث والفلترة */}
      <div className="p-3 space-y-2 bg-white dark:bg-gray-800 m-3 rounded-lg shadow">
        <input type="text" placeholder="🔍 بحث..." className="w-full border rounded p-2" value={search} onChange={e=>setSearch(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <select onChange={e=>setPriceRange({...priceRange, min: +e.target.value})} className="border rounded p-1 text-sm">
            <option value="0">أدنى سعر</option><option value="1000">1000</option><option value="5000">5000</option><option value="10000">10000</option>
          </select>
          <select onChange={e=>setPriceRange({...priceRange, max: +e.target.value})} className="border rounded p-1 text-sm">
            <option value="100000">أعلى سعر</option><option value="10000">10000</option><option value="50000">50000</option><option value="100000">100000</option>
          </select>
          <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={showOnlyAvailable} onChange={e=>setShowOnlyAvailable(e.target.checked)} /> المتوفر فقط</label>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={()=>setActiveCategory("الكل")} className={`px-3 py-1 rounded-full text-sm ${activeCategory==="الكل"?"bg-teal-600 text-white":"bg-gray-200 dark:bg-gray-700"}`}>الكل</button>
          {[...new Set(menuItems.map(i=>i.category))].map(cat=>(
            <button key={cat} onClick={()=>setActiveCategory(cat)} className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${activeCategory===cat?"bg-teal-600 text-white":"bg-gray-200 dark:bg-gray-700"}`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* قائمة الأصناف */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
        {sortedMenu.map(item => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-xl shadow p-3">
            <img src={item.image_url} alt={item.name} className="w-full h-40 object-cover rounded cursor-pointer" onClick={()=>setEnlargedImage(item.image_url)} />
            <div className="flex justify-between items-start mt-2">
              <h3 className="font-bold">{item.name}</h3>
              <span className="text-teal-600 font-bold">{item.price} د.ع</span>
            </div>
            <p className="text-sm text-gray-500">{item.description}</p>
            {/* تقييم بالنجوم */}
            <div className="flex items-center gap-1 mt-1">
              {[1,2,3,4,5].map(star => (
                <span key={star} onClick={() => rateItem(item.id, star)} className="cursor-pointer text-xl text-yellow-500">
                  {star <= Math.round(item.rating_avg || 0) ? "★" : "☆"}
                </span>
              ))}
              <span className="text-xs text-gray-400">({item.rating_count || 0})</span>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={()=>addToCart(item)} className="flex-1 bg-teal-600 text-white py-1 rounded">➕ أضف</button>
              <button onClick={()=>addToCart(item, 2)} className="flex-1 bg-orange-500 text-white py-1 rounded">➕2</button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* السلة العائمة */}
      {Object.keys(cart).length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-t shadow-lg p-3 z-30">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold">{Object.values(cart).reduce((a,b)=>a+b.qty,0)} أصناف</span>
              <span className="mr-3 text-teal-600 font-bold">{total} د.ع</span>
              {discount > 0 && <span className="text-red-500 text-sm line-through mr-2">{subtotal} د.ع</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setShowCart(!showCart)} className="bg-gray-500 text-white px-4 py-1 rounded">تعديل</button>
              <button onClick={submitOrder} className="bg-green-600 text-white px-6 py-1 rounded">إرسال الطلب</button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة السلة المنبثقة */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed bottom-20 inset-x-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl p-4 z-40 max-h-[70vh] overflow-auto">
            <h2 className="font-bold text-lg mb-2">سلة الطلب</h2>
            {Object.values(cart).map(item => (
              <div key={item.id} className="border-b py-2">
                <div className="flex justify-between">
                  <span>{item.name} × {item.qty}</span>
                  <span>{item.price * item.qty} د.ع</span>
                </div>
                <textarea className="w-full border rounded p-1 text-sm mt-1" placeholder="ملاحظة..." value={item.note || ""} onChange={e=>updateNote(item.id, e.target.value)} rows="1"></textarea>
                <div className="flex gap-2 mt-1">
                  <button onClick={()=>updateQty(item.id, -1)} className="bg-red-500 text-white px-2 rounded">-</button>
                  <button onClick={()=>updateQty(item.id, 1)} className="bg-green-500 text-white px-2 rounded">+</button>
                  <button onClick={()=>updateQty(item.id, -item.qty)} className="text-red-600 text-sm">إزالة</button>
                </div>
              </div>
            ))}
            <div className="mt-3">
              <div className="flex gap-2">
                <input type="text" placeholder="كود الخصم" className="border rounded p-1 flex-1" value={couponCode} onChange={e=>setCouponCode(e.target.value)} />
                <button onClick={applyCoupon} className="bg-yellow-500 text-white px-3 rounded">تطبيق</button>
              </div>
              <div className="flex justify-between mt-2 font-bold">
                <span>الإجمالي بعد الخصم</span>
                <span>{total} د.ع</span>
              </div>
            </div>
            <button onClick={submitOrder} className="w-full bg-teal-600 text-white py-2 rounded mt-3">تأكيد الطلب</button>
            <button onClick={()=>setShowCart(false)} className="w-full text-gray-500 mt-2">إغلاق</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* عرض الصورة المكبرة */}
      {enlargedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={()=>setEnlargedImage(null)}>
          <img src={enlargedImage} className="max-w-full max-h-full object-contain" />
          <button className="absolute top-4 left-4 text-white text-2xl bg-black bg-opacity-50 rounded-full w-10 h-10">✕</button>
        </div>
      )}

      {/* الاقتراحات الذكية */}
      {suggestions.length > 0 && (
        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="fixed bottom-28 left-4 right-4 bg-white dark:bg-gray-800 shadow-xl rounded-lg p-3 z-20 border-t-4 border-orange-500">
          <p className="font-bold">قد يعجبك أيضاً:</p>
          <div className="flex gap-2 mt-2">
            {suggestions.map(s => {
              const existingItem = menuItems.find(i => i.name === s.name);
              return existingItem ? (
                <button key={s.name} onClick={()=>addToCart(existingItem)} className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm">
                  {s.name} - {s.price} د.ع
                </button>
              ) : null;
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
