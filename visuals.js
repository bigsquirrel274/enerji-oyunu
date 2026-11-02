/*
 * visuals.js — Kaynak kartlarındaki santral görselleri (satır içi SVG, kütüphane yok).
 * Yalnızca görsel üretir: oyun durumunu okumaz ve değiştirmez.
 *
 * Görsel durumları (ui.js bunları oyun verisinden türetip buraya verir):
 *   "kilitli" : kaynağın açılış turu gelmedi  → gri ve durağan
 *   "kapali"  : kaynak açıldı ama kurulu güç yok → sönük renkli, animasyon yok
 *   "acik"    : en az 1 MW kurulu            → animasyonlu
 *
 * Sahneler 240×90 birimlik alana çizilir. Geniş kartlarda gökyüzü ve zemin yanlara
 * taşar, çizim ölçeklenmez. Hareket style.css'teki keyframes ile sağlanır; burada
 * yalnızca süre, gecikme ve yoğunluk gibi değerler CSS değişkeni olarak yazılır.
 */
"use strict";

const GORSEL = (function () {
  const GENISLIK = 240, YUKSEKLIK = 90, ZEMIN_Y = 76;

  // Kapasiteyi 0-5 kademesine çevirir. Karekök, düşük güçlerde de farkı görünür kılar
  // (40 MW sınırlı kömürde 1 MW → 1, 5 MW → 2, 12 MW → 3, 20 MW → 4, 30 MW → 5).
  function seviye(mw, maxMW) {
    if (!(mw > 0) || !(maxMW > 0)) return 0;
    return Math.min(5, Math.ceil(Math.sqrt(Math.min(1, mw / maxMW)) * 5));
  }

  // Kademe tablosundan değer seçer (tablo[0] kullanılmaz: açık kaynak en az 1. kademedir)
  const kademe = (tablo, sv) => tablo[Math.max(1, Math.min(5, sv))];

  const zemin = (renk) => `<rect x="-300" y="${ZEMIN_Y}" width="840" height="40" fill="${renk}"/>`;

  // Çalışan santralin penceresi yanar; hareket durdurulsa da durum okunabilir kalır
  const pencereRengi = (durum) => (durum === "acik" ? "#ffcf40" : "#2b2623");

  // Yükselen duman/buhar parçacıkları. Eksi gecikme, akışın baştan dolu başlamasını sağlar.
  function puflar(sayi, o) {
    let cikti = "";
    for (let i = 0; i < sayi; i++) {
      const sapma = (i % 3) - 1; // parçacıklar aynı çizgide gitmesin (-1, 0, 1)
      const stil =
        "--sure:" + o.sure + "s;--gecikme:" + (-(i / sayi) * o.sure).toFixed(2) + "s;" +
        "--dx:" + Math.round(o.dx * (1 + sapma * 0.12)) + "px;" +
        "--dy:" + Math.round(o.dy * (1 - sapma * 0.15)) + "px;" +
        "--olcek:" + o.olcek + ";--yogun:" + o.yogun;
      cikti += `<circle class="g-puf ${o.sinif}" cx="${o.x + sapma * (o.yay || 0)}" cy="${o.y}" r="${o.r}" style="${stil}"/>`;
    }
    return cikti;
  }

  // Akan su çizgileri: her şeritte eşit aralıkla ilerleyen kısa, kalın çizgiler
  function suCizgileri(sayi, o) {
    let cikti = "";
    for (let i = 0; i < sayi; i++) {
      const [ox, oy] = o.seritler[i % o.seritler.length];
      const x = o.x + ox, y = o.y + oy;
      const stil = "--sure:" + o.sure + "s;--gecikme:" + (-(i / sayi) * o.sure).toFixed(2) + "s;--dx:" + o.dx + "px;--dy:" + o.dy + "px";
      cikti += `<line class="g-su" x1="${x}" y1="${y}" x2="${x + o.ux}" y2="${y + o.uy}" style="${stil}"/>`;
    }
    return cikti;
  }

  function komur(durum, sv) {
    const duman = durum === "acik" ? puflar(kademe([0, 4, 6, 8, 10, 12], sv), {
      sinif: "g-puf--koyu", x: 77, y: 30, r: kademe([0, 5, 5.5, 6, 6.5, 7], sv), sure: 4.6, dx: 110, dy: -26,
      olcek: kademe([0, 2, 2.3, 2.6, 2.9, 3.2], sv), yogun: kademe([0, 0.6, 0.7, 0.8, 0.88, 0.95], sv)
    }) : "";
    const p = pencereRengi(durum);
    return zemin("#5a4a3c") +
      '<path d="M12 76 Q34 50 60 76Z" fill="#1c1917"/>' +                       // kömür yığını
      '<path d="M100 76 V52 l16 -10 v10 l16 -10 v10 l16 -10 v10 l16 -10 v34Z" fill="#4a4039"/>' + // testere çatılı bina
      `<rect x="108" y="60" width="12" height="9" fill="${p}"/><rect x="128" y="60" width="12" height="9" fill="${p}"/>` +
      `<rect x="148" y="60" width="12" height="9" fill="${p}"/>` +
      '<path d="M66 76 L70 30 H84 L88 76Z" fill="#2b2623"/>' +                  // baca
      '<rect x="69" y="36" width="16" height="5" fill="#7b5a40"/>' + duman;
  }

  function dogalgaz(durum, sv) {
    const duman = durum === "acik" ? puflar(kademe([0, 3, 4, 5, 6, 7], sv), {
      sinif: "g-puf--acik", x: 90, y: 24, r: kademe([0, 3.2, 3.4, 3.6, 3.8, 4], sv), sure: 3.8, dx: 84, dy: -16,
      olcek: kademe([0, 1.7, 1.8, 2, 2.1, 2.3], sv), yogun: kademe([0, 0.6, 0.66, 0.72, 0.78, 0.85], sv)
    }) : "";
    const p = pencereRengi(durum);
    return zemin("#6b5a4a") +
      '<rect x="74" y="54" width="62" height="22" fill="#7a5237"/>' +           // türbin binası
      `<rect x="84" y="62" width="14" height="8" fill="${p}"/><rect x="108" y="62" width="14" height="8" fill="${p}"/>` +
      '<rect x="85" y="24" width="10" height="32" fill="#3a2d24"/>' +           // ince baca
      '<rect x="136" y="64" width="26" height="6" fill="#3a2d24"/>' +           // gaz borusu
      '<circle cx="178" cy="55" r="19" fill="#9b8671"/>' +                      // küresel depo
      '<path d="M166 72 L162 76 M190 72 L194 76" stroke="#3a2d24" stroke-width="4"/>' +
      '<path d="M162 49 A19 19 0 0 1 194 49" fill="none" stroke="#bda98f" stroke-width="4"/>' + duman;
  }

  function biyokutle(durum, sv) {
    const duman = durum === "acik" ? puflar(kademe([0, 3, 3, 4, 4, 5], sv), {
      sinif: "g-puf--biyo", x: 134, y: 30, r: kademe([0, 3, 3.2, 3.5, 3.8, 4], sv), sure: 4.2, dx: 80, dy: -18,
      olcek: 1.9, yogun: kademe([0, 0.6, 0.65, 0.7, 0.75, 0.8], sv)
    }) : "";
    const p = pencereRengi(durum);
    return zemin("#5f8245") +
      '<path d="M14 76 Q58 14 108 76Z" fill="#6d4c2f"/>' +                      // kahverengi yığın
      '<path d="M30 76 Q60 34 94 76Z" fill="#3f8f4e"/>' +                       // yeşil katman
      '<circle cx="48" cy="66" r="6" fill="#2e7d32"/><circle cx="72" cy="62" r="7" fill="#2e7d32"/>' +
      '<circle cx="60" cy="48" r="5" fill="#8a6a42"/><circle cx="86" cy="70" r="5" fill="#8a6a42"/>' +
      '<rect x="129" y="30" width="10" height="46" fill="#4f5a3a"/>' +          // baca
      '<path d="M146 76 V52 Q172 30 198 52 V76Z" fill="#7f8c6a"/>' +            // kazan binası
      `<rect x="164" y="58" width="16" height="10" fill="${p}"/>` + duman;
  }

  function hidro(durum, sv) {
    const sure = kademe([0, 2.2, 1.9, 1.6, 1.3, 1], sv);
    const su = durum === "acik"
      ? suCizgileri(kademe([0, 3, 4, 5, 6, 8], sv), {   // baraj yüzünden inen su
          x: 104, y: 24, ux: 7, uy: 12, dx: 28, dy: 44, sure, seritler: [[12, 0], [2, 0], [-8, 0]] }) +
        suCizgileri(kademe([0, 2, 3, 4, 5, 6], sv), {   // nehirde akan su
          x: 152, y: 71, ux: 18, uy: 0, dx: 92, dy: 0, sure, seritler: [[0, 0], [10, 7]] })
      : "";
    return zemin("#4d7a45") +
      '<rect x="-300" y="38" width="402" height="40" fill="#2a7fcb"/>' +        // baraj gölü
      '<rect x="-300" y="44" width="402" height="4" fill="#5fa8e6"/>' +
      '<rect x="146" y="66" width="400" height="16" fill="#3a93dd"/>' +         // nehir
      '<path d="M98 22 H116 L150 78 H98Z" fill="#b8b2a6"/>' +                   // baraj duvarı
      '<rect x="94" y="18" width="26" height="6" fill="#7d7769"/>' +
      '<rect x="186" y="46" width="30" height="20" fill="#5d6f7d"/>' +          // santral binası
      `<rect x="194" y="52" width="14" height="8" fill="${pencereRengi(durum)}"/>` + su;
  }

  function nukleer(durum, sv) {
    let buhar = "";
    if (durum === "acik") {
      const o = {
        sinif: "g-puf--buhar", x: 88, y: 24, yay: 13, r: kademe([0, 6, 7, 7.5, 8, 9], sv), sure: 4.4, dx: 70, dy: -20,
        olcek: kademe([0, 1.9, 2, 2.2, 2.4, 2.6], sv), yogun: kademe([0, 0.8, 0.85, 0.9, 0.93, 0.96], sv)
      };
      buhar = puflar(kademe([0, 3, 4, 5, 6, 8], sv), o);
      if (sv >= 3) buhar += puflar(kademe([0, 0, 0, 2, 3, 3], sv), { ...o, x: 154, y: 36, yay: 8, r: o.r * 0.7, dx: 58, dy: -24 });
    }
    return zemin("#5e6580") +
      '<path d="M130 76 C142 60 140 48 134 38 H174 C168 48 166 60 178 76Z" fill="#cfcdd6"/>' +  // arka kule
      '<path d="M52 76 C70 54 68 40 60 24 H116 C108 40 106 54 124 76Z" fill="#eceae4"/>' +      // soğutma kulesi
      '<rect x="58" y="22" width="60" height="5" fill="#a9a7b6"/>' +
      '<path d="M66 60 H110 L113 66 H63Z" fill="#44499c"/>' +
      '<path d="M188 76 V56 A18 18 0 0 1 224 56 V76Z" fill="#8f94c8"/>' +       // reaktör kubbesi
      `<rect x="199" y="60" width="14" height="9" fill="${pencereRengi(durum)}"/>` + buhar;
  }

  // Üç kanatlı pervane: kule ve kanatlar (0,0) göbeği etrafında çizilir ki dönüş merkezi sabit kalsın
  function pervane(x, y, olcek, sure, gecikme) {
    const kanat = '<path d="M-4 0 Q-2.5 -15 0 -28 Q3 -15 4 0Z" fill="#f6f8f7"';
    return `<g transform="translate(${x} ${y}) scale(${olcek})">` +
      `<path d="M-3 0 L-4.5 ${(ZEMIN_Y - y) / olcek} H4.5 L3 0Z" fill="#e4eaea"/>` +
      `<g class="g-rotor" style="--sure:${sure}s;--gecikme:${gecikme}s">` +
      kanat + "/>" + kanat + ' transform="rotate(120)"/>' + kanat + ' transform="rotate(240)"/>' +
      "</g>" +
      '<circle r="5" fill="#0b5a66"/></g>';
  }

  function ruzgar(durum, sv) {
    const sure = kademe([0, 4.8, 3.4, 2.4, 1.6, 1], sv); // kapasite arttıkça daha hızlı döner
    return zemin("#2f8f7e") +
      '<path d="M-300 76 Q-60 62 120 76 Q300 62 540 76Z" fill="#3fa08c"/>' +
      pervane(50, 48, 0.62, (sure * 1.2).toFixed(2), -0.7) +
      pervane(190, 44, 0.7, (sure * 1.1).toFixed(2), -1.3) +
      pervane(120, 31, 1, sure, 0);
  }

  // Tek güneş paneli: eğik çerçeve ve hücre ızgarası
  function panel(x) {
    let izgara = "";
    for (const ix of [15, 30, 45]) izgara += `<line x1="${ix}" y1="0" x2="${ix}" y2="28" stroke="#6fb4e0" stroke-width="2.5"/>`;
    return '<rect x="' + (x + 8) + '" y="66" width="5" height="10" fill="#3a4a52"/><rect x="' + (x + 44) + '" y="66" width="5" height="10" fill="#3a4a52"/>' +
      `<g transform="translate(${x + 8} 40) skewX(-20)">` +
      '<rect width="60" height="28" fill="#134a78" stroke="#0c2f4d" stroke-width="3"/>' + izgara +
      '<line x1="0" y1="14" x2="60" y2="14" stroke="#6fb4e0" stroke-width="2.5"/></g>';
  }

  function gunes(durum, sv) {
    const sure = kademe([0, 3.4, 3, 2.6, 2.2, 1.8], sv);
    const yogun = kademe([0, 0.55, 0.65, 0.75, 0.85, 0.95], sv);
    const stil = (gecikme) => `--sure:${sure}s;--gecikme:${gecikme}s;--yogun:${yogun}`;
    const parilti = durum === "acik"
      ? [34, 104, 174].slice(0, Math.min(3, sv)).map((x, i) =>
          `<rect class="g-isik" x="${x}" y="44" width="16" height="8" fill="#e8f6ff" style="${stil((-(i * sure) / 3).toFixed(2))}"/>`).join("")
      : "";
    const hale = durum === "acik"
      ? `<circle class="g-isik" cx="208" cy="20" r="${kademe([0, 17, 19, 21, 23, 25], sv)}" fill="#ffe28a" style="${stil(0)}"/>`
      : "";
    return zemin("#6f9c4e") + hale +
      '<circle cx="208" cy="20" r="12" fill="#ffcf40"/>' +
      panel(10) + panel(80) + panel(150) + parilti;
  }

  const SAHNELER = { komur, dogalgaz, biyokutle, hidro, nukleer, ruzgar, gunes };

  // Görselin kimliği: yalnızca bu değişince yeniden çizilir, aksi hâlde animasyon başa sarar
  function imza(kaynak, durum, mw) {
    return kaynak.id + "|" + durum + "|" + (durum === "acik" ? seviye(mw, kaynak.maxMW) : 0);
  }

  // kaynak: VERI.kaynaklar öğesi; durum: "kilitli" | "kapali" | "acik"; mw: kurulu güç (isteğe bağlı)
  function ciz(kaynak, durum, mw) {
    const sahne = SAHNELER[kaynak.id];
    if (!sahne) return "";
    const sv = durum === "acik" ? Math.max(1, seviye(mw, kaynak.maxMW)) : 0;
    return `<svg class="g-svg g--${durum}" viewBox="0 0 ${GENISLIK} ${YUKSEKLIK}" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">` +
      '<rect class="g-gok" x="-300" y="-50" width="840" height="190"/>' +
      '<rect class="g-karartma" x="-300" y="-50" width="840" height="190"/>' +
      sahne(durum, sv) + "</svg>";
  }

  // Ekran dışındaki görselleri duraklatır. SVG içi animasyonlar ana iş parçacığında çalışır;
  // telefonda tek sütunda 1-2 kart göründüğü için yük belirgin biçimde azalır.
  const gozcu = typeof IntersectionObserver === "function"
    ? new IntersectionObserver((olaylar) => olaylar.forEach((o) =>
        o.target.classList.toggle("ekran-disi", !o.isIntersecting)))
    : null;
  const izle = (el) => { if (gozcu) gozcu.observe(el); };

  return { ciz, imza, seviye, izle };
})();
