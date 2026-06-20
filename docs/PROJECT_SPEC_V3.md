# Smart QR Platform: V3 Architecture Specification (Dashboard & Analytics)

This document provides the **Copilot-ready skeleton** for building the "Platform V3" QR Manager and Analytics Dashboard. It defines the exact file structure, database integration layer, state management patterns, and UI components required to build the control surface.

---

## 1. Project Structure

The interface should be built strictly using this modular structure to ensure clear responsibility separation between Data (hooks), API (lib), Pages (routes), and UI (components).

```text
/src
  /components
    QRCard.jsx          # Display individual QR node
    QRList.jsx          # List of all QRs
    LoadingSpinner.jsx  # Reusable loader
    OfflineAlert.jsx    # Offline warning
    AnalyticsChart.jsx  # Charts for metrics
  /pages
    /dashboard
      index.jsx         # Dashboard landing page
      qr-manager.jsx    # CRUD for QRs
      qr-detail.jsx     # Detail + metrics per QR
      analytics.jsx     # Global analytics
  /hooks
    useQRs.js            # Fetch, add, edit, delete QRs
    useEvents.js         # Fetch events / metrics
    useVisits.js         # Fetch visit stats
  /services (or /lib)
    supabase-client.js   # Supabase client provider
```

---

## 2. Supabase Client

The application uses Supabase exclusively for backend.

```javascript
// src/services/supabase-client.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## 3. Data Hooks (CRUD + Analytics)

All database interactivity must be abstracted into custom hooks. Views should never directly call Supabase.

### 3.1 `useQRs.js`

```javascript
// src/hooks/useQRs.js
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase-client'

export function useQRs(shopId) {
  const [qrs, setQrs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (shopId) fetchQRs()
  }, [shopId])

  async function fetchQRs() {
    setLoading(true)
    const { data, error } = await supabase.from('qrs').select('*').eq('shop_id', shopId)
    if (!error) setQrs(data)
    setLoading(false)
  }

  async function addQR(newQR) {
    const { data, error } = await supabase.from('qrs').insert(newQR).select()
    if (!error && data) setQrs(prev => [...prev, ...data])
    return { data, error }
  }

  async function updateQR(qr_id, updates) {
    const { data, error } = await supabase.from('qrs').update(updates).eq('id', qr_id).select()
    if (!error && data) setQrs(prev => prev.map(q => q.id === qr_id ? data[0] : q))
    return { data, error }
  }

  async function deleteQR(qr_id) {
    const { error } = await supabase.from('qrs').delete().eq('id', qr_id)
    if (!error) setQrs(prev => prev.filter(q => q.id !== qr_id))
    return { error }
  }

  return { qrs, loading, fetchQRs, addQR, updateQR, deleteQR }
}
```

### 3.2 `useEvents.js`

```javascript
// src/hooks/useEvents.js
import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase-client'

export function useEvents(qr_id) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (qr_id) fetchEvents()
  }, [qr_id])

  async function fetchEvents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('qr_id', qr_id)
      .order('timestamp', { ascending: false })
      
    if (!error) setEvents(data)
    setLoading(false)
  }

  // Derived metrics
  const conversionRate = events.length > 0 ?
    events.filter(e => e.event_type === 'order_started' || e.event_type === 'order_completed').length /
    (events.filter(e => e.event_type === 'qr_scanned').length || 1) : 0;

  return { events, loading, conversionRate, fetchEvents }
}
```

---

## 4. UI Components

### 4.1 Dashboard Landing Page

```javascript
// src/pages/dashboard/index.jsx
import QRList from '../../components/QRList'
import { useQRs } from '../../hooks/useQRs'
import LoadingSpinner from '../../components/LoadingSpinner'

export default function Dashboard() {
  const shopId = '11111111-1111-1111-1111-111111111111'; // Mocked for now
  const { qrs, loading } = useQRs(shopId);

  if (loading) return <LoadingSpinner message="Loading Nodes..." />

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
         <h1 className="text-2xl font-bold">QR Manager Dashboard</h1>
         <button className="bg-green-600 text-white px-4 py-2 rounded">Create Node</button>
      </div>
      <QRList qrs={qrs} />
    </div>
  )
}
```

### 4.2 QR List & Cards

```javascript
// src/components/QRList.jsx
import QRCard from './QRCard'

export default function QRList({ qrs }) {
  if (!qrs.length) return <div className="p-8 text-center text-gray-500">No QR nodes deployed yet.</div>
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {qrs.map(qr => (
        <QRCard key={qr.id} qr={qr} />
      ))}
    </div>
  )
}
```

```javascript
// src/components/QRCard.jsx
import { useNavigate } from 'react-router-dom'

export default function QRCard({ qr }) {
  const navigate = useNavigate()
  
  return (
    <div className="border border-gray-200 p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
         <h2 className="font-bold text-lg">{qr.location}</h2>
         <span className={`px-2 py-1 rounded text-xs ${qr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
           {qr.status}
         </span>
      </div>
      <div className="text-sm text-gray-600 mb-4">
         <p>ID: <span className="font-mono">{qr.id}</span></p>
         <p>Action: <span className="font-medium">{qr.action}</span></p>
      </div>
      <button
        onClick={() => navigate(`/dashboard/qr-detail/${qr.id}`)}
        className="w-full mt-2 px-3 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors"
      >
        View Analytics
      </button>
    </div>
  )
}
```

### 4.3 Analytics Dashboard

```javascript
// src/pages/dashboard/analytics.jsx
import { useParams } from 'react-router-dom'
import { useEvents } from '../../hooks/useEvents'
import AnalyticsChart from '../../components/AnalyticsChart'

export default function AnalyticsPage() {
  const { qrId } = useParams()
  const { events, loading, conversionRate } = useEvents(qrId)

  if (loading) return <div className="p-12 text-center">Loading analytics...</div>

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Analytics: Node {qrId}</h1>
      <div className="grid grid-cols-3 gap-4 mb-8">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm">Total Scans</h3>
            <p className="text-2xl font-bold">{events.filter(e => e.event_type === 'qr_scanned').length}</p>
         </div>
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm">Conversion Rate</h3>
            <p className="text-2xl font-bold">{(conversionRate * 100).toFixed(1)}%</p>
         </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold mb-4">Event Stream Timeline</h3>
         {/* <AnalyticsChart events={events} /> */}
         <div className="space-y-2">
            {events.slice(0, 5).map(e => (
               <div key={e.id} className="text-sm p-2 bg-gray-50 rounded flex justify-between">
                 <span className="font-medium">{e.event_type}</span>
                 <span className="text-gray-500">{new Date(e.timestamp).toLocaleTimeString()}</span>
               </div>
            ))}
         </div>
      </div>
    </div>
  )
}
```

---

## 5. Next Implementation Steps (Post-Skeleton)

When expanding this skeleton, prioritize the following tasks:

1. **Routing Updates:** Configure `react-router-dom` in `App.jsx` to map to these new modular files.
2. **Modal Creation:** Build out the QR creation modal directly on the dashboard page so the user doesn't have to navigate to a separate factory page just to spawn a node.
3. **Advanced Charts:** Implement `recharts` for the `AnalyticsChart` component to visually track scan times, zones, and actions over 7/30 day periods.
4. **Permissions:** Prepare the application to differentiate between physical shop personnel Roles and Admin level access.
