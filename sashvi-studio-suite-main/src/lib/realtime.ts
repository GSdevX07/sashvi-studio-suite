import { supabase } from '@/lib/supabase.client';

/**
 * Subscribe to order status change events for a specific user.
 * Returns an unsubscribe function.
 */
export function subscribeOrderStatus(userId: string, onUpdate: (payload: { order_id: string; new_status: string }) => void) {
  const channel = supabase.channel('order_status_change');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
    try {
      const data = JSON.parse((payload as any).payload);
      if (data && data.order_id && data.new_status) {
        onUpdate(data);
      }
    } catch (e) {
      console.warn('Failed to parse realtime payload', e);
    }
  }).subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
