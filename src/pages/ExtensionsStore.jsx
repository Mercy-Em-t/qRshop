import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

const MODULE_DEFINITIONS = [
  {
    id: "ai_brain",
    name: "Shop Brain & AI Suite",
    icon: "🧠",
    color: "indigo",
    description: "Train a custom AI sales assistant, auto-generate SEO copy, and map FAQs automatically.",
    pro_only: false
  },
  {
    id: "google_shopping",
    name: "Google Merchant Sync",
    icon: "🛒",
    color: "blue",
    description: "Connect your inventory directly to Google Shopping and automate product feeds.",
    pro_only: false
  },
  {
    id: "marketing_campaigns",
    name: "Marketing & Campaigns",
    icon: "🎯",
    color: "purple",
    description: "Create targeted promotions, bundled deals, and run advanced QR marketing campaigns.",
    pro_only: false // Note: The campaigns page itself might enforce Pro, but unlocking it is free
  },
  {
    id: "advanced_attributes",
    name: "Advanced Product Attributes",
    icon: "🏷️",
    color: "orange",
    description: "Unlock the Attribute Manager and complex product blueprints for variants, sizing, and specific fields.",
    pro_only: false
  }
];

export default function ExtensionsStore() {
  const [shopId, setShopId] = useState(null);
  const [enabledModules, setEnabledModules] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchShopInfo = async () => {
      const user = getCurrentUser();
      const currentShopId = user?.shop_id || sessionStorage.getItem('active_shop_id');
      
      if (!currentShopId) {
        // Find first shop if not set
        const { data: shops } = await supabase.from("shops").select("shop_id").limit(1);
        if (shops && shops.length > 0) {
          setShopId(shops[0].shop_id);
        } else {
          setIsLoading(false);
        }
        return;
      }
      setShopId(currentShopId);
    };
    fetchShopInfo();
  }, []);

  useEffect(() => {
    if (shopId) {
      loadShopModules();
    }
  }, [shopId]);

  const loadShopModules = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("created_at, enabled_modules")
        .eq("shop_id", shopId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setEnabledModules(data.enabled_modules || {});
      }
    } catch (err) {
      console.error("Failed to load modules", err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasModule = (moduleId) => {
    return enabledModules?.[moduleId] === true;
  };

  const handleToggleModule = async (moduleId) => {
    setProcessingId(moduleId);
    const newValue = !(enabledModules?.[moduleId] === true);
    const newModules = { ...enabledModules, [moduleId]: newValue };
    
    try {
      const { error } = await supabase
        .from("shops")
        .update({ enabled_modules: newModules })
        .eq("shop_id", shopId);
        
      if (error) throw error;
      
      setEnabledModules(newModules);
    } catch (err) {
      console.error("Failed to toggle module", err);
      alert("Failed to update module settings.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto min-h-screen pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🧩 Extensions Store
          </h1>
          <p className="text-gray-500 mt-1">
            Unlock advanced power-ups and add-ons for your storefront.
          </p>
        </div>
        <Link
          to="/a/dashboard"
          className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium shadow-sm hover:bg-gray-50 transition flex items-center gap-2 self-start md:self-auto"
        >
          <span>←</span> Back to Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MODULE_DEFINITIONS.map(mod => {
              const isActive = hasModule(mod.id);
              const isProcessing = processingId === mod.id;
              
              // Color mappings for styling
              const colorMaps = {
                indigo: "from-indigo-50 to-white border-indigo-100 hover:border-indigo-300",
                blue: "from-blue-50 to-white border-blue-100 hover:border-blue-300",
                purple: "from-purple-50 to-white border-purple-100 hover:border-purple-300",
                orange: "from-orange-50 to-white border-orange-100 hover:border-orange-300"
              };
              
              const activeColorMaps = {
                indigo: "bg-indigo-600 hover:bg-indigo-700",
                blue: "bg-blue-600 hover:bg-blue-700",
                purple: "bg-purple-600 hover:bg-purple-700",
                orange: "bg-orange-600 hover:bg-orange-700"
              };

              return (
                <div 
                  key={mod.id}
                  className={`bg-gradient-to-br ${colorMaps[mod.color]} rounded-2xl shadow-sm p-6 border-2 transition-all relative overflow-hidden flex flex-col h-full`}
                >
                  {/* Background decoration */}
                  <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${mod.color}-500/10 rounded-full blur-2xl`}></div>
                  
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-2xl">
                      {mod.icon}
                    </div>
                    {isActive && (
                      <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Installed
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2 relative z-10">{mod.name}</h3>
                  <p className="text-gray-600 text-sm mb-6 flex-grow relative z-10">
                    {mod.description}
                  </p>
                  
                  <div className="mt-auto relative z-10 border-t border-gray-100 pt-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      {mod.pro_only ? "Pro Plan Required" : "Free Add-on"}
                    </span>
                    
                    <button
                      onClick={() => handleToggleModule(mod.id)}
                      disabled={isProcessing}
                      className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                          isActive 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                            : `${activeColorMaps[mod.color]} text-white shadow-md hover:shadow-lg`
                      }`}
                    >
                      {isProcessing ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating...
                        </span>
                      ) : isActive ? "Uninstall" : "Install Module"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
