import { supabase, rupiah, setActiveMenu } from "./supabaseClient.js";
setActiveMenu();

const $ = (id) => document.getElementById(id);
let dataCache = [];

async function loadData() {
  const tbody = $("tbody");
  const { data, error } = await supabase.from("obats").select("*").order("id_obat");
  if (error) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Gagal memuat: ${error.message}</td></tr>`;
    return;
  }
  dataCache = data || [];
  if (!dataCache.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">Belum ada obat.</td></tr>`;
    return;
  }
  tbody.innerHTML = dataCache.map(o => `
    <tr>
      <td><strong>${o.kode_obat}</strong></td>
      <td>${o.nama_obat}</td>
      <td>${o.kategori || '-'}</td>
      <td>${o.satuan || '-'}</td>
      <td class="text-right">${rupiah(o.harga_beli_terakhir)}</td>
      <td class="text-right"><strong>${o.stok}</strong></td>
      <td class="text-right">
        <button class="btn btn-sm btn-warning" onclick="editRow(${o.id_obat})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="hapusRow(${o.id_obat})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

window.openForm = () => {
  $("modal-title").textContent = "Tambah Obat";
  $("form").reset();
  $("id_obat").value = "";
  $("harga_beli_terakhir").value = 0;
  $("stok").value = 0;
  $("modal").classList.add("show");
};

window.closeForm = () => $("modal").classList.remove("show");

window.editRow = (id) => {
  const o = dataCache.find(x => x.id_obat === id);
  if (!o) return;
  $("modal-title").textContent = "Edit Obat";
  $("id_obat").value = o.id_obat;
  $("kode_obat").value = o.kode_obat;
  $("nama_obat").value = o.nama_obat;
  $("kategori").value = o.kategori || "";
  $("satuan").value = o.satuan || "";
  $("harga_beli_terakhir").value = o.harga_beli_terakhir;
  $("stok").value = o.stok;
  $("modal").classList.add("show");
};

window.submitForm = async (e) => {
  e.preventDefault();
  const id = $("id_obat").value;
  const payload = {
    kode_obat: $("kode_obat").value.trim(),
    nama_obat: $("nama_obat").value.trim(),
    kategori: $("kategori").value.trim() || null,
    satuan: $("satuan").value.trim() || null,
    harga_beli_terakhir: Number($("harga_beli_terakhir").value) || 0,
    stok: Number($("stok").value) || 0,
  };
  if (!payload.kode_obat || !payload.nama_obat) {
    alert("Kode dan Nama Obat wajib diisi.");
    return;
  }
  let res;
  if (id) res = await supabase.from("obats").update(payload).eq("id_obat", id);
  else     res = await supabase.from("obats").insert(payload);
  if (res.error) { alert("Gagal menyimpan: " + res.error.message); return; }
  closeForm();
  loadData();
};

window.hapusRow = async (id) => {
  if (!confirm("Yakin hapus obat ini? (Akan gagal jika sudah dipakai di transaksi)")) return;
  const { error } = await supabase.from("obats").delete().eq("id_obat", id);
  if (error) { alert("Tidak bisa dihapus: " + error.message); return; }
  loadData();
};

loadData();