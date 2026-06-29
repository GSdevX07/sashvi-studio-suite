import React from 'react';
import { format } from 'date-fns';
import { statusToDisplay, ORDER_STATUS_FLOW } from '@/lib/order-status';

interface OrderStatusTimelineProps {
  order: {
    order_status?: string;
    created_at?: string;
    updated_at?: string;
    status_history?: Array<{ new_status: string; updated_at: string }>;
  };
}

export default function OrderStatusTimeline({ order }: OrderStatusTimelineProps) {
  const currentStatus = order?.order_status || 'pending';
  const createdAt = order?.created_at || new Date().toISOString();
  const history = order?.status_history ?? [];

  const historyMap = new Map<string, string>();
  history.forEach((h) => {
    if (h.new_status && h.updated_at) {
      historyMap.set(h.new_status, h.updated_at);
    }
  });
  if (!historyMap.has('pending')) {
    historyMap.set('pending', createdAt);
  }

  const getTimelineStages = () => {
    const baseStages = ORDER_STATUS_FLOW.map((status) => ({
      status,
      label: statusToDisplay(status),
      timestamp: historyMap.get(status) ?? null,
    }));

    if (currentStatus === 'cancelled') {
      return [
        ...baseStages.slice(0, 3),
        { status: 'cancelled', label: 'Cancelled', timestamp: historyMap.get('cancelled') ?? order.updated_at },
      ];
    }

    if (currentStatus.startsWith('replacement_')) {
      const replacementStages = [
        'replacement_requested',
        'replacement_approved',
        'replacement_packed',
        'replacement_shipped',
        'replacement_delivered',
      ];
      return [
        ...baseStages,
        ...replacementStages.map((status) => ({
          status,
          label: statusToDisplay(status),
          timestamp: historyMap.get(status) ?? null,
        })),
      ];
    }

    if (currentStatus.startsWith('refund_')) {
      const refundStages = ['refund_pending', 'refund_initiated', 'refund_completed'];
      return [
        ...baseStages,
        ...refundStages.map((status) => ({
          status,
          label: statusToDisplay(status),
          timestamp: historyMap.get(status) ?? null,
        })),
      ];
    }

    return baseStages;
  };

  const stages = getTimelineStages();
  const statusOrder = stages.map((s) => s.status);
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-border">
      {stages.map((stage, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const date = stage.timestamp 
          ? new Intl.DateTimeFormat('en-IN', {
              timeZone: 'Asia/Kolkata',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            }).format(new Date(stage.timestamp))
          : '';

        return (
          <div key={stage.status} className="relative flex items-center gap-4">
            <div
              className={`absolute -left-6 h-5 w-5 rounded-full border-4 border-card transition-all duration-300 ${
                isCompleted
                  ? 'bg-accent shadow-lg shadow-accent/20'
                  : isCurrent
                    ? 'bg-accent shadow-lg shadow-accent/40 animate-pulse'
                    : 'bg-muted-foreground/30'
              }`}
            />
            <div
              className={`flex-1 ${
                isCurrent
                  ? 'font-semibold text-accent'
                  : isCompleted
                    ? 'font-medium text-foreground'
                    : 'font-medium text-muted-foreground'
              }`}
            >
              {stage.label}
            </div>
            {date && (
              <div
                className={`text-sm ${isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}
              >
                {date}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
