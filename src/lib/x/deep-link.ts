import type { Period } from '@/components/admin/PeriodPicker';
import type { XThreadListItem } from './types';

/** List state required to reveal a thread reached from Agenda. */
export function resolveXThreadDeepLink(
  items: readonly Pick<XThreadListItem, 'id' | 'scheduled_at'>[],
  requestedId: string | null,
): { id: string; period: Period } | null {
  if (!requestedId) return null;
  const item = items.find((candidate) => candidate.id === requestedId);
  if (!item) return null;
  return {
    id: item.id,
    period: { mode: 'semana', anchor: item.scheduled_at },
  };
}
