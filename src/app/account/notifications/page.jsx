"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AccountNotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["user-notifications"],
    queryFn: () => fetch("/api/v1/notifications").then((r) => r.json()),
  });

  const markRead = useMutation({
    mutationFn: (id) =>
      fetch(`/api/v1/notifications/${id}/read`, { method: "PATCH" }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-notifications"] }),
  });

  if (isLoading) return <p className="text-sm text-gray-500">Loading notifications…</p>;

  const notifications = data?.notifications ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-[#082F63]">Notifications</h1>
        {data?.unreadCount > 0 && (
          <span className="rounded-full bg-[#C89B3C] px-2 py-0.5 text-xs font-semibold text-white">
            {data.unreadCount} unread
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-500">In-app notifications and delivery history.</p>

      <ul className="mt-6 space-y-3">
        {notifications.length === 0 && (
          <li className="rounded-xl border border-[#e8e4dc] bg-white p-6 text-center text-sm text-gray-500">
            No notifications yet.
          </li>
        )}
        {notifications.map((n) => (
          <li
            key={n.id}
            className={`rounded-xl border p-4 ${
              n.readAt ? "border-[#e8e4dc] bg-white" : "border-[#C89B3C]/40 bg-[#fffbf0]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-[#082F63]">{n.title}</p>
                <p className="mt-1 text-sm text-gray-600">{n.body}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(n.createdAt).toLocaleString()}
                  {n.priority !== "NORMAL" && ` · ${n.priority}`}
                </p>
              </div>
              {!n.readAt && (
                <button
                  type="button"
                  onClick={() => markRead.mutate(n.id)}
                  className="shrink-0 text-xs font-medium text-[#082F63] underline"
                >
                  Mark read
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
