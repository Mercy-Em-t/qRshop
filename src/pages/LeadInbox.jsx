import React, { useState, useEffect } from 'react';
import { getServiceLeads, updateServiceLeadStatus } from '../services/service-domain';

export default function LeadInbox() {
  const [shopId, setShopId] = useState(() => sessionStorage.getItem('active_shop_id') || null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (shopId) {
      loadLeads();
    }
  }, [shopId, filter]);

  async function loadLeads() {
    setLoading(true);
    const data = await getServiceLeads(shopId, filter === 'all' ? null : filter);
    setLeads(data);
    setLoading(false);
  }

  async function handleStatusChange(leadId, newStatus) {
    try {
      await updateServiceLeadStatus(leadId, newStatus);
      loadLeads();
    } catch (err) {
      alert("Error updating status.");
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Service Leads Inbox</h1>
        
        <div className="flex space-x-2">
          {['all', 'new', 'contacted', 'converted', 'closed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm capitalize ${filter === f ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p>Loading leads...</p>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded border">
          <p className="text-gray-500">No leads found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map(lead => (
            <div key={lead.id} className="border rounded-lg p-5 bg-white shadow-sm flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-bold text-lg">{lead.customer_name}</h3>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Contact:</strong> {lead.customer_contact}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Service:</strong> {lead.services?.name || 'General Inquiry'}
                </p>
                
                <div className="bg-gray-50 p-3 rounded border text-sm text-gray-800">
                  <p className="font-medium mb-1 text-xs text-gray-500 uppercase">Client Needs:</p>
                  {lead.customer_needs}
                </div>
                
                <p className="text-xs text-gray-400 mt-3">
                  Received: {new Date(lead.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-col space-y-2 min-w-[140px]">
                <span className="text-xs font-semibold text-gray-500 uppercase">Update Status</span>
                {lead.status !== 'new' && (
                  <button onClick={() => handleStatusChange(lead.id, 'new')} className="text-left text-sm px-3 py-1.5 rounded hover:bg-blue-50 text-blue-700 border border-transparent hover:border-blue-200 transition-colors">Mark as New</button>
                )}
                {lead.status !== 'contacted' && (
                  <button onClick={() => handleStatusChange(lead.id, 'contacted')} className="text-left text-sm px-3 py-1.5 rounded hover:bg-yellow-50 text-yellow-700 border border-transparent hover:border-yellow-200 transition-colors">Mark Contacted</button>
                )}
                {lead.status !== 'converted' && (
                  <button onClick={() => handleStatusChange(lead.id, 'converted')} className="text-left text-sm px-3 py-1.5 rounded hover:bg-green-50 text-green-700 border border-transparent hover:border-green-200 transition-colors">Mark Converted</button>
                )}
                {lead.status !== 'closed' && (
                  <button onClick={() => handleStatusChange(lead.id, 'closed')} className="text-left text-sm px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700 border border-transparent hover:border-gray-200 transition-colors">Mark Closed</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
