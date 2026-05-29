import { motion, AnimatePresence } from "framer-motion";

export default function CartDrawer({ open, onClose, cart, updateQty, removeItem, total }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          className="fixed top-0 left-0 right-0 bottom-0 bg-white dark:bg-gray-900 z-50 p-4 overflow-auto"
        >
          <button onClick={onClose} className="absolute top-2 left-2 text-2xl">✕</button>
          <h2 className="text-xl font-bold mb-4">سلة الطلب</h2>
          {Object.values(cart).map(item => (
            <div key={item.id} className="border-b py-2 flex justify-between">
              <div>
                {item.name} × {item.qty}
                <div className="text-sm text-gray-500">{item.note || ""}</div>
              </div>
              <div className="flex gap-2 items-center">
                <span>{item.price * item.qty} د.ع</span>
                <button onClick={() => updateQty(item.id, -1)} className="bg-red-500 text-white px-2">-</button>
                <button onClick={() => updateQty(item.id, 1)} className="bg-green-500 text-white px-2">+</button>
                <button onClick={() => removeItem(item.id)} className="text-red-600">حذف</button>
              </div>
            </div>
          ))}
          <div className="mt-4 text-xl font-bold">الإجمالي: {total} د.ع</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
