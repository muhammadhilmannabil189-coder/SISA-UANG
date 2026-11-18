const $ = id => document.getElementById(id);

const form = $("form-transaksi");
const jenis = $("jenis");
const jumlah = $("jumlah");
const kategori = $("kategori");
const sumber = $("sumber");
const tanggal = $("tanggal");
const tujuan = $("tujuan-pemasukan");
const pesan = $("pesan-form");

let transaksi = [];

try {
  transaksi = JSON.parse(
    localStorage.getItem("sisauang-transaksi") || "[]"
  );

  if (!Array.isArray(transaksi)) transaksi = [];
} catch {
  transaksi = [];
}

let idEdit = null;

const rupiah = n => new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0
}).format(Number(n) || 0);

function today() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function save() {
  localStorage.setItem(
    "sisauang-transaksi",
    JSON.stringify(transaksi)
  );
}

function aktif(container, atribut, nilai) {
  container.querySelectorAll("button").forEach(btn => {
    const dipilih = btn.dataset[atribut] === nilai;

    btn.classList.toggle("active", dipilih);
    btn.setAttribute("aria-pressed", String(dipilih));
  });
}

// Pilihan jenis transaksi.
function pilihJenis(nilai) {
  jenis.value = nilai;

  aktif($("pilihan-jenis"), "jenis", nilai);

  $("pilihan-jenis").querySelectorAll("button").forEach(btn => {
    btn.classList.toggle(
      "income",
      btn.dataset.jenis === nilai && nilai === "pemasukan"
    );

    btn.classList.toggle(
      "expense",
      btn.dataset.jenis === nilai && nilai === "pengeluaran"
    );
  });

  aturForm();
}

$("pilihan-jenis").addEventListener("click", e => {
  const btn = e.target.closest("[data-jenis]");

  if (btn) pilihJenis(btn.dataset.jenis);
});

// Pilihan tujuan pemasukan.
$("pilihan-tujuan").addEventListener("click", e => {
  const btn = e.target.closest("[data-tujuan]");

  if (!btn) return;

  tujuan.value = btn.dataset.tujuan;

  aktif($("pilihan-tujuan"), "tujuan", tujuan.value);
});

// Pilihan kategori pengeluaran.
$("pilihan-kategori").addEventListener("click", e => {
  const btn = e.target.closest("[data-kategori]");

  if (!btn) return;

  kategori.value = btn.dataset.kategori;

  aktif($("pilihan-kategori"), "kategori", kategori.value);
});

function aturForm() {
  const tipe = jenis.value;

  $("field-tujuan").classList.toggle(
    "hidden",
    tipe !== "pemasukan"
  );

  $("field-kategori").classList.toggle(
    "hidden",
    tipe !== "pengeluaran"
  );

  $("label-sumber").textContent =
    tipe === "tarik" ? "Nama platform" : "Keterangan";

  sumber.placeholder =
    tipe === "pemasukan"
      ? "Contoh: uang mingguan, live streaming"
      : tipe === "pengeluaran"
        ? "Contoh: makan siang (opsional)"
        : "Nama platform, contoh: Sociabuzz";
}

// Hitung saldo platform.
function saldoPlatform(kecualiId = null) {
  return transaksi.reduce((saldo, item) => {
    if (String(item.id) === String(kecualiId)) return saldo;

    if (
      item.jenis === "pemasukan" &&
      item.tujuan === "platform"
    ) {
      return saldo + Number(item.jumlah);
    }

    if (item.jenis === "tarik") {
      return saldo - Number(item.jumlah);
    }

    return saldo;
  }, 0);
}

// Perbarui ringkasan saldo.
function hitungSaldo() {
  let tersedia = 0;
  let platform = 0;
  let totalMasuk = 0;
  let keluarBulan = 0;

  const bulanIni = today().slice(0, 7);

  transaksi.forEach(item => {
    const nilai = Number(item.jumlah) || 0;

    if (item.jenis === "pemasukan") {
      totalMasuk += nilai;

      if (item.tujuan === "platform") {
        platform += nilai;
      } else {
        tersedia += nilai;
      }

    } else if (item.jenis === "pengeluaran") {
      tersedia -= nilai;

      if ((item.tanggal || "").startsWith(bulanIni)) {
        keluarBulan += nilai;
      }

    } else if (item.jenis === "tarik") {
      platform -= nilai;
      tersedia += nilai;
    }
  });

  $("saldo").textContent = rupiah(tersedia);
  $("pemasukan").textContent = rupiah(totalMasuk);
  $("pengeluaran").textContent = rupiah(keluarBulan);
  $("saldo-platform").textContent = rupiah(platform);
}

// Detail transaksi.
function detail(item) {
  if (item.jenis === "pemasukan") {
    return `${item.sumber || "Pemasukan"} · ${
      item.tujuan === "platform"
        ? "Saldo platform"
        : "Saldo tersedia"
    }`;
  }

  if (item.jenis === "pengeluaran") {
    return `${item.kategori || "Lainnya"}${
      item.sumber ? " · " + item.sumber : ""
    }`;
  }

  return `Pencairan dari ${item.sumber || "platform"}`;
}

function labelJenis(item) {
  if (item.jenis === "pengeluaran") return "Pengeluaran";
  if (item.jenis === "tarik") return "Pencairan platform";

  return "Pemasukan";
}

// Tampilkan riwayat transaksi.
function tampilkanTransaksi() {
  const kata = $("pencarian").value.trim().toLowerCase();

  const daftar = [...transaksi]
    .sort((a, b) =>
      String(b.tanggal).localeCompare(String(a.tanggal)) ||
      Number(b.id) - Number(a.id)
    )
    .filter(item =>
      [
        item.jenis,
        item.kategori,
        item.sumber,
        item.tujuan,
        item.tanggal,
        detail(item)
      ].join(" ").toLowerCase().includes(kata)
    );

  $("jumlah-transaksi").textContent =
    `${daftar.length} transaksi`;

  $("daftar-transaksi").innerHTML = daftar.length
    ? daftar.map(item => `
      <tr>
        <td>${esc(item.tanggal)}</td>
        <td>${esc(labelJenis(item))}</td>
        <td>${esc(detail(item))}</td>
        <td>${item.jenis === "pengeluaran" ? "−" : "+"}${rupiah(item.jumlah)}</td>
        <td>
          <button type="button" data-edit="${esc(item.id)}">Edit</button>
          <button type="button" data-hapus="${esc(item.id)}">Hapus</button>
        </td>
      </tr>
    `).join("")
    : '<tr><td colspan="5" class="empty">Belum ada transaksi yang cocok.</td></tr>';

  $("riwayat-mobile").innerHTML = daftar.map(item => `
    <article class="mobile-card">
      <div class="mobile-card-top">
        <span>${esc(labelJenis(item))}</span>
        <span>${item.jenis === "pengeluaran" ? "−" : "+"}${rupiah(item.jumlah)}</span>
      </div>

      <p>${esc(item.tanggal)} · ${esc(detail(item))}</p>

      <button type="button" data-edit="${esc(item.id)}">Edit</button>
      <button type="button" data-hapus="${esc(item.id)}">Hapus</button>
    </article>
  `).join("");
}

// Reset form.
function resetForm() {
  idEdit = null;

  form.reset();

  jenis.value = "pemasukan";
  kategori.value = "Lainnya";
  tujuan.value = "tersedia";
  tanggal.value = today();

  $("judul-form").textContent = "Tambah transaksi";
  $("tombol-simpan").textContent = "Simpan transaksi";
  $("tombol-batal").classList.add("hidden");

  pesan.textContent = "";
  pesan.style.color = "var(--g)";

  pilihJenis("pemasukan");

  aktif($("pilihan-tujuan"), "tujuan", "tersedia");
  aktif($("pilihan-kategori"), "kategori", "Lainnya");
}

// Format angka dengan pemisah ribuan.
jumlah.addEventListener("input", () => {
  const angka = jumlah.value.replace(/\D/g, "");

  jumlah.value = angka
    ? Number(angka).toLocaleString("id-ID")
    : "";
});

// Simpan transaksi.
form.addEventListener("submit", e => {
  e.preventDefault();

  pesan.textContent = "";

  const nilai = Number(jumlah.value.replace(/\D/g, ""));

  if (!Number.isFinite(nilai) || nilai <= 0) {
    pesan.textContent = "Masukkan jumlah uang yang lebih dari nol.";
    jumlah.focus();
    return;
  }

  if (!tanggal.value) {
    pesan.textContent = "Pilih tanggal transaksi.";
    tanggal.focus();
    return;
  }

  if (
    jenis.value === "tarik" &&
    nilai > saldoPlatform(idEdit)
  ) {
    pesan.textContent =
      "Saldo platform belum cukup. Saldo saat ini " +
      rupiah(saldoPlatform(idEdit)) + ".";

    return;
  }

  const item = {
    id: idEdit ?? Date.now(),
    jenis: jenis.value,
    jumlah: nilai,
    tanggal: tanggal.value,

    kategori: jenis.value === "pengeluaran"
      ? kategori.value
      : "",

    sumber: sumber.value.trim(),

    tujuan: jenis.value === "pemasukan"
      ? tujuan.value
      : ""
  };

  if (idEdit !== null) {
    transaksi = transaksi.map(t =>
      String(t.id) === String(idEdit) ? item : t
    );
  } else {
    transaksi.push(item);
  }

  save();
  hitungSaldo();
  tampilkanTransaksi();
  tampilkanRekap();
  resetForm();

  pesan.style.color = "var(--g)";
  pesan.textContent = "Transaksi berhasil disimpan.";
});

$("tombol-batal").addEventListener("click", resetForm);

// Tombol edit dan hapus.
document.addEventListener("click", e => {
  const tombolEdit = e.target.closest("[data-edit]");
  const tombolHapus = e.target.closest("[data-hapus]");

  if (tombolEdit) {
    const item = transaksi.find(t =>
      String(t.id) === tombolEdit.dataset.edit
    );

    if (!item) return;

    idEdit = item.id;

    jenis.value = item.jenis;
    jumlah.value = Number(item.jumlah).toLocaleString("id-ID");
    tanggal.value = item.tanggal;
    kategori.value = item.kategori || "Lainnya";
    sumber.value = item.sumber || "";
    tujuan.value = item.tujuan || "tersedia";

    $("judul-form").textContent = "Edit transaksi";
    $("tombol-simpan").textContent = "Simpan perubahan";
    $("tombol-batal").classList.remove("hidden");

    pesan.textContent = "";

    pilihJenis(item.jenis);

    aktif($("pilihan-tujuan"), "tujuan", tujuan.value);
    aktif($("pilihan-kategori"), "kategori", kategori.value);

    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  if (tombolHapus) {
    const id = tombolHapus.dataset.hapus;

    transaksi = transaksi.filter(t =>
      String(t.id) !== id
    );

    if (String(idEdit) === id) {
      resetForm();
    }

    save();
    hitungSaldo();
    tampilkanTransaksi();
    tampilkanRekap();

    pesan.style.color = "var(--g)";
    pesan.textContent = "Transaksi dihapus.";
  }
});

// Pencarian riwayat.
$("pencarian").addEventListener("input", tampilkanTransaksi);

// Tanggal hari ini.
$("hari-ini").textContent = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric"
}).format(new Date());


// =====================================
// REKAP PENGELUARAN MINGGUAN & BULANAN
// =====================================

let periodeRekap = "mingguan";

const warnaKategori = [
  "#16a085",
  "#f39c12",
  "#e74c3c",
  "#3498db",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#34495e"
];

// Ubah tanggal menjadi objek Date lokal.
function tanggalLokal(teks) {
  const [tahun, bulan, hari] = teks.split("-").map(Number);

  return new Date(tahun, bulan - 1, hari);
}

// Ubah Date menjadi YYYY-MM-DD.
function formatTanggalKey(date) {
  const tahun = date.getFullYear();
  const bulan = String(date.getMonth() + 1).padStart(2, "0");
  const hari = String(date.getDate()).padStart(2, "0");

  return `${tahun}-${bulan}-${hari}`;
}

// Tentukan rentang tanggal.
function rentangRekap() {
  const sekarang = new Date();

  let mulai;
  let selesai;

  if (periodeRekap === "mingguan") {
    mulai = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth(),
      sekarang.getDate()
    );

    // Senin sebagai hari pertama minggu.
    const selisihHari = (mulai.getDay() + 6) % 7;

    mulai.setDate(mulai.getDate() - selisihHari);

    selesai = new Date(mulai);
    selesai.setDate(selesai.getDate() + 6);

  } else {
    mulai = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth(),
      1
    );

    selesai = new Date(
      sekarang.getFullYear(),
      sekarang.getMonth() + 1,
      0
    );
  }

  return {
    mulai: formatTanggalKey(mulai),
    selesai: formatTanggalKey(selesai)
  };
}

// Label periode.
function labelPeriodeRekap(mulai, selesai) {
  const format = tanggal => new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(tanggalLokal(tanggal));

  if (periodeRekap === "mingguan") {
    return `${format(mulai)} – ${format(selesai)}`;
  }

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric"
  }).format(tanggalLokal(mulai));
}

// Hitung pengeluaran per kategori.
function hitungRekapKategori() {
  const { mulai, selesai } = rentangRekap();

  const pengeluaranPeriode = transaksi.filter(item => {
    return (
      item.jenis === "pengeluaran" &&
      item.tanggal >= mulai &&
      item.tanggal <= selesai
    );
  });

  const total = pengeluaranPeriode.reduce((hasil, item) => {
    return hasil + (Number(item.jumlah) || 0);
  }, 0);

  const kelompok = {};

  pengeluaranPeriode.forEach(item => {
    const namaKategori = item.kategori || "Lainnya";

    kelompok[namaKategori] =
      (kelompok[namaKategori] || 0) +
      (Number(item.jumlah) || 0);
  });

  const kategoriData = Object.entries(kelompok)
    .map(([nama, jumlah]) => ({
      nama,
      jumlah,
      persen: total > 0 ? (jumlah / total) * 100 : 0
    }))
    .sort((a, b) => b.jumlah - a.jumlah);

  return {
    mulai,
    selesai,
    total,
    kategoriData
  };
}

// Buat diagram donat.
function buatDiagram(kategoriData) {
  if (!kategoriData.length) {
    return "conic-gradient(#e5e7eb 0% 100%)";
  }

  let posisi = 0;

  const bagian = kategoriData.map((item, index) => {
    const awal = posisi;

    posisi += item.persen;

    const warna = warnaKategori[index % warnaKategori.length];

    return `${warna} ${awal}% ${posisi}%`;
  });

  return `conic-gradient(${bagian.join(", ")})`;
}

// Tampilkan rekap.
function tampilkanRekap() {
  const container = $("rekap-container");

  if (!container) return;

  const data = hitungRekapKategori();

  const daftarKategori = data.kategoriData.length
    ? data.kategoriData.map((item, index) => {
        const warna = warnaKategori[index % warnaKategori.length];

        return `
          <div class="legend-item">
            <div class="legend-left">
              <span
                class="legend-color"
                style="background:${warna}"
              ></span>

              <span class="legend-name">
                ${esc(item.nama)}
              </span>
            </div>

            <div>
              <div class="legend-percent">
                ${item.persen.toFixed(1)}%
              </div>

              <div class="legend-amount">
                ${rupiah(item.jumlah)}
              </div>
            </div>
          </div>
        `;
      }).join("")
    : `
      <p class="empty">
        Belum ada pengeluaran pada periode ini.
      </p>
    `;

  container.innerHTML = `
    <section class="panel">
      <div class="heading">
        <div>
          <small>RINGKASAN KEUANGAN</small>
          <h2>Rekap pengeluaran</h2>
          <p>Ringkasan pengeluaran berdasarkan kategori</p>
        </div>
      </div>

      <div class="recap-tabs">
        <button
          type="button"
          class="recap-tab ${periodeRekap === "mingguan" ? "active" : ""}"
          data-periode="mingguan"
          aria-pressed="${periodeRekap === "mingguan"}"
        >
          Mingguan
        </button>

        <button
          type="button"
          class="recap-tab ${periodeRekap === "bulanan" ? "active" : ""}"
          data-periode="bulanan"
          aria-pressed="${periodeRekap === "bulanan"}"
        >
          Bulanan
        </button>
      </div>

      <p class="recap-period">
        ${labelPeriodeRekap(data.mulai, data.selesai)}
      </p>

      <div class="recap-total">
        <span>Total pengeluaran</span>
        <strong>${rupiah(data.total)}</strong>
      </div>

      <div class="recap-content">
        <div
          class="donut-chart"
          style="background:${buatDiagram(data.kategoriData)}"
        >
          <div class="donut-hole">
            <span>Total</span>
            <strong>${rupiah(data.total)}</strong>
          </div>
        </div>

        <div class="category-legend">
          ${daftarKategori}
        </div>
      </div>
    </section>
  `;
}

// Ganti periode rekap saat tombol diklik.
document.addEventListener("click", e => {
  const tombol = e.target.closest("[data-periode]");

  if (!tombol) return;

  periodeRekap = tombol.dataset.periode;

  tampilkanRekap();
});

// Jalankan aplikasi saat halaman dibuka.
resetForm();
hitungSaldo();
tampilkanTransaksi();
tampilkanRekap();