import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface OrderRequestModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  requestType: 'cancellation' | 'replacement' | 'return';
  onSubmit: (reason: string) => void;
}

export const OrderRequestModal: React.FC<OrderRequestModalProps> = ({ open, onClose, orderId, requestType, onSubmit }) => {
  const [reason, setReason] = useState('');

  const whatsappNumber = '918765432101'; // admin WhatsApp number
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Order ID: ${orderId}\nRequest: ${requestType}\nReason: ${reason}\nPlease attach video proof after sending this message.`
  )}`;

  const handleSubmit = () => {
    onSubmit(reason);
    // Open WhatsApp in a new tab after reason is set
    window.open(whatsappLink, '_blank');
    onClose();
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl">
            {requestType === 'cancellation' ? 'Request Cancellation' : requestType === 'replacement' ? 'Request Replacement' : 'Request Return'}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-2 text-sm text-muted-foreground">Please provide a brief reason for your {requestType} request.</p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Reason..."
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:border-accent"
          rows={4}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full border border-border px-4 py-2 text-sm hover:border-accent"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason.trim()}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent"
          >
            <Check className="inline h-4 w-4 mr-1" />
            {requestType === 'cancellation' ? 'Request Cancel' : requestType === 'replacement' ? 'Request Replace' : 'Request Return'}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">After submitting, a WhatsApp chat will open. Attach your video proof there and send.</p>
      </div>
    </div>
  );
};
