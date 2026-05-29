import { useLanguage } from "../contexts/LanguageContext";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <select
      value={lang}
      onChange={(e) => setLang(e.target.value)}
      className="border rounded p-1 text-sm bg-white dark:bg-gray-800"
    >
      <option value="ar">العربية</option>
      <option value="en">English</option>
      <option value="ku">Kurdî</option>
    </select>
  );
}
