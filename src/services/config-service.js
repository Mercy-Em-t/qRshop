import { useState, useEffect } from "react";
import { supabase } from "./supabase-client";

export function useConfig() {
  const [config, setConfig] = useState({
    featureFlags: {},
    loading: true
  });

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from("system_config")
          .select("*");

        if (!error && data) {
          const mapped = data.reduce((acc, curr) => {
            acc[curr.config_key] = curr.config_value;
            return acc;
          }, {});
          
          setConfig({
            featureFlags: mapped.feature_flags || {},
            maintenance: mapped.maintenance_mode || {},
            loading: false
          });
        }
      } catch (err) {
        console.error("Config fetch failed:", err);
        setConfig(prev => ({ ...prev, loading: false }));
      }
    }

    fetchConfig();
  }, []);

  const isFeatureEnabled = (featureKey) => {
    if (config.loading) return true; // Fail open for continuity
    return config.featureFlags[featureKey] !== false;
  };

  return { ...config, isFeatureEnabled };
}
