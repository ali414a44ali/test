import { DragDropContext } from "react-beautiful-dnd";
import { useOrders } from "../contexts/OrderContext";
import KanbanColumn from "../components/KanbanColumn";
import { useState } from "react";
import LanguageSwitcher from "../components/LanguageSwitcher";

const columns = {
  new: "جديد",
  confirmed: "تم الاستلام",
  preparing: "قيد التحضير",
  ready: "جاهز",
  delivered: "مكتمل"
};

export default function KitchenPage() {
  const { orders, updateOrderStatus } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId;
    updateOrderStatus(result.draggableId, newStatus);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">شاشة المطبخ</h1>
        <LanguageSwitcher />
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex overflow-x-auto gap-4 pb-4">
          {Object.entries(columns).map(([status, label]) => (
            <KanbanColumn key={status} title={label} status={status} orders={orders} onCardClick={setSelectedOrder} />
          ))}
        </div>
      </DragDropContext>

      {/* عرض تفاصيل الطلب عند النقر */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={()=>setSelectedOrder(null)}>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg max-w-md w-full" onClick={e=>e.stopPropagation()}>
            <h2 className="font-bold">تفاصيل الطلب - طاولة {selectedOrder.table_number}</h2>
            {selectedOrder.items.map((item, idx) => (
              <div key={idx} className="border-b py-1">
                <strong>{item.name}</strong> × {item.qty} - {item.price * item.qty} د.ع
                {item.note && <div className="text-sm text-gray-500">ملاحظة: {item.note}</div>}
              </div>
            ))}
            <button onClick={()=>setSelectedOrder(null)} className="mt-3 bg-teal-600 text-white px-4 py-1 rounded">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
