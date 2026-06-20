import React, { useState, useEffect } from 'react';
import { getServices, createService, updateService, deleteService } from '../services/service-domain';

export default function ServiceManager() {
  const [shopId, setShopId] = useState(() => sessionStorage.getItem('active_shop_id') || null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    is_active: true
  });

  useEffect(() => {
    if (shopId) {
      loadServices();
    }
  }, [shopId]);

  async function loadServices() {
    setLoading(true);
    const data = await getServices(shopId);
    setServices(data);
    setLoading(false);
  }

  function handleOpenModal(service = null) {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        base_price: service.base_price || '',
        is_active: service.is_active
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        base_price: '',
        is_active: true
      });
    }
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingService) {
        await updateService(editingService.id, formData);
      } else {
        await createService({ ...formData, shop_id: shopId });
      }
      setShowModal(false);
      loadServices();
    } catch (err) {
      alert("Error saving service. Check console.");
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Are you sure you want to delete this service?")) {
      await deleteService(id);
      loadServices();
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Service Offerings</h1>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
        >
          + Add Service
        </button>
      </div>

      {loading ? (
        <p>Loading services...</p>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded border">
          <p className="text-gray-500">No services found. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(s => (
            <div key={s.id} className={`p-4 border rounded shadow-sm bg-white ${!s.is_active ? 'opacity-60' : ''}`}>
              <h3 className="text-lg font-semibold">{s.name}</h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{s.description || "No description"}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="font-medium">
                  {s.base_price ? `Starts at $${s.base_price}` : 'Price varies'}
                </span>
                <div className="space-x-2">
                  <button onClick={() => handleOpenModal(s)} className="text-blue-600 hover:underline text-sm">Edit</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingService ? 'Edit Service' : 'New Service'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service Name *</label>
                <input 
                  type="text" 
                  required
                  className="w-full border p-2 rounded"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  className="w-full border p-2 rounded"
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base Price (Optional)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full border p-2 rounded"
                  value={formData.base_price}
                  onChange={e => setFormData({...formData, base_price: e.target.value})}
                />
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={formData.is_active}
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm">Active (visible to clients)</label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
