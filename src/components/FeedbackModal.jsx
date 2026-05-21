import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function FeedbackModal({ order, isOpen, onClose, onSubmitSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('feedback')
        .insert({
          order_id: order.id,
          rating,
          comment: comment.trim() || null
        });

      if (insertError) throw insertError;

      setRating(0);
      setComment('');
      onSubmitSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsLoading(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-3xl w-full md:w-96 p-6 space-y-6 max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">How was your order?</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-main)] rounded-full transition-all duration-200"
          >
            <X size={20} className="text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Order Summary */}
        <div className="bg-[var(--color-primary)]/10 p-3 rounded-xl border border-[var(--color-primary)]/20">
          <p className="text-sm text-[var(--text-secondary)]">Order #{order.id}</p>
          <p className="font-semibold text-[var(--text-primary)]">{order.customer_name}</p>
        </div>

        {/* Star Rating */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-[var(--text-primary)]">Rating</label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                onClick={() => setRating(i)}
                onMouseEnter={() => setHoverRating(i)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={
                    i <= displayRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-ink/20'
                  }
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label htmlFor="comment" className="block text-sm font-semibold text-[var(--text-primary)]">
            Additional Comment (optional)
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Tell us what you think..."
            maxLength={500}
            rows={3}
            className="w-full p-3 border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-primary)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] resize-none transition-all duration-200"
          />
          <p className="text-xs text-[var(--text-secondary)]">{comment.length}/500</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-[var(--border)] rounded-xl font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-main)] transition-all duration-200 disabled:opacity-50"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !rating}
            className="flex-1 px-4 py-3 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
