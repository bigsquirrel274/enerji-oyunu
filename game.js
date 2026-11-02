/*
 * game.js — Oyun mantığı (arayüzden bağımsız).
 * Tüm durum tek bir "durum" nesnesinde tutulur; fonksiyonlar bu nesneyi değiştirir
 * ve { ok, mesaj } döndürür. Para değerleri 2 ondalığa yuvarlanır (kayan nokta kayması olmasın).
 */
"use strict";

const OYUN = (function () {
  const yuvarla2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const yuvarla1 = (x) => Math.round((x + Number.EPSILON) * 10) / 10;
  const kaynakBul = (id) => VERI.kaynaklar.find((k) => k.id === id);
  const f = (x) => x.toLocaleString("tr-TR", { maximumFractionDigits: 2 }); // mesajlarda Türkçe sayı biçimi
  const sayiMi = (x) => typeof x === "number" && Number.isFinite(x);

  // Sayıyı güvenli tam sayıya çevirir; geçersizse 0 döner (NaN koruması)
  function tamSayi(x) {
    const n = Math.floor(Number(x));
    return sayiMi(n) && n > 0 ? n : 0;
  }

  function yeniOyun() {
    const kapasite = {};
    VERI.kaynaklar.forEach((k) => (kapasite[k.id] = 0));
    return {
      tur: 1,
      kasa: VERI.baslangicKasa,
      borc: 0,                // kasadan ödenemeyen ceza/işletme açığı
      kapasite,               // kaynak id -> kurulu MW
      karbonNet: 0,           // bu tur satın alınan (+) / satılan (-) izin (tCO2)
      turKarbonNakit: 0,      // bu turun karbon alım/satım nakit sonucu
      turYatirim: 0,          // bu turun kurulum harcaması
      turBaslangicKasa: VERI.baslangicKasa,
      toplamEmisyon: 0,
      toplamCeza: 0,          // turlarda ödenen/borçlanılan toplam limit aşım cezası
      raporlar: [],
      bitti: false,
      sonuc: null
    };
  }

  const turVerisi = (d) => VERI.turlar[Math.min(d.tur, VERI.toplamTur) - 1];
  const acikMi = (k, tur) => tur >= k.acilisTuru;
  const toplamButce = () => VERI.turlar.reduce((t, x) => t + x.limit, 0);

  // 1 MW'ın bir turdaki üretimi (MWh), geliri, işletme gideri ve emisyonu (tCO2)
  function birimMW(k) {
    const uretim = k.kapasiteFaktoru * VERI.turSaati;
    return {
      uretim,
      gelir: uretim * VERI.elektrikFiyati,
      gider: k.saatlikIsletme * VERI.turSaati,
      emisyon: (uretim * k.emisyon) / 1000 // MWh × g/kWh / 1000 = ton
    };
  }

  // Mevcut kapasiteden bu turun toplamları
  function turHesabi(d) {
    let gelir = 0, gider = 0, emisyon = 0;
    VERI.kaynaklar.forEach((k) => {
      const mw = d.kapasite[k.id];
      if (!mw) return;
      const b = birimMW(k);
      gelir += mw * b.gelir;
      gider += mw * b.gider;
      emisyon += mw * b.emisyon;
    });
    return { gelir: yuvarla2(gelir), gider: yuvarla2(gider), emisyon: yuvarla1(emisyon) };
  }

  const projeEmisyon = (d) => turHesabi(d).emisyon;
  const izinMiktari = (d) => turVerisi(d).limit + d.karbonNet; // eldeki toplam izin

  // Karbon fiyatı: tabanFiyat × (1 + eğim × (emisyon/limit − 1)), alt sınırlı, 2 ondalık
  function karbonFiyati(d) {
    const t = turVerisi(d);
    const oran = projeEmisyon(d) / t.limit;
    const carpan = Math.max(VERI.piyasa.altKatsayi, 1 + VERI.piyasa.egim * (oran - 1));
    return Math.max(0.01, yuvarla2(t.tabanFiyat * carpan));
  }

  // Pozitif: izin fazlası (satılabilir), negatif: izin açığı (alınmalı)
  const izinFarki = (d) => yuvarla1(izinMiktari(d) - projeEmisyon(d));
  const satilabilirTon = (d) => Math.max(0, Math.floor(izinFarki(d)));
  const alinabilirTon = (d) => {
    const acik = Math.max(0, Math.ceil(-izinFarki(d)));
    const fiyat = karbonFiyati(d);
    return Math.min(acik, Math.floor(d.kasa / fiyat)); // kasa yetmeyeni alamaz
  };

  function kur(d, id, mw) {
    const k = kaynakBul(id), n = tamSayi(mw);
    if (d.bitti) return { ok: false, mesaj: "Oyun bitti." };
    if (!k) return { ok: false, mesaj: "Bilinmeyen kaynak." };
    if (!acikMi(k, d.tur)) return { ok: false, mesaj: k.ad + " henüz açılmadı." };
    if (n < 1) return { ok: false, mesaj: "Geçerli bir MW değeri girin." };
    if (d.kapasite[id] + n > k.maxMW)
      return { ok: false, mesaj: k.ad + " için en fazla " + k.maxMW + " MW kurulabilir." };
    const maliyet = yuvarla2(n * k.kurulumMaliyeti);
    if (maliyet > d.kasa) return { ok: false, mesaj: "Kasa yetersiz (gereken: " + f(maliyet) + ")." };
    d.kasa = yuvarla2(d.kasa - maliyet);
    d.turYatirim = yuvarla2(d.turYatirim + maliyet);
    d.kapasite[id] += n;
    return { ok: true, mesaj: n + " MW " + k.ad + " kuruldu (−" + f(maliyet) + ")." };
  }

  // Söküm: iade yok (batık maliyet); kirli santrali kapatmak için kullanılır
  function sok(d, id, mw) {
    const k = kaynakBul(id), n = tamSayi(mw);
    if (d.bitti || !k) return { ok: false, mesaj: "Geçersiz işlem." };
    if (n < 1) return { ok: false, mesaj: "Geçerli bir MW değeri girin." };
    if (n > d.kapasite[id]) return { ok: false, mesaj: "Elinizde yalnızca " + d.kapasite[id] + " MW var." };
    d.kapasite[id] -= n;
    return { ok: true, mesaj: n + " MW " + k.ad + " söküldü (iade yok)." };
  }

  function karbonAl(d, ton) {
    const n = tamSayi(ton), fiyat = karbonFiyati(d);
    if (d.bitti) return { ok: false, mesaj: "Oyun bitti." };
    if (n < 1) return { ok: false, mesaj: "Geçerli bir ton değeri girin." };
    const maks = alinabilirTon(d);
    if (n > maks) return { ok: false, mesaj: "En fazla " + maks + " t alabilirsiniz (açığınız ve kasanızla sınırlı)." };
    const bedel = yuvarla2(n * fiyat);
    d.kasa = yuvarla2(d.kasa - bedel);
    d.turKarbonNakit = yuvarla2(d.turKarbonNakit - bedel);
    d.karbonNet += n;
    return { ok: true, mesaj: n + " t izin alındı (−" + f(bedel) + ")." };
  }

  function karbonSat(d, ton) {
    const n = tamSayi(ton), fiyat = karbonFiyati(d);
    if (d.bitti) return { ok: false, mesaj: "Oyun bitti." };
    if (n < 1) return { ok: false, mesaj: "Geçerli bir ton değeri girin." };
    const maks = satilabilirTon(d);
    if (n > maks) return { ok: false, mesaj: "En fazla " + maks + " t satabilirsiniz (fazla izninizle sınırlı)." };
    const gelir = yuvarla2(n * fiyat);
    d.kasa = yuvarla2(d.kasa + gelir);
    d.turKarbonNakit = yuvarla2(d.turKarbonNakit + gelir);
    d.karbonNet -= n;
    return { ok: true, mesaj: n + " t izin satıldı (+" + f(gelir) + ")." };
  }

  // Kasadan en fazla eldeki kadar öder, kalanı borca yazar; kasa hiçbir zaman negatif olmaz
  function ode(d, tutar) {
    const odenen = Math.min(d.kasa, tutar);
    d.kasa = yuvarla2(d.kasa - odenen);
    d.borc = yuvarla2(d.borc + (tutar - odenen));
  }

  function turuBitir(d) {
    if (d.bitti) return null;
    const t = turVerisi(d), h = turHesabi(d);
    const fiyat = karbonFiyati(d);
    const acik = Math.max(0, yuvarla1(h.emisyon - izinMiktari(d)));
    const ceza = yuvarla2(acik * fiyat * VERI.piyasa.cezaCarpani);

    d.kasa = yuvarla2(d.kasa + h.gelir);          // gelir
    ode(d, h.gider);                              // işletme
    ode(d, ceza);                                 // limit aşım cezası
    if (d.borc > 0) {                             // eski borcu kasadan kapat
      const kapat = Math.min(d.kasa, d.borc);
      d.kasa = yuvarla2(d.kasa - kapat);
      d.borc = yuvarla2(d.borc - kapat);
    }
    d.toplamEmisyon = yuvarla1(d.toplamEmisyon + h.emisyon);
    d.toplamCeza = yuvarla2(d.toplamCeza + ceza);

    const rapor = {
      tur: d.tur, donem: t.donem, gelir: h.gelir, isletme: h.gider,
      karbon: d.turKarbonNakit, ceza, yatirim: d.turYatirim,
      emisyon: h.emisyon, limit: t.limit, izin: izinMiktari(d), acik,
      fiyat, baslangicKasa: d.turBaslangicKasa, kasa: d.kasa, borc: d.borc,
      net: yuvarla2(d.kasa - d.turBaslangicKasa)
    };
    d.raporlar.push(rapor);

    if (d.tur >= VERI.toplamTur) {
      d.bitti = true;
      d.sonuc = sonucHesapla(d);
    } else {
      d.tur += 1;
      d.karbonNet = 0;
      d.turKarbonNakit = 0;
      d.turYatirim = 0;
      d.turBaslangicKasa = d.kasa;
    }
    return rapor;
  }

  // Skor = kasa − borç − iklim cezası (toplam bütçeyi aşan emisyon × katsayı); en az 0
  function sonucHesapla(d) {
    const butce = toplamButce();
    const asim = Math.max(0, yuvarla1(d.toplamEmisyon - butce));
    const iklimCezasi = yuvarla2(asim * VERI.iklimCezasi);
    const skor = Math.max(0, Math.round(d.kasa - d.borc - iklimCezasi));
    return {
      kasa: d.kasa, borc: d.borc, toplamEmisyon: d.toplamEmisyon, toplamButce: butce,
      asim, iklimCezasi, toplamCeza: d.toplamCeza, skor, sicaklik: sicaklik(d.toplamEmisyon)
    };
  }

  // Basit ısınma göstergesi (°C): tüm bütçe kullanılırsa isinmaHedefi kadar
  function sicaklik(emisyon) {
    return yuvarla2((VERI.isinmaHedefi * emisyon) / toplamButce());
  }

  return {
    yeniOyun, turVerisi, acikMi, kaynakBul, birimMW, turHesabi, projeEmisyon, izinMiktari,
    karbonFiyati, izinFarki, satilabilirTon, alinabilirTon, kur, sok, karbonAl, karbonSat,
    turuBitir, sonucHesapla, sicaklik, toplamButce, yuvarla2
  };
})();

if (typeof module !== "undefined" && module.exports) module.exports = OYUN;
