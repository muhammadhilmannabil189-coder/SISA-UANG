
const form = document.getElementById("form-transaksi");
const jenisInput = document.getElementById("jenis");
const pilihanJenis = document.createElement("div");
pilihanJenis.className = "pilihan-jenis";

pilihanJenis.innerHTML = `
  <button type="button" class="tombol-jenis" data-jenis="pemasukan">
    ＋ Pemasukan
  </button>
  <button type="button" class="tombol-jenis" data-jenis="pengeluaran">
    − Pengeluaran
  </button>
`;

jenisInput.insertAdjacentElement("afterend", pilihanJenis);
jenisInput.style.display = "none";

function perbaruiTombolJenis() {
  pilihanJenis.querySelectorAll(".tombol-jenis").forEach((tombol) => {
    const aktif = tombol.dataset.jenis === jenisInput.value;

    tombol.classList.toggle(
      "aktif-pemasukan",
      aktif && jenisInput.value === "pemasukan"
    );

    tombol.classList.toggle(
      "aktif-pengeluaran",
      aktif && jenisInput.value === "pengeluaran"
    );

    tombol.setAttribute("aria-pressed", String(aktif));
  });
}

pilihanJenis.addEventListener("click", (event) => {
  const tombol = event.target.closest("[data-jenis]");
  if (!tombol) return;

  jenisInput.value = tombol.dataset.jenis;
  jenisInput.dispatchEvent(new Event("change", { bubbles: true }));

  perbaruiTombolJenis();
});

jenisInput.addEventListener("change", perbaruiTombolJenis);

perbaruiTombolJenis();

const jumlahInput = document.getElementById("jumlah");
const kategoriInput = document.getElementById("kategori");
const sumberInput = document.getElementById("sumber");
const tanggalInput = document.getElementById("tanggal");
const daftarTransaksi = document.getElementById("daftar-transaksi");
const pencarianInput = document.getElementById("pencarian");



jumlahInput.type = "text";
jumlahInput.inputMode = "numeric";
jumlahInput.placeholder = "Contoh: 100.000";

jumlahInput.addEventListener("input", function () {
  let angka = this.value.replace(/\D/g, "");

  if (angka) {
    this.value = Number(angka).toLocaleString("id-ID");
  } else {
    this.value = "";
  }
});


const formatRupiah = (angka) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(angka);

let transaksi = JSON.parse(
  localStorage.getItem("sisauang-transaksi") || "[]"
);

let idEdit = null;

const labelSumber = document.querySelector('label[for="sumber"]');

const tujuanWrapper = document.createElement("div");
tujuanWrapper.innerHTML = `
  <label for="tujuan-pemasukan">Uang masuk ke</label>
  <select id="tujuan-pemasukan">
    <option value="tersedia">Saldo tersedia</option>
    <option value="platform">Saldo platform (belum dicairkan)</option>
  </select>
`;

form.insertBefore(tujuanWrapper, sumberInput);
const tujuanInput = document.getElementById("tujuan-pemasukan");


tanggalInput.value = new Date().toLocaleDateString("en-CA");


function simpanData() {
  localStorage.setItem(
    "sisauang-transaksi",
    JSON.stringify(transaksi)
  );
}


function hitungSaldo() {
  let saldoTersedia = 0;
  let saldoPlatform = 0;
  let totalPemasukan = 0;
  let totalPengeluaranBulanIni = 0;

  const bulanIni = new Date().toISOString().slice(0, 7);

  transaksi.forEach((item) => {
    const jumlah = Number(item.jumlah);

    if (item.jenis === "pemasukan") {
      totalPemasukan += jumlah;

      if (item.tujuan === "platform") {
        saldoPlatform += jumlah;
      } else {
        saldoTersedia += jumlah;
      }
    }

    if (item.jenis === "pengeluaran") {
      saldoTersedia -= jumlah;

      if (item.tanggal.startsWith(bulanIni)) {
        totalPengeluaranBulanIni += jumlah;
      }
    }

    if (item.jenis === "tarik") {
      saldoPlatform -= jumlah;
      saldoTersedia += jumlah;
    }
  });

  document.getElementById("saldo").textContent =
    formatRupiah(saldoTersedia);

  document.getElementById("pemasukan").textContent =
    formatRupiah(totalPemasukan);

  document.getElementById("pengeluaran").textContent =
    formatRupiah(totalPengeluaranBulanIni);

  document.getElementById("saldo-platform").textContent =
    formatRupiah(saldoPlatform);
}


function aturForm() {
  perbaruiTombolJenis();
  const jenis = jenisInput.value;
  const labelKategori = document.querySelector(
    'label[for="kategori"]'
  );

  tujuanWrapper.style.display =
    jenis === "pemasukan" ? "block" : "none";

  kategoriInput.style.display =
    jenis === "pengeluaran" ? "block" : "none";

  if (labelKategori) {
    labelKategori.style.display =
      jenis === "pengeluaran" ? "block" : "none";
    labelKategori.textContent = "Kategori pengeluaran";
  }

  if (jenis === "pemasukan") {
    sumberInput.placeholder =
      "Contoh: uang mingguan, live streaming";
  } else if (jenis === "pengeluaran") {
    sumberInput.placeholder =
      "Keterangan (opsional)";
  } else {
    sumberInput.placeholder =
      "Nama platform, contoh: Sociabuzz";
  }
}

jenisInput.addEventListener("change", aturForm);


function aman(teks) {
  return String(teks ?? "").replace(/[&<>"']/g, (karakter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[karakter]);
}


function tampilkanTransaksi() {
  const kataKunci = (pencarianInput?.value || "").toLowerCase();

  const hasil = [...transaksi]
    .sort((a, b) =>
      b.tanggal.localeCompare(a.tanggal) || b.id - a.id
    )
    .filter((item) => {
      const teks = [
        item.jenis,
        item.kategori,
        item.sumber,
        item.tujuan,
        item.tanggal
      ].join(" ").toLowerCase();

      return teks.includes(kataKunci);
    });

  if (hasil.length === 0) {
    daftarTransaksi.innerHTML = `
      <tr>
        <td colspan="5">Belum ada transaksi.</td>
      </tr>
    `;
    return;
  }

  daftarTransaksi.innerHTML = hasil.map((item) => {
    let namaJenis = "Pemasukan";
    let tanda = "+";

    if (item.jenis === "pengeluaran") {
      namaJenis = "Pengeluaran";
      tanda = "-";
    } else if (item.jenis === "tarik") {
      namaJenis = "Pencairan platform";
      namaJenis += " → saldo tersedia";
    }

    const detail = item.jenis === "pemasukan"
      ? `${item.sumber || "Pemasukan"} (${item.tujuan === "platform" ? "Saldo platform" : "Saldo tersedia"})`
      : item.jenis === "pengeluaran"
        ? `${item.kategori || "Lainnya"}${item.sumber ? " — " + item.sumber : ""}`
        : `Pencairan dari ${item.sumber || "platform"}`;

    return `
      <tr>
        <td>${aman(item.tanggal)}</td>
        <td>${aman(namaJenis)}</td>
        <td>${aman(detail)}</td>
        <td>${tanda}${formatRupiah(Number(item.jumlah))}</td>
        <td>
          <button type="button" data-edit="${item.id}">Edit</button>
          <button type="button" data-hapus="${item.id}">Hapus</button>
        </td>
      </tr>
    `;
  }).join("");
}


form.addEventListener("submit", (event) => {
  event.preventDefault();

  const jenis = jenisInput.value;
  const jumlah = Number(jumlahInput.value.replace(/\./g, ""));
  const tanggal = tanggalInput.value;

  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    alert("Masukkan jumlah uang yang lebih dari nol.");
    return;
  }

  if (!tanggal) {
    alert("Pilih tanggal transaksi.");
    return;
  }

  const dataBaru = {
    id: idEdit ?? Date.now(),
    jenis,
    jumlah,
    tanggal,
    kategori: jenis === "pengeluaran"
      ? kategoriInput.value
      : "",
    sumber: sumberInput.value.trim(),
    tujuan: jenis === "pemasukan"
      ? tujuanInput.value
      : ""
  };


  if (jenis === "tarik") {
    const saldoPlatformSekarang = transaksi.reduce((saldo, item) => {
      if (item.id === idEdit) return saldo;

      if (item.jenis === "pemasukan" && item.tujuan === "platform") {
        return saldo + Number(item.jumlah);
      }

      if (item.jenis === "tarik") {
        return saldo - Number(item.jumlah);
      }

      return saldo;
    }, 0);

    if (jumlah > saldoPlatformSekarang) {
      alert(
        `Saldo platform hanya ${formatRupiah(saldoPlatformSekarang)}. Jumlah pencairan terlalu besar.`
      );
      return;
    }
  }

  if (idEdit !== null) {
    transaksi = transaksi.map((item) =>
      item.id === idEdit ? dataBaru : item
    );
    idEdit = null;
  } else {
    transaksi.push(dataBaru);
  }

  simpanData();
  hitungSaldo();
  tampilkanTransaksi();

  form.reset();
  tanggalInput.value = new Date().toLocaleDateString("en-CA");
  aturForm();
});


daftarTransaksi.addEventListener("click", (event) => {
  const tombolEdit = event.target.closest("[data-edit]");
  const tombolHapus = event.target.closest("[data-hapus]");

  if (tombolEdit) {
    const id = Number(tombolEdit.dataset.edit);
    const item = transaksi.find((data) => data.id === id);

    if (!item) return;

    idEdit = item.id;
    jenisInput.value = item.jenis;
    jumlahInput.value = item.jumlah;
    tanggalInput.value = item.tanggal;
    kategoriInput.value = item.kategori || "Lainnya";
    sumberInput.value = item.sumber || "";
    tujuanInput.value = item.tujuan || "tersedia";

    aturForm();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    jumlahInput.focus();
  }

  if (tombolHapus) {
    const id = Number(tombolHapus.dataset.hapus);

    if (!confirm("Yakin mau menghapus transaksi ini?")) return;

    transaksi = transaksi.filter((item) => item.id !== id);

    if (idEdit === id) {
      idEdit = null;
      form.reset();
      tanggalInput.value = new Date().toLocaleDateString("en-CA");
      aturForm();
    }

    simpanData();
    hitungSaldo();
    tampilkanTransaksi();
  }
});

if (pencarianInput) {
  pencarianInput.addEventListener("input", tampilkanTransaksi);
}


aturForm();
hitungSaldo();
tampilkanTransaksi();
