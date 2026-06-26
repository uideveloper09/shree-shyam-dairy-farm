"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CATEGORIES = [
  "INVOICE",
  "CERTIFICATE",
  "VACCINATION",
  "PURCHASE_BILL",
  "EMPLOYEE",
  "CONTRACT",
  "GENERAL",
];

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsAdminPage() {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [tab, setTab] = useState("browse");
  const [category, setCategory] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const dashboard = useQuery({
    queryKey: ["doc-dashboard"],
    queryFn: () => fetch("/api/v1/documents/admin/dashboard").then((r) => r.json()),
  });

  const documents = useQuery({
    queryKey: ["documents", category],
    queryFn: () =>
      fetch(`/api/v1/documents${category ? `?category=${category}` : ""}`).then((r) => r.json()),
  });

  const detail = useQuery({
    queryKey: ["document", selectedId],
    queryFn: () => fetch(`/api/v1/documents/${selectedId}`).then((r) => r.json()),
    enabled: Boolean(selectedId),
  });

  const upload = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch("/api/v1/documents/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["doc-dashboard"] });
    },
  });

  const runOcr = useMutation({
    mutationFn: (id) =>
      fetch(`/api/v1/documents/${id}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      }).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["document", selectedId] }),
  });

  const tabs = [
    ["browse", "Browse"],
    ["folders", "Folders"],
    ["upload", "Upload"],
    ["preview", "PDF Preview"],
  ];

  const doc = detail.data?.document;
  const isPdf = doc?.mimeType === "application/pdf";

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold">Document Management System</h2>
      <p className="mt-2 text-sm text-white/60">
        Upload · Folders · Invoices · Certificates · OCR · Version History · Digital Signature ·
        Cloud Storage
      </p>

      {dashboard.data?.stats && (
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/50">Total documents</p>
            <p className="text-xl font-bold text-[#C89B3C]">{dashboard.data.stats.total}</p>
          </div>
          {(dashboard.data.stats.byCategory ?? []).slice(0, 3).map((row) => (
            <div key={row.category} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-white/50">{row.category}</p>
              <p className="text-xl font-bold text-white">{row._count}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              tab === id ? "bg-[#C89B3C] text-[#082F63]" : "bg-white/10 text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        <div className="mt-8">
          <select
            className="mb-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="grid gap-3 lg:grid-cols-2">
            {(documents.data?.documents ?? []).map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setSelectedId(d.id);
                  setTab("preview");
                }}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm hover:border-[#C89B3C]/50"
              >
                <p className="font-semibold text-[#C89B3C]">{d.title}</p>
                <p className="text-white/50">
                  {d.category} · v{d.currentVersion} · {formatBytes(d.sizeBytes)}
                </p>
                <p className="mt-1 text-xs text-white/40">{d.fileName}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "folders" && (
        <ul className="mt-8 space-y-2">
          {(dashboard.data?.folders ?? []).map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
            >
              <span>{f.path}</span>
              <span className="text-white/40">{f._count?.documents ?? 0} files</span>
            </li>
          ))}
        </ul>
      )}

      {tab === "upload" && (
        <form
          className="mt-8 max-w-md space-y-4 rounded-xl border border-white/10 bg-white/5 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            upload.mutate(fd);
          }}
        >
          <input
            name="title"
            placeholder="Title"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            required
          />
          <select
            name="category"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            required
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            ref={fileRef}
            name="file"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            className="text-sm"
            required
          />
          <button
            type="submit"
            className="rounded-lg bg-[#C89B3C] px-4 py-2 text-sm font-semibold text-[#082F63]"
            disabled={upload.isPending}
          >
            {upload.isPending ? "Uploading…" : "Upload to cloud"}
          </button>
        </form>
      )}

      {tab === "preview" && selectedId && doc && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-semibold">{doc.title}</h3>
            <p className="mt-1 text-xs text-white/50">
              {doc.mimeType} · {formatBytes(doc.sizeBytes)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`/api/v1/documents/${doc.id}/download?inline=true`}
                target="_blank"
                rel="noreferrer"
                className="rounded bg-[#082F63] px-3 py-1 text-xs"
              >
                {isPdf ? "Open PDF" : "Preview"}
              </a>
              <a
                href={`/api/v1/documents/${doc.id}/download`}
                className="rounded bg-white/10 px-3 py-1 text-xs"
              >
                Download
              </a>
              <button
                type="button"
                className="rounded bg-white/10 px-3 py-1 text-xs"
                onClick={() => runOcr.mutate(doc.id)}
              >
                Run OCR
              </button>
            </div>
            {isPdf && (
              <iframe
                title="PDF Preview"
                src={`/api/v1/documents/${doc.id}/download?inline=true`}
                className="mt-4 h-96 w-full rounded-lg border border-white/10 bg-white"
              />
            )}
          </div>
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-semibold text-[#C89B3C]">Version History</h4>
              <ul className="mt-2 space-y-1 text-xs text-white/60">
                {(doc.versions ?? []).map((v) => (
                  <li key={v.id}>
                    v{v.version} — {v.fileName} — {new Date(v.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-semibold text-[#C89B3C]">OCR</h4>
              {doc.ocrResults?.[0] ? (
                <pre className="mt-2 max-h-40 overflow-auto text-xs text-white/60">
                  {doc.ocrResults[0].text}
                </pre>
              ) : (
                <p className="mt-2 text-xs text-white/40">No OCR yet</p>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h4 className="font-semibold text-[#C89B3C]">
                Signatures ({doc.signatures?.length ?? 0})
              </h4>
              {(doc.signatures ?? []).map((s) => (
                <p key={s.id} className="mt-1 text-xs text-white/60">
                  {s.signerName} — {new Date(s.signedAt).toLocaleString()}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
