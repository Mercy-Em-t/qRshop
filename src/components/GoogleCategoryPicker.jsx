import React, { useState, useEffect, useMemo } from 'react';
import { 
  getL1Categories, 
  getL2Categories, 
  getL3Categories, 
  getL4Categories,
  findLeafEntry,
  entryToPath,
  findById 
} from '../data/google-taxonomy';

export default function GoogleCategoryPicker({ value, onChange }) {
  const [l1, setL1] = useState("");
  const [l2, setL2] = useState("");
  const [l3, setL3] = useState("");
  const [l4, setL4] = useState("");

  const [l1Search, setL1Search] = useState("");
  const [l2Search, setL2Search] = useState("");
  const [l3Search, setL3Search] = useState("");

  // Initialize from value (ID)
  useEffect(() => {
    if (value && typeof value === 'number') {
      const entry = findById(value);
      if (entry) {
        setL1(entry[1] || "");
        setL2(entry[2] || "");
        setL3(entry[3] || "");
        setL4(entry[4] || "");
      }
    } else {
      setL1("");
      setL2("");
      setL3("");
      setL4("");
    }
  }, [value]);

  const l1Options = useMemo(() => getL1Categories(), []);
  const l2Options = useMemo(() => getL2Categories(l1), [l1]);
  const l3Options = useMemo(() => getL3Categories(l1, l2), [l1, l2]);
  const l4Options = useMemo(() => getL4Categories(l1, l2, l3), [l1, l2, l3]);

  const filteredL1 = l1Options.filter(o => o.toLowerCase().includes(l1Search.toLowerCase()));
  const filteredL2 = l2Options.filter(o => o.toLowerCase().includes(l2Search.toLowerCase()));
  const filteredL3 = l3Options.filter(o => o.toLowerCase().includes(l3Search.toLowerCase()));

  const triggerChange = (newL1, newL2, newL3, newL4) => {
    const entry = findLeafEntry(newL1, newL2, newL3, newL4);
    if (entry) {
      onChange(entry[0], entryToPath(entry));
    } else {
      onChange(null, "");
    }
  };

  const handleL1Select = (e) => {
    const val = e.target.value;
    setL1(val); setL2(""); setL3(""); setL4("");
    triggerChange(val, "", "", "");
  };

  const handleL2Select = (e) => {
    const val = e.target.value;
    setL2(val); setL3(""); setL4("");
    triggerChange(l1, val, "", "");
  };

  const handleL3Select = (e) => {
    const val = e.target.value;
    setL3(val); setL4("");
    triggerChange(l1, l2, val, "");
  };

  const handleL4Select = (e) => {
    const val = e.target.value;
    setL4(val);
    triggerChange(l1, l2, l3, val);
  };

  return (
    <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
      
      {/* Level 1 */}
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category Level 1</label>
        <select 
          value={l1} 
          onChange={handleL1Select}
          className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="">-- Select Top Category --</option>
          {l1Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      {/* Level 2 */}
      {l1 && l2Options.length > 0 && (
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category Level 2</label>
          <select 
            value={l2} 
            onChange={handleL2Select}
            className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Select Sub-category --</option>
            {l2Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      )}

      {/* Level 3 */}
      {l2 && l3Options.length > 0 && (
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category Level 3</label>
          <select 
            value={l3} 
            onChange={handleL3Select}
            className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Select Specific Category --</option>
            {l3Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      )}

      {/* Level 4 (rare but happens) */}
      {l3 && l4Options.length > 0 && (
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Category Level 4</label>
          <select 
            value={l4} 
            onChange={handleL4Select}
            className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">-- Select Even More Specific Category --</option>
            {l4Options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
      )}

      {/* Result Display */}
      {value && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">Selected Path</p>
            <p className="text-xs text-blue-900 font-medium">
              {entryToPath(findById(value))}
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <span className="inline-block bg-white text-blue-800 font-mono text-[10px] font-bold px-2 py-1 rounded border border-blue-200 shadow-sm">
              ID: {value}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
