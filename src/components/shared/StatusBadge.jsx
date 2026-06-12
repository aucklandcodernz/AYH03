import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  onboarding: 'bg-blue-50 text-blue-700 border-blue-200',
  on_leave: 'bg-amber-50 text-amber-700 border-amber-200',
  terminated: 'bg-red-50 text-red-700 border-red-200',
  resigned: 'bg-slate-50 text-slate-600 border-slate-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-50 text-red-700 border-red-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  draft: 'bg-slate-50 text-slate-600 border-slate-200',
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  locked: 'bg-purple-50 text-purple-700 border-purple-200',
  open: 'bg-amber-50 text-amber-700 border-amber-200',
  investigating: 'bg-blue-50 text-blue-700 border-blue-200',
  corrective_actions: 'bg-orange-50 text-orange-700 border-orange-200',
  pending_closure: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  closed: 'bg-slate-50 text-slate-600 border-slate-200',
  low: 'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  assigned: 'bg-blue-50 text-blue-700 border-blue-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-slate-50 text-slate-600 border-slate-200',
  not_started: 'bg-slate-50 text-slate-600 border-slate-200',
  acknowledged: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function StatusBadge({ status, className }) {
  if (!status) return null;
  const style = statusStyles[status] || 'bg-slate-50 text-slate-600 border-slate-200';
  const label = status.replace(/_/g, ' ');
  
  return (
    <Badge variant="outline" className={cn('capitalize text-[11px] font-medium border', style, className)}>
      {label}
    </Badge>
  );
}