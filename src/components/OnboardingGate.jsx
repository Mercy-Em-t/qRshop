import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser, logout } from "../services/auth-service";
import LoadingSpinner from "./LoadingSpinner";
import { useQRs } from "../hooks/useQRs";
import { createQrNode } from "../services/qr-node-service";

export default function OnboardingGate({ children }) {
  const [shopStatus, setShopStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const navigate = useNavigate();

  // Password Setup State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  
  // KYC Profile State
  const [tagline, setTagline] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [kycError, setKycError] = useState("");
  const [kycLoading, setKycLoading] = useState(false);

  // Initial QR State
  const { qrs, fetchQRs } = useQRs(user?.shop_id);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");

  useEffect(() => {
    // If not logged in, or is a system admin, they don't need this gate
    if (!user || user.role === "system_admin") {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      const { data, error } = await supabase
        .from("shops")
        .select("needs_password_change, kyc_completed, phone")
        .eq("id", user.shop_id)
        .single();

      if (!error && data) {
         setShopStatus(data);
         setPhone(data.phone || "");
      }
      setLoading(false);
    };
    
    checkStatus();
  }, [user]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError("");
    
    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPwdError("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword === currentPassword) {
      setPwdError("New password must be different from the system-generated password.");
      return;
    }

    setPwdLoading(true);

    try {
       // 1. Verify current system-generated password by forcing a re-login
       const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
       });

       if (verifyError) {
          throw new Error("Current system-generated password is incorrect.");
       }

       // 2. Native Auth Update
       const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
       });

       if (updateError) throw updateError;

       // 3. Keep legacy `shop_users` table in sync for backend scripts
       const { error: legacyError } = await supabase
          .from("shop_users")
          .update({ password: newPassword })
          .eq("email", user.email);
       // We won't block on legacy error necessarily if RLS is strict, but let's check it.
       if (legacyError) console.error("Legacy sync error:", legacyError);

       // 4. Clear the flag on the shop
       const { error: shopError } = await supabase
          .from("shops")
          .update({ needs_password_change: false })
          .eq("id", user.shop_id);
       
       if (shopError) throw new Error("Failed to update security flag: " + shopError.message);

       setShopStatus(prev => ({ ...prev, needs_password_change: false }));
       
    } catch (err) {
       setPwdError(err.message);
    } finally {
       setPwdLoading(false);
    }
  };

  const handleKycSubmit = async (e) => {
     e.preventDefault();
     setKycError("");
     
     if (!agreeTerms) {
        setKycError("You must agree to the System Operator Terms of Service to continue.");
        return;
     }

     setKycLoading(true);
     try {
        const { error } = await supabase
          .from("shops")
          .update({
             tagline,
             address,
             phone,
             kyc_completed: true
          })
          .eq("id", user.shop_id);
          
        if (error) throw error;
        
        setShopStatus(prev => ({ ...prev, kyc_completed: true }));
     } catch(err) {
        setKycError(err.message);
     } finally {
        setKycLoading(false);
     }
  };

  const handleGenerateFirstQr = async () => {
     setQrError("");
     setQrLoading(true);
     try {
       await createQrNode(user.shop_id, "Main Entrance", "open_menu");
       await fetchQRs(); // Re-sync to satisfy the gate
     } catch (err) {
       setQrError(err.message);
     } finally {
       setQrLoading(false);
     }
  };

  if (loading) {
     return <LoadingSpinner message="Checking Security Vault..." />;
  }

  // Strict Security Checks
  const needsPasswordChange = shopStatus?.needs_password_change !== false; 
  const kycCompleted = shopStatus?.kyc_completed === true; 
  const hasNodes = (qrs || []).length > 0;

  if (!needsPasswordChange && kycCompleted && hasNodes) {
     return children;
  }

  // FORCE PASSWORD CHANGE VIEW
  if (needsPasswordChange) {
     return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
           <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-red-50 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
               <div className="flex flex-col items-center text-center mb-8">
                  <span className="text-4xl mb-3">🛡️</span>
                  <h1 className="text-2xl font-black text-gray-900">Security Requirement</h1>
                  <p className="text-gray-500 mt-2 text-sm text-balance">
                     For your protection, you must immediately change the system-generated password you were issued by the Super Admin before accessing your operator environment.
                  </p>
               </div>

               {pwdError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 font-medium">
                     {pwdError}
                  </div>
               )}

               <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                    <input 
                      type="password"
                      required
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="The generated password you logged in with"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">New Secure Password</label>
                    <input 
                      type="password"
                      required
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Type it again"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-red-500 focus:bg-white"
                    />
                  </div>

                  <button 
                     type="submit"
                     disabled={pwdLoading}
                     className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition mt-4 disabled:opacity-50"
                  >
                     {pwdLoading ? "Locking Vault..." : "Update Password & Secure Account"}
                  </button>
               </form>

               <button 
                  onClick={() => { logout(); navigate("/login"); }}
                  className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 font-semibold"
               >
                  Cancel and Logout
               </button>
           </div>
        </div>
     );
  }

  // FORCE KYC FORM VIEW
  if (!kycCompleted) {
     return (
        <div className="min-h-screen bg-indigo-50 flex flex-col justify-center items-center p-4">
           <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
               <div className="flex flex-col items-center text-center mb-8">
                  <span className="text-5xl mb-3">📋</span>
                  <h1 className="text-2xl font-black text-gray-900">Operator Profile Setup</h1>
                  <p className="text-gray-500 mt-2 text-sm text-balance">
                     Welcome to the platform! Please provide some basic public information about your business to initialize your profile and agree to the Operator Legal Agreements.
                  </p>
               </div>

               {kycError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 font-medium">
                     {kycError}
                  </div>
               )}

               <form onSubmit={handleKycSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Business Tagline or Short Bio</label>
                    <input 
                      type="text"
                      required
                      value={tagline}
                      onChange={e => setTagline(e.target.value)}
                      placeholder="e.g. Best coffee in town doing what we love!"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Public Physical Address</label>
                    <input 
                      type="text"
                      required
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="e.g. 123 Main Street, Block A"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Public Support Phone</label>
                    <input 
                      type="tel"
                      required
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. 254700000000"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white"
                    />
                  </div>

                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-6">
                     <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                           type="checkbox" 
                           checked={agreeTerms}
                           onChange={e => setAgreeTerms(e.target.checked)}
                           className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">
                           I affirm that the information provided is accurate and I agree to the <a href="#" className="text-indigo-600 font-bold hover:underline">Master Operator Service Terms & Conditions</a> and <a href="#" className="text-indigo-600 font-bold hover:underline">Data Processing Agreements</a>.
                        </span>
                     </label>
                  </div>

                  <button 
                     type="submit"
                     disabled={kycLoading}
                     className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-indigo-700 transition mt-2 disabled:opacity-50"
                  >
                     {kycLoading ? "Provisioning Matrix..." : "Complete Setup & Enter Platform"}
                  </button>
               </form>
           </div>
         </div>
      );
   }

   // FORCE FIRST QR GENERATION VIEW
   if (!hasNodes) {
      return (
         <div className="min-h-screen bg-green-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 border border-green-100 text-center">
                <span className="text-5xl mb-3 block">📍</span>
                <h1 className="text-2xl font-black text-gray-900">Deploy Your First Node</h1>
                <p className="text-gray-500 mt-2 text-sm text-balance">
                   Your workspace is ready. To begin routing traffic to your business, generate your first digital touchpoint.
                </p>

                {qrError && (
                   <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mt-6 border border-red-100 font-medium text-left">
                      {qrError}
                   </div>
                )}

                <button 
                   onClick={handleGenerateFirstQr}
                   disabled={qrLoading}
                   className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-green-700 transition mt-8 disabled:opacity-50"
                >
                   {qrLoading ? "Generating Touchpoint..." : "Deploy First Node & Enter Dashboard"}
                </button>
            </div>
         </div>
      );
   }

   return <>{children}</>;
}
