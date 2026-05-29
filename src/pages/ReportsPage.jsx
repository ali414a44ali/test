import { useState, useEffect } from "react";
import { useOrders } from "../contexts/OrderContext";
import { Line, Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from "chart.js";
import QRCode from "qrcode";
import LanguageSwitcher from "../components/LanguageSwitcher";
import toast from "react-hot-toast";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function ReportsPage() {
  const { orders, menuItems } = useOrders();
  const [dailySales, setDailySales] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [tableCount, setTableCount] = useState(12);

  useEffect(() => {
    computeStats();
    generateQRCodes();
  }, [orders, menuItems]);

  const computeStats = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0,10);
    }).reverse();
    const sales = last7Days.map(day => {
      return orders.filter(o => o.created_at?.startsWith(day)).reduce((sum, o) => sum + o.total, 0);
    });
    setDailySales(sales);

    const itemCount = {};
    orders.forEach(order => {
      order.items.forEach(item => { itemCount[item.name] = (itemCount[item.name] || 0) + item.qty; });
    });
    const sorted = Object.entries(itemCount).sort((a,b) => b[1]-a[1]).slice(0,5);
    setTopItems(sorted);
  };

  const generateQRCodes = async () => {
    const codes = [];
    for (let i=1; i<=tableCount; i++) {
      const url = `${baseUrl}/table/${i}`;
      const qr = await QRCode.toDataURL(url);
      codes.push({ table: i, qr, url });
    }
    setQrCodes(codes);
  };

  const backupData = async () => {
    const backup = { orders, menuItems, exportedAt: new Date() };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type: "application/json"});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `backup-${Date.now()}.json`;
    link.click();
    toast.success("تم تصدير النسخة الاحتياطية");
  };

  const lineData = { labels: ["أمس", "قبل أمس", "3 أيام", "4 أيام", "5 أيام", "6 أيام", "اليوم"], datasets: [{ label: "المبيعات اليومية (د.ع)", data: dailySales.reverse(), borderColor: "#0f766e", fill: false }] };
  const barData = { labels: topItems.map(t=>t[0]), datasets: [{ label: "الكمية المباعة", data: topItems.map(t=>t[1]), backgroundColor: "#f97316" }] };
  const categorySales = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const cat = menuItems.find(i=>i.name===item.name)?.category || "أخرى";
      categorySales[cat] = (categorySales[cat] || 0) + (item.price * item.qty);
    });
  });
  const pieData = { labels: Object.keys(categorySales), datasets: [{ data: Object.values(categorySales), backgroundColor: ["#0f766e","#f97316","#14b8a6","#c2410c"] }] };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">التقارير والإحصائيات</h1>
        <div className="flex gap-2"><LanguageSwitcher /><button onClick={backupData} className="bg-teal-600 text-white px-3 py-1 rounded">نسخ احتياطي</button></div>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow"><Line data={lineData} /></div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow"><Bar data={barData} /></div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow"><Pie data={pieData} /></div>
        <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
          <h3 className="font-bold">مؤشرات سريعة</h3>
          <p>إجمالي الطلبات: {orders.length}</p>
          <p>إجمالي الإيرادات: {orders.reduce((s,o)=>s+o.total,0)} د.ع</p>
          <p>متوسط قيمة الطلب: {orders.length ? (orders.reduce((s,o)=>s+o.total,0)/orders.length).toFixed(0) : 0} د.ع</p>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
        <h2 className="font-bold text-lg mb-2">إنشاء رموز QR للطاولات</h2>
        <div className="flex gap-2 mb-3">
          <input type="text" className="border rounded p-2 flex-1" placeholder="رابط الموقع" value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} />
          <input type="number" className="border rounded p-2 w-24" value={tableCount} onChange={e=>setTableCount(+e.target.value)} />
          <button onClick={generateQRCodes} className="bg-teal-600 text-white px-4 rounded">توليد</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-auto">
          {qrCodes.map(q => (
            <div key={q.table} className="border p-2 text-center">
              <img src={q.qr} alt={`طاولة ${q.table}`} className="w-24 h-24 mx-auto" />
              <div>طاولة {q.table}</div>
              <a href={q.url} target="_blank" className="text-xs text-blue-500">رابط</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
