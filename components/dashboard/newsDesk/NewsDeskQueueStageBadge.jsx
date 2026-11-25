import { deriveDeskQueueStage } from '../../../lib/newsDesk/deskQueueStage'
import { StatusBadge } from '../../ui'

export default function NewsDeskQueueStageBadge({ row, showStep = true }) {
  const stage = deriveDeskQueueStage(row)
  return (
    <div className="flex flex-col items-start gap-1.5 min-w-[9rem]">
      <StatusBadge status={stage.label} color={stage.color} />
      {showStep ? (
        <div className="flex items-center gap-1.5 w-full" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1 flex-1 rounded-full ${
                n <= stage.step ? 'bg-brand' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      ) : null}
      <span className="text-[10px] text-slate-500 leading-tight">
        Queue → Review → Publish
      </span>
    </div>
  )
}