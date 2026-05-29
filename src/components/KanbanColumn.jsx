import { Droppable, Draggable } from "react-beautiful-dnd";

export default function KanbanColumn({ title, status, orders, onCardClick }) {
  return (
    <Droppable droppableId={status}>
      {(provided) => (
        <div ref={provided.innerRef} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 min-w-[280px]">
          <h3 className="font-bold mb-2 text-center">{title}</h3>
          {orders.filter(o => o.status === status).map((order, idx) => (
            <Draggable key={order.id} draggableId={order.id} index={idx}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className={`bg-white dark:bg-gray-700 p-3 mb-2 rounded shadow cursor-pointer ${snapshot.isDragging ? "opacity-50" : ""}`}
                  onClick={() => onCardClick(order)}
                >
                  <div className="font-bold">طاولة {order.table_number}</div>
                  <div className="text-sm">{order.items.length} أصناف</div>
                  <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleTimeString()}</div>
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
