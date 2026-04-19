import { useState } from "react";
import { supabase } from "../services/supabase-client";

/**
 * RatingModal — shown on TrackOrder when order is completed/delivered.
 * Writes to the `order_ratings` table and persists a localStorage flag
 * so the modal is never shown again for the same order.
 */
export default function RatingModal({ orderId, shopId, onClose }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (stars === 0) return;
    setSubmitting(true);
    try {
      await supabase.from("order_ratings").upsert({
        order_id: orderId,
        shop_id: shopId,
        rating: stars,
        comment: comment.trim() || null,
      }, { onConflict: "order_id" });

      // Persist so we never re-show
      localStorage.setItem(`qr_rated_${orderId}`, "true");
      setSubmitted(true);
    } catch (err) {
      console.error("Rating submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        {submitted ? (
          <>
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">Thank you!</h2>
            <p className="text-gray-500 text-sm mb-5">
              Your feedback helps us improve the experience.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition cursor-pointer"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">⭐</div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">How was your order?</h2>
            <p className="text-gray-400 text-xs mb-5">Tap a star to rate your experience</p>

            {/* Star Selector */}
            <div className="flex justify-center gap-2 mb-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setStars(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl transition-transform hover:scale-110 cursor-pointer"
                >
                  <span className={(hovered || stars) >= n ? "text-yellow-400" : "text-gray-200"}>
                    ★
                  </span>
                </button>
              ))}
            </div>

            {/* Optional Comment */}
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any comments? (optional)"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={stars === 0 || submitting}
                className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Sending..." : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
