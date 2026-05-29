import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ar: { translation: { welcome: "مرحباً", order: "طلب", table: "طاولة", total: "المجموع", send: "إرسال", callWaiter: "استدعاء نادل", bill: "طلب الحساب" } },
  en: { translation: { welcome: "Welcome", order: "Order", table: "Table", total: "Total", send: "Send", callWaiter: "Call Waiter", bill: "Request Bill" } },
  ku: { translation: { welcome: "Bi xêr hatî", order: "Ferman", table: "Mêze", total: "Giştî", send: "Bişîne", callWaiter: "Gazî karmend bike", bill: "Daxwaza hesab" } }
};
i18n.use(initReactI18next).init({ resources, lng: "ar", fallbackLng: "ar", interpolation: { escapeValue: false } });
export default i18n;
