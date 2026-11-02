/*
 * ui.js — Oyun ekranı: üst bilgi, kaynak kartları, karbon piyasası paneli.
 * Mantık game.js'te (OYUN); burası yalnızca durumu ekrana yansıtır ve düğmeleri bağlar.
 */
"use strict";

const UI = (function () {
  const $ = (id) => document.getElementById(id);
  let durum = null;
  const kartlar = {}; // kaynak id -> kart elemanları
  let mesajZamani = null;

  // Biçimlendirme (Türkçe: 1.234,5). NaN/sonsuz değer ekrana asla sızmaz.
  function sayi(x, ondalik) {
    const n = Number.isFinite(x) ? x : 0;
    return n.toLocaleString("tr-TR", { minimumFractionDigits: ondalik || 0, maximumFractionDigits: ondalik || 0 });
  }
  const isaretli = (x, o) => (x > 0 ? "+" : x < 0 ? "−" : "") + sayi(Math.abs(x), o);

  function mesaj(metin, hata) {
    const el = $("mesaj");
    el.textContent = metin;
    el.className = "mesaj goster" + (hata ? " hata" : "");
    clearTimeout(mesajZamani);
    mesajZamani = setTimeout(() => (el.className = "mesaj"), 3200);
  }

  function mesajiTemizle() {
    clearTimeout(mesajZamani);
    $("mesaj").className = "mesaj";
  }

  function girdiMW(id) { return Math.floor(Number(kartlar[id].girdi.value)) || 0; }

  // Kartları bir kez oluştur; sonraki turlarda yalnızca içerik güncellenir
  function kartlariKur() {
    const kap = $("kartlar");
    kap.textContent = "";
    VERI.kaynaklar.forEach((k) => {
      const b = OYUN.birimMW(k);
      const kart = document.createElement("article");
      kart.className = "kart";
      kart.dataset.id = k.id;
      kart.dataset.grup = k.grup;
      kart.innerHTML =
        '<header class="kart-ust"><h3></h3><span class="mw"><b>0</b> MW</span></header>' +
        '<p class="bilgi"></p>' +
        '<dl class="ozellik">' +
        "<dt>Kurulum (birim/MW)</dt><dd data-a='kurulum'></dd>" +
        "<dt>İşletme (birim/MW·saat)</dt><dd data-a='isletme'></dd>" +
        "<dt>Kapasite faktörü</dt><dd data-a='kf'></dd>" +
        "<dt>Emisyon (gCO₂/kWh)</dt><dd data-a='emisyon'></dd>" +
        "<dt>Net kazanç (1 MW/tur)</dt><dd data-a='net'></dd>" +
        "<dt>Emisyon (1 MW/tur)</dt><dd data-a='tem'></dd>" +
        "</dl>" +
        '<div class="kontrol">' +
        '<input type="number" min="1" step="1" value="1" inputmode="numeric" aria-label="Kurulacak MW">' +
        '<button type="button" class="btn btn-kur">Kur</button>' +
        '<button type="button" class="btn btn-sok" title="Söküm: iade yok">Sök</button>' +
        "</div>" +
        '<p class="maliyet"></p>' +
        '<p class="kilit"></p>';
      kart.querySelector("h3").textContent = k.ad;
      kart.querySelector(".bilgi").textContent = k.bilgi;
      const doldur = (a, m) => (kart.querySelector("[data-a=" + a + "]").textContent = m);
      doldur("kurulum", sayi(k.kurulumMaliyeti));
      doldur("isletme", sayi(k.saatlikIsletme, 2));
      doldur("kf", "%" + sayi(k.kapasiteFaktoru * 100));
      doldur("emisyon", sayi(k.emisyon));
      doldur("net", isaretli(b.gelir - b.gider, 0));
      doldur("tem", sayi(b.emisyon, 1) + " t");

      const o = {
        kart, mw: kart.querySelector(".mw b"), girdi: kart.querySelector("input"),
        kur: kart.querySelector(".btn-kur"), sok: kart.querySelector(".btn-sok"),
        maliyet: kart.querySelector(".maliyet"), kontrol: kart.querySelector(".kontrol"),
        kilit: kart.querySelector(".kilit")
      };
      o.girdi.addEventListener("input", () => guncelle());
      o.kur.addEventListener("click", () => islem(OYUN.kur(durum, k.id, girdiMW(k.id))));
      o.sok.addEventListener("click", () => islem(OYUN.sok(durum, k.id, girdiMW(k.id))));
      kartlar[k.id] = o;
      kap.appendChild(kart);
    });
  }

  function islem(sonuc) {
    mesaj(sonuc.mesaj, !sonuc.ok);
    guncelle();
  }

  function pazarIslem(tip) {
    const ton = Math.floor(Number($("pz-miktar").value)) || 0;
    islem(tip === "al" ? OYUN.karbonAl(durum, ton) : OYUN.karbonSat(durum, ton));
  }

  function baglaPazar() {
    $("pz-al").addEventListener("click", () => pazarIslem("al"));
    $("pz-sat").addEventListener("click", () => pazarIslem("sat"));
    $("pz-miktar").addEventListener("input", () => guncelle());
    $("pz-acik").addEventListener("click", () => {
      const n = OYUN.alinabilirTon(durum);
      if (n < 1) return mesaj("Kapatılacak (alınabilir) bir açık yok.", true);
      $("pz-miktar").value = n; guncelle();
    });
    $("pz-fazla").addEventListener("click", () => {
      const n = OYUN.satilabilirTon(durum);
      if (n < 1) return mesaj("Satılacak fazla izin yok.", true);
      $("pz-miktar").value = n; guncelle();
    });
  }

  function ustuGuncelle() {
    const t = OYUN.turVerisi(durum);
    const em = OYUN.projeEmisyon(durum), oran = em / t.limit;
    $("ust-tur").textContent = durum.tur;
    $("ust-toplam").textContent = VERI.toplamTur;
    $("ust-donem").textContent = t.donem;
    $("ust-kasa").textContent = sayi(durum.kasa, 0);
    $("ust-borc").textContent = durum.borc > 0 ? "borç: " + sayi(durum.borc, 0) : "birim";
    $("ust-emisyon").textContent = sayi(em, 1);
    $("ust-limit").textContent = sayi(t.limit);
    const cubuk = $("ust-cubuk");
    cubuk.style.width = Math.min(100, oran * 100) + "%";
    cubuk.className = "cubuk-dolu " + (oran > 1 ? "tehlike" : oran > 0.8 ? "uyari" : "iyi");
    const isinma = OYUN.sicaklik(durum.toplamEmisyon + em);
    const s = $("ust-sicaklik");
    s.textContent = "+" + sayi(isinma, 2) + " °C";
    s.className = "deger " + (isinma > VERI.isinmaSiniri ? "tehlike-yazi" : isinma > VERI.isinmaHedefi ? "uyari-yazi" : "");
    $("tur-notu").textContent = "Tur " + durum.tur + " · " + t.donem + " — " + t.not;
  }

  function kartlariGuncelle() {
    VERI.kaynaklar.forEach((k) => {
      const o = kartlar[k.id], acik = OYUN.acikMi(k, durum.tur), mw = durum.kapasite[k.id];
      o.kart.classList.toggle("kilitli", !acik);
      o.kart.classList.toggle("yeni", acik && durum.tur > 1 && k.acilisTuru === durum.tur);
      o.kart.classList.toggle("dolu", mw > 0);
      o.mw.textContent = sayi(mw);
      o.kontrol.hidden = o.maliyet.hidden = !acik;
      o.kilit.hidden = acik;
      o.kilit.textContent = "Kilitli — " + k.acilisTuru + ". turda açılır";
      if (!acik) return;
      const n = girdiMW(k.id), tutar = n * k.kurulumMaliyeti;
      o.kur.disabled = n < 1 || mw + n > k.maxMW || tutar > durum.kasa;
      o.sok.disabled = n < 1 || n > mw;
      o.maliyet.textContent = "Maliyet: " + sayi(tutar) + " · kurulu " + sayi(mw) + "/" + k.maxMW + " MW";
    });
  }

  function pazariGuncelle() {
    const t = OYUN.turVerisi(durum), fiyat = OYUN.karbonFiyati(durum);
    const fark = OYUN.izinFarki(durum), em = OYUN.projeEmisyon(durum);
    $("pz-fiyat").textContent = sayi(fiyat, 2);
    $("pz-durum").textContent =
      "Limit " + sayi(t.limit) + " t · izin " + sayi(OYUN.izinMiktari(durum)) + " t · tahmini emisyon " + sayi(em, 1) + " t → " +
      (fark >= 0 ? "fazla izin: " + sayi(fark, 1) + " t" : "AÇIK: " + sayi(-fark, 1) + " t");
    const acik = Math.max(0, em - OYUN.izinMiktari(durum));
    const ceza = acik * fiyat * VERI.piyasa.cezaCarpani;
    $("pz-ceza").textContent = acik > 0
      ? "Şimdi bitirirsen ceza: " + sayi(ceza, 0) + " birim (alım her zaman daha ucuz)."
      : "Limit içindesin; ceza yok.";
    $("pz-ceza").className = "uyari" + (acik > 0 ? " tehlike-yazi" : "");
    const ton = Math.floor(Number($("pz-miktar").value)) || 0;
    $("pz-al").disabled = ton < 1 || ton > OYUN.alinabilirTon(durum);
    $("pz-sat").disabled = ton < 1 || ton > OYUN.satilabilirTon(durum);
  }

  function guncelle() {
    if (!durum) return;
    ustuGuncelle();
    kartlariGuncelle();
    pazariGuncelle();
  }

  function yeniOyun(d) {
    durum = d;
    if (!kartlar.komur) { kartlariKur(); baglaPazar(); }
    VERI.kaynaklar.forEach((k) => (kartlar[k.id].girdi.value = 1));
    $("pz-miktar").value = 10;
    guncelle();
  }

  return { yeniOyun, guncelle, mesaj, mesajiTemizle, sayi, isaretli };
})();
