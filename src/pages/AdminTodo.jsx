import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../services/auth-service";

const TODOS = [
  {
    id: "wa-api",
    category: "💬 WhatsApp Business API",
    status: "pending",
    priority: "high",
    title: "Configure Meta WhatsApp Cloud API (Interactive Order Dashboard)",
    summary: "Activate the fully automated WhatsApp mini-dashboard feature for Pro/Business tier shops. When complete, shop owners will receive instant WhatsApp messages with Accept/Reject buttons for every new order.",
    steps: [
      {
        label: "Step 1: Create a Meta Developer Account",
        detail: "Go to developers.facebook.com and sign in with your Facebook account. Click \"My Apps\" → \"Create App\". Select \"Business\" as the App type and give it a name like \"ShopQR Platform\"."
      },
      {
        label: "Step 2: Add the WhatsApp Product",
        detail: "Inside your new Meta App, scroll down to \"Add a Product\" and click \"Set Up\" next to WhatsApp. This creates a Phone Number ID and a Temporary Access Token automatically."
      },
      {
        label: "Step 3: Get Your Credentials",
        detail: "Under WhatsApp → API Setup, note down:\n  • Phone Number ID (format: 1234567890)\n  • Temporary Access Token (a long string starting with EAAA...)\nFor production you will need a Permanent Token via System Users in Business Manager."
      },
      {
        label: "Step 4: Add a Real Phone Number",
        detail: "Under WhatsApp → Phone Numbers, click \"Add Phone Number\". Use the official ShopQR business number. You will need to verify it via OTP. This is the number that ALL order alerts will come from."
      },
      {
        label: "Step 5: Set Secrets in Supabase",
        detail: "Open your Supabase Project Dashboard → Edge Functions → Manage Secrets. Add the following:\n  WA_PHONE_NUMBER_ID = (your Phone Number ID)\n  WA_ACCESS_TOKEN = (your permanent access token from Step 3)\n  WA_VERIFY_TOKEN = shopqr_webhook_2026   ← (you choose this, keep it private)"
      },
      {
        label: "Step 6: Deploy the Edge Functions",
        detail: "In your terminal, navigate to the SHOPQR project directory and run:\n  npx supabase functions deploy whatsapp-dispatch\n  npx supabase functions deploy whatsapp-webhook\nConfirm both show \"Deployed\" status in the Supabase dashboard."
      },
      {
        label: "Step 7: Register the Webhook on Meta",
        detail: "Back in the Meta Developer Portal → WhatsApp → Configuration:\n  • Webhook URL: https://[YOUR-SUPABASE-REF].supabase.co/functions/v1/whatsapp-webhook\n  • Verify Token: shopqr_webhook_2026  (must match what you set in Step 5)\nClick \"Verify and Save\". Then subscribe to the messages webhook field."
      },
      {
        label: "Step 8: Go Live (App Review)",
        detail: "To send messages to numbers outside your test contacts, your Meta App must pass App Review. Submit for the whatsapp_business_messaging permission. Prepare a short video showing the order flow. Approval typically takes 2–5 business days."
      },
      {
        label: "Step 9: Test End-to-End",
        detail: "Log in as a test shop on Pro plan. Place a sample order. Verify the shop owner's WhatsApp receives the order alert with Accept/Reject buttons. Click Accept and confirm the customer's tracking page updates to 'Accepted – Awaiting Payment'."
      }
    ]
  },
  {
    id: "mpesa-daraja",
    category: "💳 M-Pesa STK Push (Daraja API)",
    status: "pending",
    priority: "high",
    title: "Activate Safaricom Daraja M-Pesa Payment Processing",
    summary: "Enable real M-Pesa payments so shops can collect digital payments directly through the platform. Requires a registered Safaricom Daraja developer account.",
    steps: [
      {
        label: "Step 1: Register on Daraja",
        detail: "Go to developer.safaricom.co.ke and create an account. Verify your email. Once inside, click \"My Apps\" → \"Create New App\"."
      },
      {
        label: "Step 2: Provide Paybill / Till Number",
        detail: "The ShopQR platform acts as a single aggregator. Register your company's official Paybill number. Individual shop owners do NOT need their own Daraja accounts — your single Paybill number serves all of them."
      },
      {
        label: "Step 3: Get API Credentials",
        detail: "In your Daraja App, note down:\n  • Consumer Key\n  • Consumer Secret\n  • Shortcode (your Paybill number)\n  • Passkey (from Safaricom's Till management portal)"
      },
      {
        label: "Step 4: Set Secrets in Supabase",
        detail: "Add these in Supabase Edge Functions Secrets:\n  MPESA_CONSUMER_KEY = ...\n  MPESA_CONSUMER_SECRET = ...\n  MPESA_SHORTCODE = ...\n  MPESA_PASSKEY = ...\n  MPESA_ENVIRONMENT = sandbox  ← change to 'production' when ready"
      },
      {
        label: "Step 5: Deploy M-Pesa Edge Functions",
        detail: "Run in terminal:\n  npx supabase functions deploy mpesa-stk-push\n  npx supabase functions deploy mpesa-webhook\nEnsure both are visible and deployed in Supabase."
      },
      {
        label: "Step 6: Register Callback URL on Daraja",
        detail: "In the Daraja portal under your App → STK Push Configuration, set the Callback URL to:\n  https://[YOUR-SUPABASE-REF].supabase.co/functions/v1/mpesa-webhook"
      },
      {
        label: "Step 7: Go Live",
        detail: "Switch MPESA_ENVIRONMENT from 'sandbox' to 'production' in your Supabase secrets. Contact Safaricom to whitelist your callback URL for production traffic. Test with a real KES 1 payment."
      }
    ]
  },
  {
    id: "subscriptions-cron",
    category: "🔄 Subscription Auto-Expiry",
    status: "pending",
    priority: "medium",
    title: "Schedule Supabase Cron Job for Subscription Grace Period",
    summary: "Shops on paid plans whose subscriptions lapse should be automatically downgraded to Free tier. This CRON runs nightly.",
    steps: [
      {
        label: "Step 1: Enable pg_cron in Supabase",
        detail: "In Supabase Dashboard → Database → Extensions, search for 'pg_cron' and enable it."
      },
      {
        label: "Step 2: Run the Cron SQL",
        detail: "In the SQL Editor, run:\n\nSELECT cron.schedule(\n  'expire-subscriptions',\n  '0 3 * * *', -- 3:00 AM every day\n  $$\n    UPDATE public.shops\n    SET plan = 'free'\n    WHERE subscription_end_date < NOW()\n    AND plan != 'free';\n  $$\n);"
      },
      {
        label: "Step 3: Verify Schedule",
        detail: "Run SELECT * FROM cron.job; to confirm the schedule was registered properly."
      }
    ]
  }
];

function StepList({ steps }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-2 mt-4">
      {steps.map((step, i) => (
        <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
          <button
            className="w-full text-left px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition text-sm font-semibold text-gray-700"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span>{step.label}</span>
            <span className="text-gray-400 ml-2">{open === i ? "▲" : "▼"}</span>
          </button>
          {open === i && (
            <div className="px-4 py-3 bg-white text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-mono border-t border-gray-100">
              {step.detail}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminTodo() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [expanded, setExpanded] = useState("wa-api");

  useEffect(() => {
    if (!user || user.role !== "system_admin") navigate("/login");
  }, [navigate]);

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-orange-100 text-orange-700 border-orange-200",
    low: "bg-gray-100 text-gray-600 border-gray-200"
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/admin" className="text-gray-400 hover:text-gray-600 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">📋 System TODO List</h1>
            <p className="text-xs text-gray-500 mt-0.5">Pending integrations and administrative actions to complete</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {TODOS.map((todo) => (
          <div key={todo.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div
              className="p-6 cursor-pointer"
              onClick={() => setExpanded(expanded === todo.id ? null : todo.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    {todo.category}
                  </span>
                  <h2 className="text-base font-bold text-gray-800 mb-2">{todo.title}</h2>
                  <p className="text-sm text-gray-500 leading-relaxed">{todo.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${priorityColors[todo.priority]} capitalize`}>
                    {todo.priority} priority
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded font-bold">
                    ⏳ Pending
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-xs text-indigo-500 font-semibold">
                {expanded === todo.id ? "▲ Hide steps" : "▼ Show step-by-step guide"}
              </div>
            </div>

            {expanded === todo.id && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">
                  {todo.steps.length} Steps — Click each step to expand
                </p>
                <StepList steps={todo.steps} />
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
