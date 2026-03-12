import { Bell, X } from 'lucide-react';

const PRESET_MINUTES = [5, 10, 15, 30, 60, 1440] as const;
const MINUTE_LABELS: Record<number, string> = {
  5: '5 min',
  10: '10 min',
  15: '15 min',
  30: '30 min',
  60: '1 hr',
  1440: '1 day',
};
const METHODS = ['email', 'popup'] as const;

interface ReminderPickerProps {
  minutes: number[];
  methods: string[];
  onChange: (minutes: number[], methods: string[]) => void;
  /** Compact mode removes the header and outer padding (for inline use in ChatWindow) */
  compact?: boolean;
}

export default function ReminderPicker({ minutes, methods, onChange, compact = false }: ReminderPickerProps) {
  const toggleMinute = (m: number) => {
    const next = minutes.includes(m) ? minutes.filter((x) => x !== m) : [...minutes, m];
    onChange(next, methods);
  };

  const toggleMethod = (method: string) => {
    const next = methods.includes(method) ? methods.filter((x) => x !== method) : [...methods, method];
    onChange(minutes, next);
  };

  return (
    <div className={compact ? '' : 'space-y-4'}>
      {!compact && (
        <div className="flex items-center gap-2 mb-1">
          <Bell className="h-4 w-4 text-orange-400" />
          <span className="text-sm font-semibold text-white/80">Reminder times</span>
        </div>
      )}

      {/* Minute chips */}
      <div>
        {!compact && (
          <p className="text-[11px] text-slate-500 mb-2 uppercase tracking-wide font-medium">Remind before meeting</p>
        )}
        <div className="flex flex-wrap gap-2">
          {PRESET_MINUTES.map((m) => {
            const active = minutes.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMinute(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                  active
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                }`}
              >
                {MINUTE_LABELS[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Methods */}
      <div className={compact ? 'mt-2' : ''}>
        {!compact && (
          <p className="text-[11px] text-slate-500 mb-2 uppercase tracking-wide font-medium">Reminder via</p>
        )}
        <div className="flex gap-2">
          {METHODS.map((method) => {
            const active = methods.includes(method);
            return (
              <button
                key={method}
                type="button"
                onClick={() => toggleMethod(method)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all duration-150 ${
                  active
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-white/[0.04] border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active summary line */}
      {minutes.length > 0 && (
        <p className={`text-[11px] text-slate-500 ${compact ? 'mt-1.5' : ''}`}>
          Reminders:{' '}
          <span className="text-orange-400/80">
            {[...minutes]
              .sort((a, b) => a - b)
              .map((m) => MINUTE_LABELS[m] ?? `${m} min`)
              .join(', ')}
          </span>{' '}
          before via{' '}
          <span className="text-purple-400/80">
            {methods.length ? methods.join(', ') : 'none'}
          </span>
        </p>
      )}

      {minutes.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([], methods)}
          className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
        >
          <X className="h-3 w-3" />
          Clear reminders
        </button>
      )}
    </div>
  );
}
