import React from 'react';

export default function VariationBuilder({ field, value, onChange }) {
  const variations = Array.isArray(value) ? value : [];

  const addOption = () => {
    onChange([...variations, { label: "", price: 0 }]);
  };

  const updateOption = (index, updates) => {
    const newVars = [...variations];
    newVars[index] = { ...newVars[index], ...updates };
    onChange(newVars);
  };

  const removeOption = (index) => {
    onChange(variations.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3 bg-white p-4 rounded-xl border border-orange-100">
      <p className="text-[10px] text-orange-400 font-bold uppercase italic">
        Define options for this umbrella item (e.g. 250g, 500g)
      </p>
      <div className="space-y-2">
        {variations.map((v, idx) => (
          <div key={idx} className="flex gap-2">
            <input 
              type="text"
              placeholder="Option (e.g. 500g)"
              value={v.label || ""}
              onChange={e => updateOption(idx, { label: e.target.value })}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm"
            />
            <input 
              type="number"
              placeholder="Price"
              value={v.price || ""}
              onChange={e => updateOption(idx, { price: parseFloat(e.target.value) })}
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-xs shadow-sm font-bold text-orange-600"
            />
            <button 
              type="button"
              onClick={() => removeOption(idx)}
              className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
        <button 
          type="button"
          onClick={addOption}
          className="text-[10px] font-black uppercase text-orange-600 hover:text-orange-700 flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Option
        </button>
      </div>
    </div>
  );
}
