/*
 * data.js — Oyunun sabit verileri (kaynaklar, turlar, karbon piyasası ayarları)
 *
 * EMİSYON DEĞERLERİ KAYNAĞI
 * IPCC AR5 (2014), Working Group III, Annex III "Technology-specific Cost and
 * Performance Parameters", Table A.III.2 — elektrik üretimi için yaşam döngüsü
 * (lifecycle) emisyonları, medyan değerler (gCO2eş / kWh):
 *   Kömür      820
 *   Doğalgaz   490
 *   Biyokütle  230
 *   Hidro       24
 *   Nükleer     12
 *   Rüzgâr      11  (kara üstü)
 *   Güneş       48  (şebeke ölçekli fotovoltaik)
 *
 * Maliyet, kapasite faktörü ve diğer sayılar GERÇEK DEĞİL, oyun dengesi için
 * sadeleştirilmiş eğitim değerleridir.
 */
"use strict";

const VERI = {
  // Başlangıç ve oyun uzunluğu
  baslangicKasa: 1000,
  toplamTur: 7,

  // Bir tur = 100 saatlik "temsili" üretim dönemi; elektrik 1 birim/MWh
  turSaati: 100,
  elektrikFiyati: 1,

  /*
   * Kaynaklar. Alanlar:
   *  ad            : görünen ad
   *  kurulumMaliyeti : 1 MW kurmanın tek seferlik bedeli (birim)
   *  saatlikIsletme  : kurulu 1 MW'ın saat başına işletme maliyeti (birim)
   *  kapasiteFaktoru : kurulu gücün ortalama kaç kesri fiilen üretir (0-1)
   *  emisyon         : gCO2/kWh (IPCC AR5 yaşam döngüsü medyanı)
   *  acilisTuru      : kaynağın açıldığı tur
   *  maxMW           : kurulabilecek en fazla güç (saha/izin sınırı)
   *  grup            : renk teması (fosil | yenilenebilir | nukleer)
   *  bilgi           : kartta gösterilen kısa ders notu
   */
  kaynaklar: [
    { id: "komur", ad: "Kömür", kurulumMaliyeti: 70, saatlikIsletme: 0.30,
      kapasiteFaktoru: 0.85, emisyon: 820, acilisTuru: 1, maxMW: 40, grup: "fosil",
      bilgi: "Kömür: en yüksek emisyonlu fosil yakıt; ucuz ama çok kirli." },
    { id: "dogalgaz", ad: "Doğalgaz", kurulumMaliyeti: 50, saatlikIsletme: 0.30,
      kapasiteFaktoru: 0.60, emisyon: 490, acilisTuru: 1, maxMW: 40, grup: "fosil",
      bilgi: "Doğalgaz: kömürün yaklaşık yarısı kadar emisyon; geçiş yakıtı sayılır." },
    { id: "biyokutle", ad: "Biyokütle", kurulumMaliyeti: 110, saatlikIsletme: 0.40,
      kapasiteFaktoru: 0.75, emisyon: 230, acilisTuru: 2, maxMW: 20, grup: "yenilenebilir",
      bilgi: "Biyokütle: organik atıktan enerji; yenilenebilir ama sıfır emisyon değil." },
    { id: "hidro", ad: "Hidro", kurulumMaliyeti: 120, saatlikIsletme: 0.06,
      kapasiteFaktoru: 0.45, emisyon: 24, acilisTuru: 2, maxMW: 20, grup: "yenilenebilir",
      bilgi: "Hidro: barajlı santral; düşük emisyon, ama uygun nehir sahası sınırlı." },
    { id: "ruzgar", ad: "Rüzgâr", kurulumMaliyeti: 85, saatlikIsletme: 0.05,
      kapasiteFaktoru: 0.35, emisyon: 11, acilisTuru: 3, maxMW: 40, grup: "yenilenebilir",
      bilgi: "Rüzgâr: yakıtı bedava, emisyonu çok düşük; rüzgâr esmezse üretim düşer." },
    { id: "gunes", ad: "Güneş", kurulumMaliyeti: 70, saatlikIsletme: 0.03,
      kapasiteFaktoru: 0.25, emisyon: 48, acilisTuru: 4, maxMW: 60, grup: "yenilenebilir",
      bilgi: "Güneş: panel üretimi emisyon ekler (48 g), sonrasında yakıtsız çalışır." },
    { id: "nukleer", ad: "Nükleer", kurulumMaliyeti: 170, saatlikIsletme: 0.25,
      kapasiteFaktoru: 0.90, emisyon: 12, acilisTuru: 5, maxMW: 12, grup: "nukleer",
      bilgi: "Nükleer: çok düşük emisyon ve sürekli üretim; kurulumu pahalı, atık sorunu var." }
  ],

  /*
   * Tur bazlı karbon bütçesi (limit, tCO2) ve piyasa taban fiyatı.
   * 1-3. tur: Kyoto dönemi (gevşek hedefler). 4-7. tur: Paris dönemi (sıkılaşan hedefler).
   */
  turlar: [
    { donem: "Kyoto dönemi", limit: 1200, tabanFiyat: 0.30,
      not: "Kyoto Protokolü (1997): gelişmiş ülkelere ilk bağlayıcı emisyon hedefleri ve karbon ticareti." },
    { donem: "Kyoto dönemi", limit: 1050, tabanFiyat: 0.40,
      not: "Kyoto esnek mekanizmaları: emisyon ticareti, ortak yürütme, temiz kalkınma mekanizması." },
    { donem: "Kyoto dönemi", limit: 900, tabanFiyat: 0.50,
      not: "Kyoto sonrası: hedefler yetersiz kaldı, küresel emisyonlar artmaya devam etti." },
    { donem: "Paris dönemi", limit: 700, tabanFiyat: 0.80,
      not: "Paris Anlaşması (2015): sıcaklık artışını 2 °C altında, mümkünse 1,5 °C'de tut." },
    { donem: "Paris dönemi", limit: 520, tabanFiyat: 1.20,
      not: "her ülke kendi ulusal katkı beyanını (NDC) sunar ve düzenli olarak sıkılaştırır." },
    { donem: "Paris dönemi", limit: 380, tabanFiyat: 1.70,
      not: "Net sıfır yolunda karbon fiyatları yükselir; kirli santraller 'atıl varlık' olma riskine girer." },
    { donem: "Paris dönemi", limit: 280, tabanFiyat: 2.30,
      not: "Son tur: 1,5 °C hedefi için kalan karbon bütçesi çok dar." }
  ],

  // Karbon piyasası: fiyat = tabanFiyat × (1 + eğim × (emisyon/limit − 1)), alt sınırlı
  piyasa: {
    egim: 1.0,           // talep (emisyon/limit) fiyatı ne kadar sert oynatır
    altKatsayi: 0.25,    // fiyat en az tabanFiyat × 0,25 olur
    cezaCarpani: 2.5     // limit aşım cezası = güncel fiyat × 2,5 (alım her zaman cezadan ucuz)
  },

  // Oyun sonu: toplam bütçeyi aşan her ton için kasadan düşülen iklim cezası (birim/tCO2)
  iklimCezasi: 1.5,

  // Basit ısınma göstergesi: toplam bütçenin tamamı kullanılırsa +1,5 °C
  isinmaHedefi: 1.5,
  isinmaSiniri: 2.0
};
