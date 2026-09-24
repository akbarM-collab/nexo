import React, { useState } from 'react';
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { formatDate } from '../../utils/formatters';
import { ViewRoute } from '../../types';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    setCurrentRoute,
  } = useFinancial();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.read : true));

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'error':
        return <AlertTriangle className="size-4 text-rose-500" />;
      case 'warning':
        return <AlertTriangle className="size-4 text-amber-500" />;
      case 'success':
        return <CheckCircle2 className="size-4 text-emerald-500" />;
      default:
        return <Info className="size-4 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800/80 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100">Notifications</h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            System notices, budget thresholds, and payment alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsRead}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 text-xs font-medium text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            <Check className="size-3.5" />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-neutral-900/50 p-1 border border-neutral-800 max-w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            filter === 'all'
              ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            filter === 'unread'
              ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Unread ({notifications.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 divide-y divide-neutral-800/60 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-500">
            No notifications found.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                !n.read ? 'bg-neutral-800/30' : 'hover:bg-neutral-800/20'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 shrink-0">{getSeverityIcon(n.severity)}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xs font-semibold ${!n.read ? 'text-neutral-100' : 'text-neutral-300'}`}>
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="size-1.5 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-neutral-500">
                    <span>{formatDate(n.createdAt, 'relative')}</span>
                    {n.href && (
                      <button
                        onClick={() => setCurrentRoute(n.href as ViewRoute)}
                        className="text-neutral-300 hover:text-white flex items-center gap-1 font-medium"
                      >
                        Go to page <ExternalLink className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.read && (
                  <button
                    onClick={() => markNotificationRead(n.id, true)}
                    className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                    title="Mark as read"
                  >
                    <Check className="size-3.5" />
                  </button>
                )}
                <button
                  onClick={() => dismissNotification(n.id)}
                  className="p-1.5 rounded-lg border border-neutral-800 text-neutral-400 hover:text-rose-400"
                  title="Dismiss notification"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
