import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";
import { validateImageFile } from "../utils/security";

// ── Hard boundary constants ──────────────────────────────────────────────────
const ALLOWED_SECTIONS = ["hero", "categories", "featured_grid", "value_props", "cta", "footer"];
const ALLOWED_FONTS    = ["Outfit", "Inter", "Roboto", "Playfair Display", "Montserrat", "Lato", "Poppins"];
const MAX_TITLE_LEN    = 80;
const MAX_SUBTITLE_LEN = 120;
const MAX_TAGLINE_LEN  = 140;
const MAX_CSS_LEN      = 5000;
const HEX_REGEX        = /^#[0-9A-Fa-f]{6}$/;

// Sanitise custom CSS — strips anything dangerous before it ever hits the DB
function sanitiseCss(raw = "") {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, "")     // no script tags
    .replace(/javascript\s*:/gi, "")                  // no js: URIs
    .replace(/@import\s+/gi, "")                      // no imports
    .replace(/expression\s*\(/gi, "")                 // no IE expressions
    .replace(/behavior\s*:/gi, "")                    // no IE behaviors
    .replace(/url\s*\(\s*['"]?\s*javascript/gi, "")  // no js in url()
    .slice(0, MAX_CSS_LEN);
}

function isValidHex(val) { return HEX_REGEX.test(val); }
function clampStr(val, max) { return String(val || "").slice(0, max); }

// Validates and normalises the full config before saving
function sanitiseConfig(config) {
  const layout = Array.isArray(config.layout)
    ? config.layout.filter(s => ALLOWED_SECTIONS.includes(s))
    : ["hero", "categories", "featured_grid", "value_props", "cta"];

  const theme = {
    primary_color:   isValidHex(config.theme?.primary_color)   ? config.theme.primary_color   : "#6366f1",
    secondary_color: isValidHex(config.theme?.secondary_color) ? config.theme.secondary_color : "#10b981",
    font_family:     ALLOWED_FONTS.includes(config.theme?.font_family) ? config.theme.font_family : "Outfit",
  };

  const wordings = {
    hero_title:    clampStr(config.wordings?.hero_title,    MAX_TITLE_LEN),
    hero_subtitle: clampStr(config.wordings?.hero_subtitle, MAX_SUBTITLE_LEN),
  };

  return { layout, theme, wordings };
}

const SECTION_LABELS = {
  hero:          { label: "Hero Banner",    icon: "🏔️" },
  categories:    { label: "Category Row",   icon: "📂" },
  featured_grid: { label: "Featured Grid",  icon: "🛍️" },
  value_props:   { label: "Value Props",    icon: "✅" },
  cta:           { label: "Call to Action", icon: "🚀" },
  footer:        { label: "Footer",         icon: "🔻" },
};

export default function ShopAppearance({ adminShopId = null }) {
  const navigate = useNavigate();
  const user     = getCurrentUser();
  const shopId   = adminShopId || user?.shop_id || sessionStorage.getItem("active_shop_id");

  const [shop,       setShop]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState(null);
  const [logoFile,   setLogoFile]   = useState(null);
  const [logoPreview,setLogoPreview]= useState(null);
  const [uploading,  setUploading]  = useState(false);
  const logoInputRef = useRef(null);

  // Editable state
  const [layout,       setLayout]       = useState([...ALLOWED_SECTIONS.slice(0, 5)]);
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [secondaryColor, setSecondaryColor] = useState("#10b981");
  const [fontFamily,   setFontFamily]   = useState("Outfit");
  const [heroTitle,    setHeroTitle]    = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [tagline,      setTagline]      = useState("");
  const [customCss,    setCustomCss]    = useState("");
  const [logoUrl,      setLogoUrl]      = useState("");
  const [cssWarning,   setCssWarning]   = useState(false);

  useEffect(() => {
    if (!user && !adminShopId) { navigate("/login"); return; }
    fetchShop();
  }, [shopId]);

  const fetchShop = async () => {
    if (!shopId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("shops")
        .select("name, tagline, logo_url, appearance_config, custom_css")
        .eq("shop_id", shopId)
        .single();

      if (data) {
        setShop(data);
        const cfg = data.appearance_config || {};
        setLayout(Array.isArray(cfg.layout) ? cfg.layout.filter(s => ALLOWED_SECTIONS.includes(s)) : ["hero","categories","featured_grid","value_props","cta"]);
        setPrimaryColor(isValidHex(cfg.theme?.primary_color)   ? cfg.theme.primary_color   : "#6366f1");
        setSecondaryColor(isValidHex(cfg.theme?.secondary_color)? cfg.theme.secondary_color: "#10b981");
        setFontFamily(ALLOWED_FONTS.includes(cfg.theme?.font_family) ? cfg.theme.font_family : "Outfit");
        setHeroTitle(clampStr(cfg.wordings?.hero_title, MAX_TITLE_LEN));
        setHeroSubtitle(clampStr(cfg.wordings?.hero_subtitle, MAX_SUBTITLE_LEN));
        setTagline(clampStr(data.tagline, MAX_TAGLINE_LEN));
        setCustomCss(data.custom_css || "");
        setLogoUrl(data.logo_url || "");
      }
    } catch (err) {
      console.warn("ShopAppearance fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ── Logo Upload ───────────────────────────────────────────────────────────
  const handleLogoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ── Hard verification of magic number & MIME ──
    const check = await validateImageFile(file);
    if (!check.valid) {
      alert(check.error || "Security Check Failed: File is not a valid photo.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) { alert("Logo must be under 2 MB"); return; }
    if (!["image/jpeg","image/png","image/webp","image/svg+xml"].includes(file.type)) {
      alert("Only JPG, PNG, WEBP, or SVG logos are accepted"); return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const uploadLogo = async () => {
    if (!logoFile || !shopId) return logoUrl;
    setUploading(true);
    try {
      const ext  = logoFile.name.split(".").pop();
      const path = `${shopId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("shop-logos").upload(path, logoFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("shop-logos").getPublicUrl(path);
      const newUrl = urlData?.publicUrl || "";
      setLogoUrl(newUrl);
      setLogoFile(null);
      return newUrl;
    } catch (err) {
      console.error("Logo upload failed:", err);
      alert("Logo upload failed: " + err.message);
      return logoUrl;
    } finally {
      setUploading(false);
    }
  };

  // ── Layout reorder helpers ────────────────────────────────────────────────
  const moveSection = (idx, dir) => {
    const next = [...layout];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setLayout(next);
  };

  const removeSection = (section) => setLayout(layout.filter(s => s !== section));

  const addSection = (section) => {
    if (!layout.includes(section)) setLayout([...layout, section]);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!shopId) return;
    setSaving(true);
    try {
      // 1. Upload logo first (if pending)
      const finalLogoUrl = logoFile ? await uploadLogo() : logoUrl;

      // 2. Sanitise everything before writing
      const cleanConfig = sanitiseConfig({
        layout,
        theme: { primary_color: primaryColor, secondary_color: secondaryColor, font_family: fontFamily },
        wordings: { hero_title: heroTitle, hero_subtitle: heroSubtitle },
      });
      const cleanCss     = sanitiseCss(customCss);
      const cleanTagline = clampStr(tagline, MAX_TAGLINE_LEN);
      const cleanLogo    = (finalLogoUrl || "").startsWith("https://") ? finalLogoUrl : "";

      // 3. Single atomic update
      const { error } = await supabase.from("shops").update({
        appearance_config: cleanConfig,
        custom_css:        cleanCss,
        tagline:           cleanTagline,
        ...(cleanLogo ? { logo_url: cleanLogo } : {}),
      }).eq("shop_id", shopId);

      if (error) throw error;

      // Sync local state with sanitised values
      setCustomCss(cleanCss);
      setLayout(cleanConfig.layout);
      setSaveMsg("✅ Appearance saved!");
    } catch (err) {
      console.error("Appearance save failed:", err);
      setSaveMsg("❌ Save failed: " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3500);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );

  const availableToAdd = ALLOWED_SECTIONS.filter(s => !layout.includes(s));

  return (
    <div className="min-h-screen bg-slate-50 pb-24 overflow-x-hidden">
      {/* Header */}
      {!adminShopId && (
        <header className="bg-white border-b border-slate-100 px-4 py-4 sticky top-0 z-20 shadow-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate("/a")} className="text-indigo-600 font-medium text-sm hover:text-indigo-700 transition">
              ← Dashboard
            </button>
            <h1 className="text-lg font-black text-gray-900">Store Appearance</h1>
            <div className="w-24" />
          </div>
        </header>
      )}

      <form onSubmit={handleSave} className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* ── LOGO UPLOAD ───────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50">
            🖼️ Shop Logo
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Preview */}
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoPreview || logoUrl ? (
                <img src={logoPreview || logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <span className="text-3xl">{shop?.name?.charAt(0) || "🏪"}</span>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <p className="text-sm text-gray-600">
                Upload your shop logo. It appears in the hero section of your public profile page.
              </p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">JPG, PNG, WEBP, SVG — max 2MB</p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition uppercase tracking-widest"
                >
                  {logoFile ? "Change Logo" : "Upload Logo"}
                </button>
                {(logoUrl || logoFile) && (
                  <button
                    type="button"
                    onClick={() => { setLogoFile(null); setLogoPreview(null); setLogoUrl(""); }}
                    className="bg-red-50 text-red-500 border border-red-100 text-xs font-black px-4 py-2.5 rounded-xl hover:bg-red-100 transition uppercase tracking-widest"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleLogoSelect} />
              {logoFile && <p className="text-xs text-indigo-600 font-bold">📎 {logoFile.name} — will upload on save</p>}
            </div>
          </div>
        </section>

        {/* ── BRAND IDENTITY ────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50">
            🎨 Brand Identity
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Primary colour */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Primary Colour</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 flex-shrink-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  maxLength={7}
                  onChange={e => { if (isValidHex(e.target.value) || e.target.value.length <= 7) setPrimaryColor(e.target.value); }}
                  className="flex-1 font-mono text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:border-indigo-500 outline-none min-w-0"
                  placeholder="#6366f1"
                />
              </div>
              {!isValidHex(primaryColor) && <p className="text-[10px] text-red-400 mt-1">Enter a valid hex colour (e.g. #6366f1)</p>}
            </div>
            {/* Secondary colour */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Secondary / Accent Colour</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 flex-shrink-0"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  maxLength={7}
                  onChange={e => { if (isValidHex(e.target.value) || e.target.value.length <= 7) setSecondaryColor(e.target.value); }}
                  className="flex-1 font-mono text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:border-indigo-500 outline-none min-w-0"
                  placeholder="#10b981"
                />
              </div>
            </div>
            {/* Font */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Store Font</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ALLOWED_FONTS.map(font => (
                  <button
                    key={font}
                    type="button"
                    onClick={() => setFontFamily(font)}
                    style={{ fontFamily: font }}
                    className={`py-3 px-3 rounded-xl text-sm border-2 transition-all text-left truncate ${
                      fontFamily === font
                        ? "border-indigo-500 bg-indigo-50 text-indigo-800 font-bold"
                        : "border-slate-100 bg-white text-gray-600 hover:border-slate-300"
                    }`}
                  >
                    {font}
                  </button>
                ))}
              </div>
            </div>
            {/* Live preview swatch */}
            <div className="sm:col-span-2">
              <div className="rounded-2xl p-5 flex items-center gap-4 border border-slate-100" style={{ backgroundColor: primaryColor + "15" }}>
                <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: primaryColor }}></div>
                <div>
                  <p className="font-black text-sm" style={{ color: primaryColor, fontFamily: fontFamily }}>{shop?.name || "Your Shop Name"}</p>
                  <p className="text-xs" style={{ color: secondaryColor, fontFamily: fontFamily }}>Button & accent colour preview</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs font-black px-4 py-2 rounded-full text-white" style={{ backgroundColor: secondaryColor, fontFamily: fontFamily }}>Order Now</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── HERO TEXT & TAGLINE ───────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-5 pb-3 border-b border-slate-50">
            ✏️ Hero Text & Tagline
          </h2>
          <div className="space-y-5">
            <div>
              <label className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <span>Hero Title</span>
                <span className={heroTitle.length >= MAX_TITLE_LEN ? "text-red-400" : "text-gray-300"}>{heroTitle.length}/{MAX_TITLE_LEN}</span>
              </label>
              <input
                type="text"
                value={heroTitle}
                maxLength={MAX_TITLE_LEN}
                onChange={e => setHeroTitle(e.target.value)}
                placeholder={`e.g. Welcome to ${shop?.name || "our Shop"}`}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white transition font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <span>Hero Subtitle</span>
                <span className={heroSubtitle.length >= MAX_SUBTITLE_LEN ? "text-red-400" : "text-gray-300"}>{heroSubtitle.length}/{MAX_SUBTITLE_LEN}</span>
              </label>
              <input
                type="text"
                value={heroSubtitle}
                maxLength={MAX_SUBTITLE_LEN}
                onChange={e => setHeroSubtitle(e.target.value)}
                placeholder="e.g. Fresh • Affordable • Delivered Fast"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white transition font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <span>Short Tagline</span>
                <span className={tagline.length >= MAX_TAGLINE_LEN ? "text-red-400" : "text-gray-300"}>{tagline.length}/{MAX_TAGLINE_LEN}</span>
              </label>
              <input
                type="text"
                value={tagline}
                maxLength={MAX_TAGLINE_LEN}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Kenya's freshest organic grocery store"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 focus:bg-white transition font-medium text-gray-900"
              />
              <p className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wide">This appears in the page meta tag and browser tab title</p>
            </div>
          </div>
        </section>

        {/* ── PAGE LAYOUT ──────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1 pb-0">
            🧩 Page Layout
          </h2>
          <p className="text-xs text-gray-400 mb-5 pb-3 border-b border-slate-50">
            Reorder or remove sections from your public profile page. Only approved sections are allowed.
          </p>
          <div className="space-y-2 mb-4">
            {layout.map((section, idx) => {
              const info = SECTION_LABELS[section] || { label: section, icon: "▪️" };
              return (
                <div key={section} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3 group">
                  <span className="text-lg flex-shrink-0">{info.icon}</span>
                  <span className="flex-1 text-sm font-bold text-gray-700">{info.label}</span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-20 transition">↑</button>
                    <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === layout.length - 1} className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 disabled:opacity-20 transition">↓</button>
                    <button type="button" onClick={() => removeSection(section)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
          {availableToAdd.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableToAdd.map(section => {
                const info = SECTION_LABELS[section] || { label: section, icon: "▪️" };
                return (
                  <button
                    key={section}
                    type="button"
                    onClick={() => addSection(section)}
                    className="flex items-center gap-1.5 px-3 py-2 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
                  >
                    <span>{info.icon}</span> + {info.label}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── CUSTOM CSS ────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">
            ⌨️ Custom CSS
          </h2>
          <p className="text-xs text-amber-600 font-bold mb-4 pb-3 border-b border-slate-50">
            ⚠️ Advanced users only. Dangerous code (scripts, imports, JS URIs) is automatically removed on save.
          </p>
          <textarea
            rows={7}
            value={customCss}
            maxLength={MAX_CSS_LEN + 200}
            onChange={e => {
              setCustomCss(e.target.value);
              setCssWarning(/<script|javascript:/i.test(e.target.value));
            }}
            placeholder={`.hero { background: linear-gradient(135deg, #1a1a2e, #16213e); }\n.hero__heading { font-size: 2.5rem; }`}
            className="w-full bg-gray-900 text-green-400 font-mono text-xs rounded-2xl px-5 py-4 border-none outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <div className="flex justify-between mt-2">
            {cssWarning && <p className="text-[10px] text-red-500 font-bold">⚠️ Dangerous code detected — it will be stripped on save</p>}
            <p className="text-[10px] text-gray-300 ml-auto">{customCss.length}/{MAX_CSS_LEN} chars</p>
          </div>
        </section>

        {/* ── SAVE BAR ─────────────────────────────────── */}
        <div className="sticky bottom-4 z-10">
          <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-3xl shadow-2xl px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black text-gray-700 uppercase tracking-widest">Store Appearance</p>
              <p className="text-[10px] text-gray-400">Changes apply to your public profile page immediately after save</p>
            </div>
            <button
              type="submit"
              disabled={saving || uploading}
              className="bg-indigo-600 text-white font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {uploading ? "Uploading Logo..." : saving ? "Saving..." : "💾 Save Appearance"}
            </button>
          </div>
        </div>
      </form>

      {/* Toast */}
      {saveMsg && (
        <div className="fixed top-6 right-4 left-4 sm:left-auto sm:w-80 bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl z-50 border border-slate-700 text-xs font-bold uppercase tracking-widest animate-in">
          {saveMsg}
        </div>
      )}
    </div>
  );
}
