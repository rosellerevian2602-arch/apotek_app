import {
  supabase, rupiah, tanggalID, setActiveMenu,
  badgeUtang, badgeMetode
} from "./supabaseClient.js";
setActiveMenu();

const $ = (id) => document.getElementById(id);
let kreditCache = []; // pembelian kredit bersaldo

/* ============ LOAD DAFTAR UTANG ============ */
async function loadUtang() {
  const tbody = $("tbody-utang");
  const { data, error } = await supabase
    .from("v_pembelian_lengkap")
    .select("*")
    .eq("metode_pembayaran", "kredit")
    .eq("status_transaksi", "final")
    .order("id_pembelian", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Gagal: ${error.message}</td></tr>`;
    return;
  }
  kreditCache = (data || []).filter(x => Number(x.sisa_utang) > 0);
  if (!kreditCache.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Tidak ada utang bersaldo. 🎉</td></tr>`;
    return;
  }
  tbody.innerHTML = kreditCache.map(p => `
    <tr>
      <td><strong>${p.nomor_pembelian}</strong></td>
      <td>${p.nama_supplier}</td>
      <td>${tanggalID(p.tanggal_pembelian)}</td>
      <td>${p.tanggal_jatuh_tempo ? tanggalID(p.tanggal_jatuh_tempo) : '-'}</td>
      <td class="text-right">${rupiah(p.total_pembelian)}</td>
      <td class="text-right">${rupiah(p.total_pembayaran)}</td>
      <td class="text-right"><strong>${rupiah(p.sisa_utang)}</strong></td>
      <td>${badgeUtang(p.status_utang)}</td>
    </tr>
  `).join("");
}

/* ============ LOAD RIWAYAT PEMBAYARAN ============ */
async function loadRiwayat() {
  const tbody = $("tbody-bayar");
  const { data, error } = await supabase
    .from("pembayaran_utang")
    .select("*, pembelian(nomor_pembelian, suppliers(nama_supplier))")
    .order("id_pembayaran", { ascending: false });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Gagal: ${error.message}</td></tr>`;
    return;
  }
  if (!data?.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Belum ada pembayaran.</td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(b => `
    <tr>
      <td>${b.pembelian?.nomor_pembelian || '-'}</td>
      <td>${b.pembelian?.suppliers?.nama_supplier || '-'}</td>
      <td>${tanggalID(b.tanggal_pembayaran)}</td>
      <td class="text-right"><strong>${rupiah(b.nominal_pembayaran)}</strong></td>
      <td>${b.metode_pembayaran || '-'}</td>
      <td>${b.keterangan || '-'}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-danger" onclick="hapusBayar(${b.id_pembayaran})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

/* ============ FORM ============ */
window.openForm = async () => {
  await loadUtang();
  if (!kreditCache.length) {
    alert("Tidak ada pembelian kredit yang masih bersaldo.");
    return;
  }
  $("form").reset();
  $("info-utang").style.display = "none";
  $("tanggal_pembayaran").value = new Date().toISOString().slice(0, 10);

  const sel = $("id_pembelian");
  sel.innerHTML = `<option value="">— Pilih Pembelian —</option>` +
    kreditCache.map(p =>
      `<option value="${p.id_pembelian}" data-sisa="${p.sisa_utang}" data-total="${p.total_pembelian}" data-bayar="${p.total_pembayaran}">
        ${p.nomor_pembelian} — ${p.nama_supplier} (Sisa ${rupiah(p.sisa_utang)})
      </option>`).join("");

  $("modal").classList.add("show");
};

window.closeForm = () => $("modal").classList.remove("show");

window.onPilihPembelian = () => {
  const sel = $("id_pembelian");
  const opt = sel.options[sel.selectedIndex];
  if (!opt || !opt.value) { $("info-utang").style.display = "none"; return; }
  const sisa = Number(opt.dataset.sisa);
  const total = Number(opt.dataset.total);
  const bayar = Number(opt.dataset.bayar);
  $("info-utang").style.display = "block";
  $("info-utang").innerHTML = `
    Total Pembelian: <strong>${rupiah(total)}</strong> &nbsp;|&nbsp;
    Sudah Dibayar: <strong>${rupiah(bayar)}</strong> &nbsp;|&nbsp;
    Sisa Utang: <strong class="text-danger">${rupiah(sisa)}</strong>
  `;
  $("nominal_pembayaran").max = sisa;
};

window.submitForm = async (e) => {
  e.preventDefault();
  const id_pembelian = Number($("id_pembelian").value);
  const nominal = Number($("nominal_pembayaran").value);

  const p = kreditCache.find(x => x.id_pembelian === id_pembelian);
  if (!p) { alert("Pembelian tidak valid."); return; }

  if (nominal <= 0) { alert("Nominal harus lebih besar dari 0."); return; }
  if (nominal > Number(p.sisa_utang)) {
    alert(`Nominal melebihi sisa utang (${rupiah(p.sisa_utang)}).`);
    return;
  }

  const payload = {
    id_pembelian,
    tanggal_pembayaran: $("tanggal_pembayaran").value,
    nominal_pembayaran: nominal,
    metode_pembayaran: $("metode_pembayaran").value.trim() || null,
    keterangan: $("keterangan").value.trim() || null,
    status_pembayaran: "final",
  };

  const { error } = await supabase.from("pembayaran_utang").insert(payload);
  if (error) { alert("Gagal menyimpan: " + error.message); return; }

  closeForm();
  loadUtang();
  loadRiwayat();
};

window.hapusBayar = async (id) => {
  if (!confirm("Hapus pembayaran ini? Sisa utang akan dihitung ulang.")) return;
  const { error } = await supabase.from("pembayaran_utang").delete().eq("id_pembayaran", id);
  if (error) { alert("Gagal hapus: " + error.message); return; }
  loadUtang();
  loadRiwayat();
};

loadUtang();
loadRiwayat();