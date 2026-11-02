# Karbon Bütçesi — Enerji Şirketi Oyunu

"Çevre ve Enerji" dersi için hazırlanmış, tarayıcıda çalışan eğitim oyunu. Bir enerji şirketini yönetirsin; amaç, **sınırlı bir karbon bütçesi içinde en çok parayı kazanmak**. Oyun fosil yakıtları, yenilenebilir enerjiyi, karbon piyasasını, Kyoto ve Paris Anlaşması'nı ve küresel ısınmayı deneyimletir.

Saf HTML + CSS + JavaScript. Kütüphane, framework, CDN, npm ve sunucu yok.

## Nasıl açılır?

`index.html` dosyasına çift tıkla; tarayıcıda açılır. (Kurulum gerekmez.)

## Nasıl oynanır?

Oyun **7 tur** sürer. Başlangıç kasası **1.000 birim**.

1. **Kapasite kur.** Kaynak kartlarında MW gir, **Kur**'a bas. Kurulu santral her tur hem gelir hem emisyon üretir. **Sök** ile santral kapatılır (iade yoktur). Her kaynağın kurulabilecek bir üst sınırı vardır.
2. **Karbon piyasasına bak.** Her turun bir **emisyon limiti** (ücretsiz karbon izni) vardır. Emisyonun limitin altındaysa fazla izni **satabilirsin**; üstündeyse açığı **satın alabilirsin**. İşlemler tek bir sistem fiyatı üzerinden yapılır.
3. **Limiti aşma.** Kapatılmayan açık için *güncel fiyatın 2,5 katı* ceza ödersin. Yani izin almak her zaman cezadan ucuzdur.
4. **Turu bitir.** Gelir, işletme maliyeti, karbon alım/satım sonucu ve ceza hesaplanır; rapor ekranda görünür.
5. **7. turdan sonra** skorun belli olur; takma adınla kaydedersin.

### Kaynakların açılışı

| Tur | Açılan kaynaklar |
|----|------------------|
| 1 | Kömür, Doğalgaz |
| 2 | Biyokütle, Hidro |
| 3 | Rüzgâr |
| 4 | Güneş |
| 5 | Nükleer |
| 6–7 | Hepsi açık |

Kapalı kaynaklar gri ve kilitli görünür; kartın üzerinde açılış turu yazar.

### Dönemler

* **1–3. tur — Kyoto dönemi:** limitler geniş, karbon fiyatı düşük.
* **4–7. tur — Paris dönemi:** limitler hızla daralır, karbon fiyatı yükselir. Kömür santralleri "atıl varlığa" dönüşebilir.

### Skor

```
skor = son kasa − borç − iklim cezası           (en az 0)
iklim cezası = max(0, toplam emisyon − toplam karbon bütçesi) × 1,5
```

Karbon izni satın almak, turdaki cezayı önler ama atmosfer ticarete bakmaz: **fiziksel toplam emisyonun** 7 turluk toplam bütçeyi aşması ayrıca cezalandırılır. Kasanın ödeyemediği ceza veya işletme açığı **borç** olarak yazılır ve bir sonraki turun gelirinden kapatılır; kasa hiçbir zaman negatife düşmez.

Üst çubuktaki **ısınma göstergesi** basit bir ölçektir: 7 turluk toplam bütçenin tamamı kullanılırsa +1,5 °C kabul edilir. Gerçek iklim modeli değildir.

## Hesaplama kuralları

Bir tur, 100 saatlik temsili bir üretim dönemidir; elektrik 1 birim/MWh'den satılır. 1 MW kurulu güç için, tur başına:

```
üretim (MWh)  = kapasite faktörü × 100
gelir         = üretim × 1
işletme gideri = saatlik işletme × 100
emisyon (t)   = üretim × emisyon (gCO2/kWh) / 1000
```

**Karbon fiyatı** (arz/talep benzeri):

```
fiyat = taban fiyat(tur) × max(0,25 ; 1 + eğim × (tahmini emisyon / limit − 1))      (eğim = 1)
```

Emisyon limite yaklaştıkça veya aştıkça fiyat yükselir; emisyon düşerse fiyat düşer. Fiyat emisyonla birlikte tek yönlü arttığı için al-sat yaparak kâr etmek mümkün değildir.

## Veriler

Emisyon değerleri **IPCC AR5 (2014), WG III, Annex III, Tablo A.III.2** yaşam döngüsü medyanlarıdır (gCO2/kWh): kömür 820, doğalgaz 490, biyokütle 230, hidro 24, nükleer 12, rüzgâr 11, güneş 48. Maliyetler, kapasite faktörleri, limitler ve karbon fiyatları **oyun dengesi için sadeleştirilmiş, gerçek olmayan** değerlerdir. Hepsi `data.js` içinde, kolayca değiştirilebilir.

## Skor tablosu ve gizlilik

* Oyun sonunda yalnızca bir **takma ad** girilir (en fazla 16 karakter).
* Takma ad ve skor, tarayıcının **localStorage**'ına kaydedilir. Sunucu yoktur; başka kişisel veri toplanmaz.
* Ana ekranda en iyi 10 skor listelenir. Skorlar her tarayıcıda/cihazda ayrıdır. "Skorları temizle" düğmesi kayıtları siler.

## Dosyalar

| Dosya | Görevi |
|-------|--------|
| `index.html` | Sayfa iskeleti: ana ekran, oyun ekranı, oyun sonu, rapor penceresi |
| `style.css` | Görünüm; büyük yazılar, renk paleti, mobil uyum |
| `data.js` | Kaynaklar, turlar, limitler, karbon piyasası ve skor sabitleri (IPCC kaynağı başta) |
| `game.js` | Oyun mantığı: kurulum, karbon piyasası, tur sonu hesabı, skor (arayüzden bağımsız) |
| `leaderboard.js` | localStorage skor tablosu |
| `ui.js` | Oyun ekranı: üst çubuk, kaynak kartları, karbon piyasası paneli |
| `screens.js` | Ekran geçişleri, tur sonu raporu, oyun sonu, skor kaydı |

Dosyalar klasik `<script>` etiketleriyle yüklenir (ES modülü kullanılmaz); bu sayede çift tıklayıp `file://` ile açmak da çalışır.

## GitHub Pages ile yayınlama

1. GitHub'da yeni bir depo oluştur (örn. `karbon-butcesi`), **Public** olsun.
2. Bu klasördeki tüm dosyaları deponun **kök dizinine** yükle (`index.html` kökte olmalı):
   ```bash
   git init
   git add .
   git commit -m "Karbon Bütçesi oyunu"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/karbon-butcesi.git
   git push -u origin main
   ```
   (Git kullanmak istemezsen depo sayfasında **Add file → Upload files** ile de yükleyebilirsin.)
3. Depoda **Settings → Pages** bölümüne git. **Build and deployment → Source** olarak *Deploy from a branch*, **Branch** olarak `main` ve `/ (root)` seç, **Save**.
4. Bir iki dakika sonra oyun şu adreste yayında olur:
   `https://KULLANICI_ADIN.github.io/karbon-butcesi/`
5. Güncelleme yapmak için dosyaları değiştirip `git push` yapman yeterlidir; site otomatik yenilenir.

Not: Skorlar her ziyaretçinin kendi tarayıcısında kalır; yayınlanan sitede ortak bir skor tablosu yoktur. Sunumda tek bilgisayardan oynatırsan tablo o bilgisayarda birikir.
