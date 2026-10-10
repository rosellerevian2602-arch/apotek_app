import { supabase, setActiveMenu } from "./supabaseClient.js";
setActiveMenu();

const $ = (id) => document.getElementById(id);
let dataCache = [];

async function loadData() {
  const tbody = $("tbody");
  const { data, error } = await supabase.from("suppliers").select("*").order("id_supplier");
  if (error) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">Gagal memuat: ${error.message}</td></tr>`;
    return;
  }
  dataCache = data || [];
  if (!dataCache.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty">Belum ada supplier.</td></tr>`;
    return;
  }
  tbody.innerHTML = dataCache.map(s => `
    <tr>
      <td><strong>${s.kode_supplier}</strong></td>
      <td>${s.nama_supplier}</td>
      <td>${s.alamat || '-'}</td>
      <td>${s.telepon || '-'}</td>
      <td class="text-right">
        <button class="btn btn-sm btn-warning" onclick="editRow(${s.id_supplier})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="hapusRow(${s.id_supplier})">Hapus</button>
      </td>
    </tr>
  `).join("");
}

window.openForm = () => {
  $("modal-title").textContent = "Tambah Supplier";
  $("form").reset();
  $("id_supplier").value = "";
  $("modal").classList.add("show");
};

window.closeForm = () => $("modal").classList.remove("show");

window.editRow = (id) => {
  const s = dataCache.find(x => x.id_supplier === id);
  if (!s) return;
  $("modal-title").textContent = "Edit Supplier";
  $("id_supplier").value = s.id_supplier;
  $("kode_supplier").value = s.kode_supplier;
  $("nama_supplier").value = s.nama_supplier;
  $("alamat").value = s.alamat || "";
  $("telepon").value = s.telepon || "";
  $("modal").classList.add("show");
};

window.submitForm = async (e) => {
  e.preventDefault();
  const id = $("id_supplier").value;
  const payload = {
    kode_supplier: $("kode_supplier").value.trim(),
    nama_supplier: $("nama_supplier").value.trim(),
    alamat: $("alamat").value.trim() || null,
    telepon: $("telepon").value.trim() || null,
  };
  if (!payload.kode_supplier || !payload.nama_supplier) {
    alert("Kode dan Nama Supplier wajib diisi.");
    return;
  }
  let res;
  if (id) {
    res = await supabase.from("suppliers").update(payload).eq("id_supplier", id);
  } else {
    res = await supabase.from("suppliers").insert(payload);
  }
  if (res.error) {
    alert("Gagal menyimpan: " + res.error.message);
    return;
  }
  closeForm();
  loadData();
};

window.hapusRow = async (id) => {
  if (!confirm("Yakin hapus supplier ini? (Akan gagal jika sudah dipakai di transaksi)")) return;
  const { error } = await supabase.from("suppliers").delete().eq("id_supplier", id);
  if (error) {
    alert("Tidak bisa dihapus: " + error.message);
    return;
  }
  loadData();
};

loadData();