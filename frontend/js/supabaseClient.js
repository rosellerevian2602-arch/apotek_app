// =========================================================
// apotek_app — Supabase Client untuk Frontend
// Ganti URL & ANON KEY dengan milik Anda.
// =========================================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

export const SUPABASE_URL      = "https://ktzsolakpnevaeoddtca.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0enNvbGFrcG5ldmFlb2RkdGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2MTIzNjQsImV4cCI6MjEwNzE4ODM2NH0.2SZ5eguhy3AkPwMweI769jEnM3bDKksSKZ1E4vEZZ0I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ---------- Utility ---------- */
export const rupiah = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
export const tanggalID = (s) => s ? new Date(s).toLocaleDateString("id-ID", {
  day: "2-digit", month: "short", year: "numeric"
}) : "-";

export function badgeUtang(status) {
  const map = {
    "Belum Lunas": "badge-belum",
    "Sebagian": "badge-sebagian",
    "Lunas": "badge-lunas",
  };
  return `<span class="badge ${map[status] || 'badge-draft'}">${status}</span>`;
}
export function badgeMetode(m) {
  return `<span class="badge badge-${m === 'tunai' ? 'tunai' : 'kredit'}">${m}</span>`;
}
export function badgeTransaksi(s) {
  return `<span class="badge badge-${s}">${s}</span>`;
}

/* ---------- Sidebar Active State ---------- */
export function setActiveMenu() {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".sidebar a").forEach(a => {
    if (a.getAttribute("href") === path) a.classList.add("active");
  });
}