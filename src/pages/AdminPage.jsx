import { useState, useEffect } from "react";
import { useOrders } from "../contexts/OrderContext";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function AdminPage() {
  const { menuItems, addMenuItem, deleteMenuItem, updateMenuItem } = useOrders();
  const [form, setForm] = useState({ name: "", category: "الأطباق الرئيسية", price: "", description: "", image_url: "", available: true });
  const [uploading, setUploading] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: "", type: "percentage", value: "", expires_at: "" });

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    const { data } = await supabase.from("coupons").select("*");
    if (data) setCoupons(data);
  }

  async function uploadImage(file) {
    if (!file) return;
    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("menu-images").upload(fileName, file);
    if (error) { toast.error("فشل رفع الصورة"); setUploading(false); return null; }
    const { data: { publicUrl } } = supabase.storage.from("menu-images").getPublicUrl(fileName);
    setUploading(false);
    return publicUrl;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return toast.error("املأ الحقول المطلوبة");
    const newItem = {
      id: `item-${Date.now()}`,
      name: form.name,
      category: form.category,
      price: Number(form.price),
      description: form.description,
      image_url: form.image_url,
      available: form.available,
      rating_avg: 0,
      rating_count: 0
    };
    await addMenuItem(newItem);
    setForm({ name: "", category: "الأطباق الرئيسية", price: "", description: "", image_url: "", available: true });
    toast.success("تمت الإضافة");
  };

  const addCoupon = async () => {
    if (!couponForm.code || !couponForm.value) return toast.error("املأ الكود والقيمة");
    const { error } = await supabase.from("coupons").insert({
      code: couponForm.code,
      type: couponForm.type,
      value: Number(couponForm.value),
      expires_at: couponForm.expires_at || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("تمت إضافة الكوبون"); fetchCoupons(); setCouponForm({ code: "", type: "percentage", value: "", expires_at: "" }); }
  };

  const deleteCoupon = async (id) => {
    await supabase.from("coupons").delete().eq("id", id);
    fetchCoupons();
    toast.success("تم الحذف");
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">إدارة المنيو والكوبونات</h1>
        <LanguageSwitcher />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* إضافة صنف */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">إضافة صنف جديد</h2>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input type="text" placeholder="الاسم" className="w-full border rounded p-2" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
            <select className="w-full border rounded p-2" value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
              <option>المقبلات</option><option>الأطباق الرئيسية</option><option>المشروبات</option><option>الحلويات</option>
            </select>
            <input type="number" placeholder="السعر" className="w-full border rounded p-2" value={form.price} onChange={e=>setForm({...form, price:e.target.value})} required />
            <textarea placeholder="الوصف" className="w-full border rounded p-2" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
            <div>
              <label className="block text-sm">رفع صورة</label>
              <input type="file" accept="image/*" onChange={async (e)=>{ const url = await uploadImage(e.target.files[0]); if(url) setForm({...form, image_url: url}); }} />
              {form.image_url && <img src={form.image_url} className="w-20 h-20 object-cover mt-1" />}
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={form.available} onChange={e=>setForm({...form, available:e.target.checked})} /> متوفر</label>
            <button type="submit" disabled={uploading} className="bg-teal-600 text-white px-4 py-2 rounded w-full">إضافة</button>
          </form>
        </div>

        {/* إدارة الكوبونات */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="font-bold text-lg mb-2">كوبونات الخصم</h2>
          <div className="space-y-2 mb-4">
            <input type="text" placeholder="الكود" className="border rounded p-2 w-full" value={couponForm.code} onChange={e=>setCouponForm({...couponForm, code:e.target.value})} />
            <select className="border rounded p-2 w-full" value={couponForm.type} onChange={e=>setCouponForm({...couponForm, type:e.target.value})}>
              <option value="percentage">نسبة مئوية</option><option value="fixed">قيمة ثابتة</option><option value="bogo">اشتر 1 واحصل 1</option>
            </select>
            <input type="number" placeholder="القيمة" className="border rounded p-2 w-full" value={couponForm.value} onChange={e=>setCouponForm({...couponForm, value:e.target.value})} />
            <input type="datetime-local" className="border rounded p-2 w-full" value={couponForm.expires_at} onChange={e=>setCouponForm({...couponForm, expires_at:e.target.value})} />
            <button onClick={addCoupon} className="bg-yellow-600 text-white px-4 py-2 rounded w-full">إضافة كوبون</button>
          </div>
          <ul className="space-y-1 max-h-60 overflow-auto">
            {coupons.map(c => (
              <li key={c.id} className="flex justify-between items-center border-b py-1">
                <span><strong>{c.code}</strong> - {c.type==="percentage"?`${c.value}%`: `${c.value} د.ع`}</span>
                <button onClick={()=>deleteCoupon(c.id)} className="text-red-600 text-sm">حذف</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* قائمة الأصناف الحالية مع إمكانية الحذف */}
      <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="font-bold text-lg mb-2">الأصناف الحالية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {menuItems.map(item => (
            <div key={item.id} className="flex justify-between items-center border-b py-2">
              <div>
                <strong>{item.name}</strong> - {item.price} د.ع - {item.category}
                {!item.available && <span className="text-red-500 text-xs mr-2">(غير متوفر)</span>}
              </div>
              <button onClick={()=>deleteMenuItem(item.id)} className="bg-red-600 text-white px-2 py-1 rounded text-sm">حذف</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
