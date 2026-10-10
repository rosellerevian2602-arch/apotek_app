import {
  supabase, rupiah, tanggalID, setActiveMenu,
  badgeUtang, badgeMetode, badgeTransaksi
} from "./supabaseClient.js";
setActiveMenu();

const $ = (id) => document.getElementById(id);
let supplierCache = [];
let obatCache = [];
let pembelianCache = [];
let itemSeq = 0;

/* ============ LOAD MASTER ============ */
async function loadMaster() {
  const [s, o] = await Promise.all([
    supabase.from("suppliers").select("*").order("nama_supplier"),
    supabase.from("obats").select("*").order("nama_obat"),
  ]);
  supplierCache = s.data || [];
  obatCache = o.data || [];
}

/* ============ LOAD TABEL ============ */
async function loadTable() {
  const tbody = $("tbody");
  const { data, error } = await supabase
    .from("v_pembelian_lengkap")
    .select("*")
    .order("id_pembelian", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty">Gagal: ${error.message}</td></tr>`;
    return;
  }
  pembelianCache = data || [];
  if (!pembelianCache.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="empty">Belum ada transaksi.</td></tr>`;
    return;
  }
  tbody.innerHTML = pembelianCache.map(p => `
    <tr>
      <td><strong>${p.nomor_pembelian}</strong></td>
      <td>${tanggalID(p.tanggal_pembelian)}</td>
      <td>${p.nama_supplier}</td>
      <td>${badgeMetode(p.metode_pembayaran)}</td>
      <td class="text-right">${rupiah(p.total_pembelian)}</td>
      <td class="text-right">${rupiah(p.total_pembayaran)}</td>
      <td class="text-right">${rupiah(p.sisa_utang)}</td>
      <td>${badgeUtang(p.status_utang)}</td>
      <td>${badgeTransaksi(p.status_transaksi)}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-secondary" onclick="lihatDetail(${p.id_pembelian})">Detail</button>
        ${p.status_transaksi === "draft" ? `
          <button class="btn btn-sm btn-success" onclick="finalize(${p.id_pembelian})">Finalisasi</button>
          <button class="btn btn-sm btn-danger"  onclick="hapusDraft(${p.id_pembelian})">Hapus</button>
        ` : ""}
      </td>
    </tr>
  `).join("");
}

/* ============ FORM ============ */
window.toggleJatuhTempo = () => {
  const m = $("metode_pembayaran").value;
  $("row-jatuh-tempo").style.display = (m === "kredit") ? "block" : "none";
  $("tanggal_jatuh_tempo").required = (m === "kredit");
};

window.addItem = () => {
  const seq = ++itemSeq;
  const tr = document.createElement("tr");
  tr.id = "item-" + seq;
  tr.innerHTML = `
    <td>
      <select class="item-obat" required onchange="hitungBaris(${seq})">
        <option value="">— Pilih Obat —</option>
        ${obatCache.map(o =>
          `<option value="${o.id_obat}" data-harga="${o.harga_beli_terakhir}">${o.kode_obat} — ${o.nama_obat}</option>`
        ).join("")}
      </select>
    </td>
    <td><input type="number" class="item-jumlah" min="1" value="1" required oninput="hitungBaris(${seq})" /></td>
    <td><input type="number" class="item-harga" min="0" step="any" value="0" required oninput="hitungBaris(${seq})" /></td>
    <td class="text-right item-subtotal">Rp 0</td>
    <td class="text-right">
      <button type="button" class="btn btn-sm btn-danger" onclick="removeItem(${seq})">×</button>
    </td>`;
  $("items").appendChild(tr);
};

window.removeItem = (seq) => {
  const tr = $("item-" + seq);
  if (tr) tr.remove();
  hitungTotal();
};

window.hitungBaris = (seq) => {
  const tr = $("item-" + seq);
  if (!tr) return;
  const sel = tr.querySelector(".item-obat");
  const jml = Number(tr.querySelector(".item-jumlah").value) || 0;
  const hrg = Number(tr.querySelector(".item-harga").value) || 0;
  const opt = sel.options[sel.selectedIndex];
  // Auto-isi harga beli terakhir saat pilih obat pertama kali
  if (opt && opt.dataset.harga && tr.querySelector(".item-harga").value === "0") {
    tr.querySelector(".item-harga").value = Number(opt.dataset.harga) || 0;
  }
  const subtotal = jml * (Number(tr.querySelector(".item-harga").value) || 0);
  tr.querySelector(".item-subtotal").textContent = rupiah(subtotal);
  hitungTotal();
};

window.hitungTotal = () => {
  let total = 0;
  document.querySelectorAll("#items tr").forEach(tr => {
    const j = Number(tr.querySelector(".item-jumlah").value) || 0;
    const h = Number(tr.querySelector(".item-harga").value) || 0;
    total += j * h;
  });
  $("grand-total").textContent = rupiah(total);
};

window.openForm = async () => {
  await loadMaster();
  $("modal-title").textContent = "Transaksi Pembelian Baru";
  $("form").reset();
  $("id_pembelian").value = "";
  $("items").innerHTML = "";
  itemSeq = 0;
  $("grand-total").textContent = "Rp 0";
  // Nomor otomatis
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, "");
  $("nomor_pembelian").value = `PB-${ymd}-${String(Date.now()).slice(-3)}`;
  $("tanggal_pembelian").value = now.toISOString().slice(0, 10);

  // Populate supplier
  $("id_supplier").innerHTML = `<option value="">— Pilih Supplier —</option>` +
    supplierCache.map(s => `<option value="${s.id_supplier}">${s.nama_supplier}</option>`).join("");

  toggleJatuhTempo();
  addItem();
  $("modal").classList.add("show");
};

window.closeForm = () => $("modal").classList.remove("show");

/* ============ SUBMIT ============ */
window.submitForm = async (e) => {
  e.preventDefault();
  const btn = $("btn-submit");
  btn.disabled = true;
  btn.textContent = "Menyimpan…";

  // Kumpulkan detail
  const detail = [];
  let valid = true;
  document.querySelectorAll("#items tr").forEach(tr => {
    const sel = tr.querySelector(".item-obat");
    const id_obat = Number(sel.value);
    const jumlah = Number(tr.querySelector(".item-jumlah").value);
    const harga = Number(tr.querySelector(".item-harga").value);
    if (!id_obat || jumlah <= 0 || harga < 0) { valid = false; return; }
    const o = obatCache.find(x => x.id_obat === id_obat);
    detail.push({
      id_obat,
      kode_obat: o?.kode_obat || "",
      nama_obat: o?.nama_obat || "",
      satuan: o?.satuan || "",
      jumlah,
      harga_beli: harga,
      subtotal: jumlah * harga,
    });
  });

  if (!valid || detail.length === 0) {
    alert("Rincian obat belum lengkap / tidak valid.");
    btn.disabled = false; btn.textContent = "Simpan";
    return;
  }

  const total = detail.reduce((a, b) => a + b.subtotal, 0);
  const metode = $("metode_pembayaran").value;
  const payload = {
    nomor_pembelian: $("nomor_pembelian").value.trim(),
    id_supplier: Number($("id_supplier").value),
    tanggal_pembelian: $("tanggal_pembelian").value,
    metode_pembayaran: metode,
    tanggal_jatuh_tempo: metode === "kredit" ? $("tanggal_jatuh_tempo").value : null,
    total_pembelian: total,
    detail_obat: detail,
    status_transaksi: "draft",
  };

  // Simpan sebagai draft
  const { data: created, error } = await supabase
    .from("pembelian").insert(payload).select().single();

  if (error) {
    alert("Gagal menyimpan: " + error.message);
    btn.disabled = false; btn.textContent = "Simpan";
    return;
  }

  // Finalisasi langsung (draft → final) supaya stok & utang tercipta
  const { error: e2 } = await supabase
    .from("pembelian").update({ status_transaksi: "final" })
    .eq("id_pembelian", created.id_pembelian);

  if (e2) {
    alert("Transaksi tersimpan sebagai draft, tetapi finalisasi gagal: " + e2.message);
  }

  closeForm();
  btn.disabled = false; btn.textContent = "Simpan";
  loadTable();
};

/* ============ FINALIZE / HAPUS / DETAIL ============ */
window.finalize = async (id) => {
  if (!confirm("Finalisasi transaksi ini? Stok obat akan bertambah dan utang (jika kredit) akan terbentuk.")) return;
  const { error } = await supabase.from("pembelian")
    .update({ status_transaksi: "final" }).eq("id_pembelian", id);
  if (error) { alert("Gagal finalisasi: " + error.message); return; }
  loadTable();
};

window.hapusDraft = async (id) => {
  if (!confirm("Hapus transaksi draft ini?")) return;
  const { error } = await supabase.from("pembelian")
    .delete().eq("id_pembelian", id).eq("status_transaksi", "draft");
  if (error) { alert("Gagal hapus: " + error.message); return; }
  loadTable();
};

window.lihatDetail = (id) => {
  const p = pembelianCache.find(x => x.id_pembelian === id);
  if (!p) return;
  const items = Array.isArray(p.detail_obat) ? p.detail_obat : [];
  $("detail-body").innerHTML = `
    <div class="card">
      <div class="form-row">
        <div><strong>Nomor:</strong> ${p.nomor_pembelian}</div>
        <div><strong>Tanggal:</strong> ${tanggalID(p.tanggal_pembelian)}</div>
        <div><strong>Supplier:</strong> ${p.nama_supplier}</div>
        <div><strong>Metode:</strong> ${badgeMetode(p.metode_pembayaran)}</div>
        <div><strong>Jatuh Tempo:</strong> ${p.tanggal_jatuh_tempo ? tanggalID(p.tanggal_jatuh_tempo) : "-"}</div>
        <div><strong>Status:</strong> ${badgeTransaksi(p.status_transaksi)} ${badgeUtang(p.status_utang)}</div>
      </div>
    </div>
    <table class="detail-table">
      <thead><tr>
        <th>Kode</th><th>Nama Obat</th><th class="text-right">Jumlah</th>
        <th class="text-right">Harga</th><th class="text-right">Subtotal</th>
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

loadTable();