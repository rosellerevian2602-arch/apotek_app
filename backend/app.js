// =========================================================
// apotek_app — Modul API (CRUD 4 entitas + dashboard)
// Digunakan oleh frontend JS via ESM.
// =========================================================
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ===================== SUPPLIER ===================== */
export const SupplierAPI = {
  list: () => supabase.from("suppliers").select("*").order("id_supplier"),
  get: (id) => supabase.from("suppliers").select("*").eq("id_supplier", id).single(),
  create: (d) => supabase.from("suppliers").insert(d).select().single(),
  update: (id, d) => supabase.from("suppliers").update(d).eq("id_supplier", id).select().single(),
  remove: (id) => supabase.from("suppliers").delete().eq("id_supplier", id),
};

/* ===================== OBAT ===================== */
export const ObatAPI = {
  list: () => supabase.from("obats").select("*").order("id_obat"),
  get: (id) => supabase.from("obats").select("*").eq("id_obat", id).single(),
  create: (d) => supabase.from("obats").insert(d).select().single(),
  update: (id, d) => supabase.from("obats").update(d).eq("id_obat", id).select().single(),
  remove: (id) => supabase.from("obats").delete().eq("id_obat", id),
};

/* ===================== PEMBELIAN ===================== */
export const PembelianAPI = {
  list: () => supabase.from("v_pembelian_lengkap").select("*").order("id_pembelian", { ascending: false }),
  get: (id) => supabase.from("v_pembelian_lengkap").select("*").eq("id_pembelian", id).single(),
  createDraft: (d) => supabase.from("pembelian").insert({ ...d, status_transaksi: "draft" }).select().single(),
  updateDraft: (id, d) => supabase.from("pembelian").update(d)
                          .eq("id_pembelian", id).eq("status_transaksi", "draft").select().single(),
  finalize: (id) => supabase.from("pembelian").update({ status_transaksi: "final" })
                          .eq("id_pembelian", id).select().single(),
  cancel: (id) => supabase.from("pembelian").update({ status_transaksi: "batal" })
                        .eq("id_pembelian", id).select().single(),
  removeDraft: (id) => supabase.from("pembelian").delete()
                          .eq("id_pembelian", id).eq("status_transaksi", "draft"),
};

/* ===================== PEMBAYARAN UTANG ===================== */
export const PembayaranAPI = {
  list: () => supabase.from("pembayaran_utang")
    .select("*, pembelian(nomor_pembelian, total_pembelian, sisa_utang, status_utang, suppliers(nama_supplier))")
    .order("id_pembayaran", { ascending: false }),
  getByPembelian: (id) => supabase.from("pembayaran_utang").select("*")
    .eq("id_pembelian", id).order("tanggal_pembayaran"),
  create: (d) => supabase.from("pembayaran_utang").insert(d).select().single(),
  remove: (id) => supabase.from("pembayaran_utang").delete().eq("id_pembayaran", id),
};

/* ===================== DASHBOARD ===================== */
export const DashboardAPI = {
  async summary() {
    const [sup, obt, bel, utang] = await Promise.all([
      supabase.from("suppliers").select("*", { count: "exact", head: true }),
      supabase.from("obats").select("*", { count: "exact", head: true }),
      supabase.from("pembelian").select("*", { count: "exact", head: true }).eq("status_transaksi", "final"),
      supabase.from("pembelian").select("sisa_utang")
        .eq("metode_pembayaran", "kredit").eq("status_transaksi", "final"),
    ]);
    const totalUtang = (utang.data || []).reduce((a, b) => a + Number(b.sisa_utang || 0), 0);
    return {
      totalSupplier: sup.count || 0,
      totalObat: obt.count || 0,
      totalPembelian: bel.count || 0,
      totalUtang,
    };
  },
};