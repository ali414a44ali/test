import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { useSound } from "../hooks/useSound";

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [tablesStatus, setTablesStatus] = useState({});
  const playSound = useSound("/sound-notify.mp3");

  useEffect(() => {
    fetchOrders();
    fetchMenu();
    subscribeRealtime();
  }, []);

  async function fetchOrders() {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  }
  async function fetchMenu() {
    const { data } = await supabase.from("menu_items").select("*");
    if (data) setMenuItems(data);
  }
  function subscribeRealtime() {
    const channel = supabase
      .channel("orders-channel")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        setOrders(prev => [payload.new, ...prev]);
        playSound();
        toast.success(`طلب جديد من طاولة ${payload.new.table_number}`);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload) => {
        setOrders(prev => prev.map(o => (o.id === payload.new.id ? payload.new : o)));
        if (payload.new.status === "ready") toast(`الطلب ${payload.new.id} جاهز`);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }

  async function addOrder(order) {
    const { error } = await supabase.from("orders").insert(order);
    if (error) toast.error("فشل إرسال الطلب");
  }
  async function updateOrderStatus(orderId, newStatus) {
    await supabase.from("orders").update({ status: newStatus, updated_at: new Date() }).eq("id", orderId);
  }
  async function updateMenuItem(item) {
    await supabase.from("menu_items").upsert(item);
  }
  async function addMenuItem(item) {
    await supabase.from("menu_items").insert(item);
  }
  async function deleteMenuItem(itemId) {
    await supabase.from("menu_items").delete().eq("id", itemId);
  }

  return (
    <OrderContext.Provider value={{ orders, menuItems, tablesStatus, addOrder, updateOrderStatus, updateMenuItem, addMenuItem, deleteMenuItem }}>
      {children}
    </OrderContext.Provider>
  );
}
export const useOrders = () => useContext(OrderContext);
