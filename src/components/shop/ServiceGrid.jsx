import React, { useState } from 'react';
import { createServiceLead } from '../../services/service-domain';
import './ProductGrid.css';

export default function ServiceGrid({ services = [], shopId }) {
  const [selectedService, setSelectedService] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_contact: '',
    customer_needs: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  if (!services || services.length === 0) return null;

  const handleOpenModal = (service) => {
    setSelectedService(service);
    setSuccessMsg('');
    setFormData({
      customer_name: '',
      customer_contact: '',
      customer_needs: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createServiceLead({
        shop_id: shopId,
        service_id: selectedService?.id || null,
        customer_name: formData.customer_name,
        customer_contact: formData.customer_contact,
        customer_needs: formData.customer_needs,
        status: 'new'
      });
      setSuccessMsg("Inquiry sent successfully! We'll be in touch soon.");
      setTimeout(() => setSelectedService(null), 3000);
    } catch (err) {
      alert("Error sending inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="product-grid bg-slate-50 py-12 px-4 rounded-3xl my-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-2">Expertise</p>
          <h2 className="text-3xl font-black text-gray-900">Professional Services</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{service.description}</p>
              </div>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                <span className="font-semibold text-gray-900">
                  {service.base_price ? `From KSh ${service.base_price}` : 'Custom Pricing'}
                </span>
                <button 
                  onClick={() => handleOpenModal(service)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition"
                >
                  Request Info
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Request Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl"
            >
              &times;
            </button>
            
            <h3 className="text-xl font-black text-gray-900 mb-1">Inquire About Service</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium bg-gray-50 p-2 rounded text-center">{selectedService.name}</p>

            {successMsg ? (
              <div className="bg-green-50 text-green-700 p-6 rounded-2xl border border-green-200 text-center font-bold">
                <span className="text-3xl block mb-2">🎉</span>
                {successMsg}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.customer_name}
                    onChange={e => setFormData({...formData, customer_name: e.target.value})}
                    className="w-full border-2 border-gray-100 focus:border-indigo-500 rounded-xl px-4 py-2.5 outline-none transition"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Contact (Phone/Email)</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.customer_contact}
                    onChange={e => setFormData({...formData, customer_contact: e.target.value})}
                    className="w-full border-2 border-gray-100 focus:border-indigo-500 rounded-xl px-4 py-2.5 outline-none transition"
                    placeholder="0712345678 or jane@email.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">How can we help?</label>
                  <textarea 
                    required 
                    rows="4"
                    value={formData.customer_needs}
                    onChange={e => setFormData({...formData, customer_needs: e.target.value})}
                    className="w-full border-2 border-gray-100 focus:border-indigo-500 rounded-xl px-4 py-2.5 outline-none transition resize-none"
                    placeholder="Tell us briefly about your requirements..."
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-400 text-white font-black py-3.5 rounded-xl transition mt-2"
                >
                  {submitting ? 'Sending Inquiry...' : 'Send Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
