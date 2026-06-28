declare module '@/lib/realtime.client' {
  /**
   * Subscribe to order status change events for a specific user.
   * Returns an unsubscribe function.
   */
  export function subscribeOrderStatus(
    userId: string,
    onUpdate: (payload: { order_id: string; new_status: string }) => void,
  ): () => void;
}
