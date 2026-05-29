export default function OrderCard({ order, onStatusChange, onPrint }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
      <div className="flex justify-between items-center border-b pb-2">
        <span className="font-bold">طاولة {order.table_number}</span>
        <span className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</span>
      </div>
      <ul className="my-2">
        {order.items.map((item, idx) => (
          <li key={idx} className="text-sm">
            {item.name} × {item.qty} - {item.price * item.qty} د.ع
            {item.note && <span className="text-gray-400 block text-xs">ملاحظة: {item.note}</span>}
          </li>
        ))}
      </ul>
      <div className="flex justify-between items-center mt-2">
        <span className="font-bold">المجموع: {order.total} د.ع</span>
        <div className="flex gap-2">
          {["confirmed","preparing","ready","delivered"].map(status => (
            <button
              key={status}
              onClick={() => onStatusChange(order.id, status)}
              className="px-2 py-1 bg-teal-600 text-white text-xs rounded"
            >
              {status === "confirmed" ? "استلام" : status === "preparing" ? "تحضير" : status === "ready" ? "جاهز" : "توصيل"}
            </button>
          ))}
          <button onClick={() => onPrint(order)} className="px-2 py-1 bg-gray-500 text-white text-xs rounded">طباعة</button>
        </div>
      </div>
    </div>
  );
}
