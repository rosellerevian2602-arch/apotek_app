import {
  supabase, rupiah, tanggalID, setActiveMenu,
  badgeUtang, badgeMetode, badgeTransaksi
} from "./supabaseClient.js";
setActiveMenu();

const $ = (id) => document.getElementById(id);
let cache = [];

/* Populate supplier filter */
async function loadSupplierFilter() {
  const { data } = await supabase.from("suppliers").select("*").order("nama_supplier");
  const sel = $("f-supplier");
  (data || []).forEach(s => {
    const o = document.createElement("option");
    o.value = s.id_supplier;
    o.textContent = s.nama_supplier;
    sel.appendChild(o);
  });
}

/* Load data dengan filter */
async function loadData() {
  const tbody = $("tbody");
  tbody.innerHTML = `<tr><td colspan="10" class="loading"><div class="spinner"></div>Memuat…</td></tr>`;

  let q = supabase.from("v_pembelian_lengkap").select("*")
    .eq("status_transaksi", "final")
    .order("tanggal_pembelian", { ascending: false });

  const dari    = $("f-dari").value;
  const sampai  = $("f-sampai").value;
  const sup     = $("f-supplier").value;
  const metode  = $("f-metode").value;

  if (dari)   q = q.gte("tanggal_pembelian", dari);
  if (sampai) q = q.lte("tanggal_pembelian", sampai);
  if (sup)    q = q.eq("id_supplier", sup);
  if (metode) q = q.eq("metode_pembayaran", metode);

  const { data, error } = await q;
  if (error) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty">Gagal: ${error.message}</td></tr>`;
    return;
  }
  cache = data || [];
  if (!cache.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty">Tidak ada data sesuai filter.</td></tr>`;
    return;
  }
  tbody.innerHTML = cache.map(p => `
    <tr>
      <td><strong>${p.nomor_pembelian}</strong></td>
      <td>${tanggalID(p.tanggal_pembelian)}</td>
      <td>${p.nama_supplier}</td>
      <td>${badgeMetode(p.metode_pembayaran)}</td>
      <td>${p.tanggal_jatuh_tempo ? tanggalID(p.tanggal_jatuh_tempo) : '-'}</td>
      <td class="text-right">${rupiah(p.total_pembelian)}</td>
      <td class="text-right">${rupiah(p.total_pembayaran)}</td>
      <td class="text-right">${rupiah(p.sisa_utang)}</td>
      <td>${badgeUtang(p.status_utang)}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-secondary" onclick="lihatDetail(${p.id_pembelian})">Detail</button>
      </td>
    </tr>
  `).join("");
}

window.resetFilter = () => {
  $("f-dari").value = "";
  $("f-sampai").value = "";
  $("f-supplier").value = "";
  $("f-metode").value = "";
  loadData();
};

window.lihatDetail = (id) => {
  const p = cache.find(x => x.id_pembelian === id);
  if (!p) return;
  const items = Array.isArray(p.detail_obat) ? p.detail_obat : [];
  $("detail-body").innerHTML = `
    <div class="card">
      <div class="form-row">
        <div><strong>Nomor:</strong> ${p.nomor_pembelian}</div>
        <div><strong>Tanggal:</strong> ${tanggalID(p.tanggal_pembelian)}</div>
        <div><strong>Supplier:</strong> ${p.nama_supplier}</div>
        <div><strong>Metode:</strong> ${badgeMetode(p.metode_pembayaran)}</div>
        <div><strong>Jatuh Tempo:</strong> ${p.tanggal_jatuh_tempo ? tanggalID(p.tanggal_jatuh_tempo) : '-'}</div>
        <div><strong>Status:</strong> ${badgeTransaksi(p.status_transaksi)} ${badgeUtang(p.status_utang)}</div>
      </div>
    </div>
    <table class="detail-table">
      <thead><tr>
        <th>Kode</th><th>Nama Obat</th>
        <th class="text-right">Jumlah</th>
        <th class="text-right">Harga</th>
        <th class="text-right">Subtotal</th>
      </tr></thead>
      <tbody>
        ${items.map(i => `
          <tr>
            <td>${i.kode_obat}</td>
            <td>${i.nama_obat}</td>
            <td class="text-right">${i.jumlah} ${i.satuan || ""}</td>
            <td class="text-right">${rupiah(i.harga_beli)}</td>
            <td class="text-right">${rupiah(i.subtotal)}</td>
          </tr>`).join("")}
      </tbody>
      <tfoot><tr>
        <th colspan="4" class="text-right">Total</th>
        <th class="text-right">${rupiah(p.total_pembelian)}</th>
      </tr></tfoot>
    </table>
    ${p.metode_pembayaran === "kredit" ? `
      <div class="card mt-3">
        <div class="flex-between">
          <div>Total Dibayar: <strong>${rupiah(p.total_pembayaran)}</strong></div>
          <div>Sisa Utang: <strong>${rupiah(p.sisa_utang)}</strong></div>
        </div>
      </div>` : ""}
  `;
  $("modal-detail").classList.add("show");
};

loadSupplierFilter();
loadData();