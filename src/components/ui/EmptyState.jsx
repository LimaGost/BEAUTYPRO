// @ts-nocheck
const GOLD = '#C9A861';

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(201,168,97,0.08)' }}
      >
        <Icon className="w-8 h-8" style={{ color: 'rgba(201,168,97,0.45)' }} />
      </div>
      <h3 className="text-base font-bold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm max-w-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
