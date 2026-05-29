import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";
import { useSound } from "../hooks/useSound";

const OrderContext = createContext();

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [billRequests, setBillRequests] = useState([]);
  const playSound = useSound("/sound-notify.mp3");

  useEffect(() => {
    fetchOrders();
    fetchMenu();
    subscribeRealtime();
    fetchWaiterCalls();
    fetchBillRequests();
  }, []);

  async function fetchOrders() {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
  }
  async function fetchMenu() {
    const { data } = await supabase.from("menu_items").select("*");
    if (data) setMenuItems(data);
  }
  async function fetchWaiterCalls() {
    const { data } = await supabase.from("waiter_calls").select("*").order("created_at", { ascending: false });
    if (data) setWaiterCalls(data);
  }
  async function fetchBillRequests() {
    const { data } = await supabase.from("bill_requests").select("*").order("created_at", { ascending: false });
    if (data) setBillRequests(data);
  }

  function subscribeRealtime() {
    const ordersChannel = supabase
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

    const waiterChannel = supabase
      .channel("waiter-calls")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "waiter_calls" }, (payload) => {
        setWaiterCalls(prev => [payload.new, ...prev]);
        toast(`📢 استدعاء نادل من طاولة ${payload.new.table_number}`);
        playSound();
      })
      .subscribe();

    const billChannel = supabase
      .channel("bill-requests")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bill_requests" }, (payload) => {
        setBillRequests(prev => [payload.new, ...prev]);
        toast(`🧾 طلب فاتورة من طاولة ${payload.new.table_number}`);
        playSound();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(waiterChannel);
      supabase.removeChannel(billChannel);
    };
  }

  async function addOrder(order) {
    const { error } = await supabase.from("orders").insert(order);
    if (error) toast.error("فشل إرسال الطلب");
    else toast.success("تم إرسال الطلب");
  }
  async function updateOrderStatus(orderId, newStatus) {
    await supabase.from("orders").update({ status: newStatus, updated_at: new Date() }).eq("id", orderId);
  }
  async function updateMenuItem(item) {
    await supabase.from("menu_items").upsert(item);
    await fetchMenu();
  }
  async function addMenuItem(item) {
    await supabase.from("menu_items").insert(item);
    await fetchMenu();
  }
  async function deleteMenuItem(id) {
    await supabase.from("menu_items").delete().eq("id", id);
    await fetchMenu();
  }
  async function resolveWaiterCall(id) {
    await supabase.from("waiter_calls").delete().eq("id", id);
    await fetchWaiterCalls();
  }
  async function resolveBillRequest(id) {
    await supabase.from("bill_requests").delete().eq("id", id);
    await fetchBillRequests();
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        menuItems,
        waiterCalls,
        billRequests,
        addOrder,
        updateOrderStatus,
        updateMenuItem,
        addMenuItem,
        deleteMenuItem,
        resolveWaiterCall,
        resolveBillRequest,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}
export const useOrders = () => useContext(OrderContext);
