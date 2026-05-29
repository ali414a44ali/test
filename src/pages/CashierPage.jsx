import { useState, useEffect } from "react";
import { useOrders } from "../contexts/OrderContext";
import { useAuth } from "../contexts/AuthContext";
import OrderCard from "../components/OrderCard";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

export default function CashierPage() {
  const { orders, waiterCalls, billRequests, updateOrderStatus, resolveWaiterCall, resolveBillRequest } = useOrders();
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  const filteredOrders = orders.filter(o => filter === "all" ? true : o.status === filter);

  const printOrder = (order) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl"><head><title>فاتورة ${order.id}</title>
      <style>body{font-family:Tahoma;padding:20px;}table{width:100%;border-collapse:collapse;}th,td{border-bottom:1px solid #ccc;padding:8px;text-align:right;}</style>
      </head><body>
      <h1>مطعم المتوسط</h1>
      <p>الطلب: ${order.id} | طاولة: ${order.table_number} | التاريخ: ${new Date(order.created_at).toLocaleString()}</p>
      <table><thead><tr><th>الصنف</th><th>الكمية</th><th>ملاحظة</th><th>السعر</th></tr></thead><tbody>
      ${order.items.map(item => `<tr><td>${item.name}</td><td>${item.qty}</td><td>${item.note || "-"}</td><td>${item.price * item.qty} د.ع</td></tr>`).join("")}
      </tbody></table>
      <h3>الإجمالي: ${order.total} د.ع</h3>
      <script>window.print();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">لوحة الكاشير</h1>
        <LanguageSwitcher />
      </div>

      {/* إشعارات الاستدعاء وطلبات الفاتورة */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
          <h2 className="font-bold">📢 استدعاءات النادل</h2>
          {waiterCalls.length === 0 && <p className="text-gray-500">لا توجد استدعاءات</p>}
          {waiterCalls.map(call => (
            <div key={call.id} className="flex justify-between items-center border-b py-2">
              <span>طاولة {call.table_number} - {new Date(call.created_at).toLocaleTimeString()}</span>
              <button onClick={()=>resolveWaiterCall(call.id)} className="bg-green-600 text-white px-2 py-1 rounded text-sm">تم</button>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
          <h2 className="font-bold">🧾 طلبات الفاتورة</h2>
          {billRequests.length === 0 && <p className="text-gray-500">لا توجد طلبات فاتورة</p>}
          {billRequests.map(req => (
            <div key={req.id} className="flex justify-between items-center border-b py-2">
              <span>طاولة {req.table_number} - {new Date(req.created_at).toLocaleTimeString()}</span>
              <button onClick={()=>resolveBillRequest(req.id)} className="bg-green-600 text-white px-2 py-1 rounded text-sm">تم</button>
            </div>
          ))}
        </div>
      </div>

      {/* فلترة الطلبات */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {["all","new","confirmed","preparing","ready","delivered"].map(status => (
          <button key={status} onClick={()=>setFilter(status)} className={`px-4 py-1 rounded-full ${filter===status?"bg-teal-600 text-white":"bg-white dark:bg-gray-800"}`}>
            {status === "all" ? "الكل" : status === "new" ? "جديد" : status === "confirmed" ? "مؤكد" : status === "preparing" ? "تحضير" : status === "ready" ? "جاهز" : "مكتمل"}
          </button>
        ))}
      </div>

      {/* قائمة الطلبات */}
      <div className="space-y-3">
        {filteredOrders.map(order => (
          <OrderCard key={order.id} order={order} onStatusChange={updateOrderStatus} onPrint={printOrder} />
        ))}
        {filteredOrders.length === 0 && <div className="text-center text-gray-500 py-10">لا توجد طلبات</div>}
      </div>
    </div>
  );
}
