/*
 * leaderboard.js — Skor tablosu (yalnızca tarayıcının localStorage'ı; sunucu yok).
 * Saklanan tek veri: takma ad + skor. Başka kişisel bilgi toplanmaz.
 */
"use strict";

const SKORLAR = (function () {
  const ANAHTAR = "enerjiOyunu.skorlar.v1";
  const EN_FAZLA_SAKLA = 100;
  const GOSTER = 10;
  let bellek = []; // localStorage kullanılamazsa sayfa açık kaldığı sürece yedek

  function oku() {
    try {
      const ham = localStorage.getItem(ANAHTAR);
      if (!ham) return bellek.slice();
      const liste = JSON.parse(ham);
      if (!Array.isArray(liste)) return [];
      // Bozuk/elle değiştirilmiş kayıtları ele
      return liste.filter((k) => k && typeof k.ad === "string" && Number.isFinite(k.skor));
    } catch (e) {
      return bellek.slice();
    }
  }

  function yaz(liste) {
    bellek = liste.slice();
    try {
      localStorage.setItem(ANAHTAR, JSON.stringify(liste));
      return true;
    } catch (e) {
      return false; // gizli mod / kota dolu: bellekte tutuldu
    }
  }

  // Takma adı temizle: kontrol karakterleri çıkar, boşlukları sadeleştir, 16 karaktere kes
  function adTemizle(ad) {
    const t = String(ad || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim();
    return Array.from(t).slice(0, 16).join("") || "Adsız";
  }

  function sirala(liste) {
    // Yüksek skor üstte; eşitlikte önce kaydedilen üstte (kararlı sıralama)
    return liste
      .map((k, i) => ({ k, i }))
      .sort((a, b) => b.k.skor - a.k.skor || a.i - b.i)
      .map((x) => x.k);
  }

  function ekle(ad, skor) {
    const kayit = { ad: adTemizle(ad), skor: Math.max(0, Math.round(Number(skor) || 0)) };
    const liste = sirala(oku().concat(kayit)).slice(0, EN_FAZLA_SAKLA);
    const kalici = yaz(liste);
    return { kayit, kalici };
  }

  const enIyi = () => sirala(oku()).slice(0, GOSTER);
  const temizle = () => yaz([]);

  return { ekle, enIyi, temizle, adTemizle };
})();
