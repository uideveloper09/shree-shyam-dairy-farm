"use client";

const STATUS_STYLES = {
  scheduled: "bg-[#082F63]/10 text-[#082F63] ring-[#082F63]/20",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  skipped: "bg-amber-50 text-amber-700 ring-amber-200",
  off: "bg-gray-50 text-gray-300 ring-gray-100",
};

export default function DeliveryCalendar({ calendar }) {
  if (!calendar?.length) return null;

  return (
    <div>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#C89B3C]">
        Delivery calendar
      </p>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {calendar.slice(0, 28).map((day) => (
          <div
            key={day.date}
            title={`${day.label} — ${day.status}`}
            className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[9px] font-semibold ring-1 sm:text-[10px] ${
              STATUS_STYLES[day.status] || STATUS_STYLES.off
            }`}
          >
            <span>{day.label.split(" ")[1]}</span>
            {day.isDelivery && day.status === "scheduled" && (
              <span className="mt-0.5 h-1 w-1 rounded-full bg-[#C89B3C]" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#082F63]/30" /> Scheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Skipped
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Delivered
        </span>
      </div>
    </div>
  );
}
