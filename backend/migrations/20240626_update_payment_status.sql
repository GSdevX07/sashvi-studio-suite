-- Update payment_status from advance_pending to partially_paid for consistency
UPDATE orders SET payment_status = 'partially_paid' WHERE payment_status = 'advance_pending';
