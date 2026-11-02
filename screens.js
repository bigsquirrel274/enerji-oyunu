/*
 * screens.js — Ekranlar arası geçiş: ana ekran, tur sonu raporu, oyun sonu, skor kaydı.
 * Sayfa yüklendiğinde burada başlatılır (en son yüklenen betik).
 */
"use strict";

(function () {
  const $ = (id) => document.getElementById(id);
  const { sayi, isaretli } = UI;
  let durum = null;
  let kaydedildi = false;

  function goster(id) {
    UI.mesajiTemizle();
    ["ekran-ana", "ekran-oyun", "ekran-son"].forEach((e) => ($(e).hidden = e !== id));
    window.scrollTo(0, 0);
  }

  // Skor listesini <ol> içine çiz (takma ad textContent ile yazılır: HTML enjeksiyonu olmaz)
  function skorlariCiz(ol, vurgu) {
    const liste = SKORLAR.enIyi();
    ol.textContent = "";
    if (!liste.length) {
      const li = document.createElement("li");
      li.className = "bos";
      li.textContent = "Henüz skor yok. İlk kayıt senin olsun!";
      ol.appendChild(li);
      return;
    }
    let vurgulandi = false;
    liste.forEach((k) => {
      const li = document.createElement("li");
      const ad = document.createElement("span"), pn = document.createElement("b");
      ad.textContent = k.ad;
      pn.textContent = sayi(k.skor);
      li.append(ad, pn);
      // Her okumada nesneler yeniden oluşur; bu yüzden ad+skor ile eşleştirip yalnızca ilkini vurgula
      if (vurgu && !vurgulandi && k.ad === vurgu.ad && k.skor === vurgu.skor) {
        li.className = "vurgu";
        vurgulandi = true;
      }
      ol.appendChild(li);
    });
  }

  function satir(tablo, etiket, deger, sinif) {
    const tr = document.createElement("tr");
    if (sinif) tr.className = sinif;
    const th = document.createElement("th"), td = document.createElement("td");
    th.textContent = etiket;
    td.textContent = deger;
    tr.append(th, td);
    tablo.appendChild(tr);
  }

  function anaEkran() {
    skorlariCiz($("skor-ana"));
    goster("ekran-ana");
  }

  function baslat() {
    durum = OYUN.yeniOyun();
    kaydedildi = false;
    UI.yeniOyun(durum);
    goster("ekran-oyun");
  }

  function raporGoster(r) {
    const t = $("rapor-tablo");
    t.textContent = "";
    satir(t, "Tur başı kasa", sayi(r.baslangicKasa));
    satir(t, "Kurulum yatırımı", isaretli(-r.yatirim));
    satir(t, "Elektrik geliri", isaretli(r.gelir));
    satir(t, "İşletme maliyeti", isaretli(-r.isletme));
    satir(t, "Karbon alım/satım sonucu", isaretli(r.karbon));
    satir(t, "Limit aşım cezası", isaretli(-r.ceza), r.ceza > 0 ? "kotu" : "");
    const toplam = r.baslangicKasa - r.yatirim + r.gelir - r.isletme + r.karbon - r.ceza;
    const mahsup = r.kasa - toplam;
    if (Math.abs(mahsup) > 0.01) satir(t, "Borç mahsubu", isaretli(mahsup), "kotu");
    satir(t, "Emisyon / limit", sayi(r.emisyon, 1) + " / " + sayi(r.limit) + " t");
    satir(t, "Tur sonu kasa", sayi(r.kasa), "toplam");

    let not = r.acik > 0
      ? "Limiti " + sayi(r.acik, 1) + " t aştın. Açığı piyasadan almak, ceza ödemekten 2,5 kat ucuzdur."
      : "Limit içinde kaldın.";
    if (r.borc > 0) not += " Kasa yetmediği için " + sayi(r.borc) + " birim borç yazıldı; skordan düşülecek.";
    $("rapor-not").textContent = not;
    $("btn-rapor-tamam").textContent = durum.bitti ? "Sonucu gör" : "Sonraki tur (" + durum.tur + ")";
    UI.mesajiTemizle();
    $("rapor").hidden = false;
    $("btn-rapor-tamam").focus();
  }

  function turuBitir() {
    const r = OYUN.turuBitir(durum);
    if (r) raporGoster(r);
  }

  function raporKapat() {
    $("rapor").hidden = true;
    if (durum.bitti) return sonEkran();
    UI.guncelle();
    window.scrollTo(0, 0);
  }

  function yorumMetni(s) {
    if (s.sicaklik <= VERI.isinmaHedefi)
      return "Emisyonların Paris Anlaşması'nın 1,5 °C hedefiyle uyumlu bütçe içinde kaldı.";
    if (s.sicaklik <= VERI.isinmaSiniri)
      return "1,5 °C hedefini aştın ama 2 °C sınırının altında kaldın. Daha erken yenilenebilire geçmek farkı kapatırdı.";
    return "Emisyonların 2 °C sınırını aştı. Karbon izni satın almak kâğıt üzerinde seni korur, atmosfer ise ticarete bakmaz.";
  }

  function sonEkran() {
    const s = durum.sonuc;
    $("son-skor").textContent = sayi(s.skor);
    const t = $("son-tablo");
    t.textContent = "";
    satir(t, "Son kasa", sayi(s.kasa));
    if (s.borc > 0) satir(t, "Borç", isaretli(-s.borc), "kotu");
    satir(t, "Toplam emisyon", sayi(s.toplamEmisyon, 1) + " t");
    satir(t, "Toplam karbon bütçesi", sayi(s.toplamButce) + " t");
    satir(t, "Bütçe aşımı → iklim cezası", sayi(s.asim, 1) + " t → " + isaretli(-s.iklimCezasi), s.asim > 0 ? "kotu" : "");
    satir(t, "Turlarda ödenen ceza (bilgi)", sayi(s.toplamCeza));
    satir(t, "Isınma göstergesi", "+" + sayi(s.sicaklik, 2) + " °C");
    satir(t, "Skor = kasa − borç − iklim cezası", sayi(s.skor), "toplam");
    $("son-yorum").textContent = yorumMetni(s);

    const tt = $("son-turlar");
    tt.textContent = "";
    durum.raporlar.forEach((r) =>
      satir(tt, r.tur + ". tur (" + r.donem.split(" ")[0] + ")", sayi(r.emisyon, 0) + " / " + sayi(r.limit) + " t · kasa " + sayi(r.kasa)));

    $("takma-ad").value = "";
    $("takma-ad").disabled = false;
    $("form-skor").querySelector("button").disabled = false;
    $("kayit-bilgi").textContent = "Yalnızca takma adın ve skorun bu tarayıcıda saklanır.";
    skorlariCiz($("skor-son"));
    goster("ekran-son");
    $("takma-ad").focus();
  }

  function skorKaydet(olay) {
    olay.preventDefault();
    if (kaydedildi || !durum || !durum.bitti) return;
    kaydedildi = true;
    const { kayit, kalici } = SKORLAR.ekle($("takma-ad").value, durum.sonuc.skor);
    $("takma-ad").disabled = true;
    $("form-skor").querySelector("button").disabled = true;
    $("kayit-bilgi").textContent = kalici
      ? "Kaydedildi: " + kayit.ad + " — " + sayi(kayit.skor)
      : "Tarayıcı kalıcı kaydı engelledi; skor yalnızca bu sayfa açıkken görünür.";
    skorlariCiz($("skor-son"), kayit);
  }

  $("btn-basla").addEventListener("click", baslat);
  $("btn-tur-bitir").addEventListener("click", turuBitir);
  $("btn-rapor-tamam").addEventListener("click", raporKapat);
  $("form-skor").addEventListener("submit", skorKaydet);
  $("btn-tekrar").addEventListener("click", anaEkran);
  $("btn-skor-temizle").addEventListener("click", () => {
    if (window.confirm("Tüm kayıtlı skorlar silinsin mi?")) { SKORLAR.temizle(); anaEkran(); }
  });

  anaEkran();
})();
