const fs = require('fs');
const path = require('path');
const puppeteer = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', 'puppeteer-core'));

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots');
const DIFF_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots', 'diff');

if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
if (!fs.existsSync(DIFF_DIR)) fs.mkdirSync(DIFF_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('--- Memulai Pengambilan Tangkapan Layar & Uji Cek Desain ---');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1366,768'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('  [Browser Console Error]:', msg.text());
    }
  });

  const testResults = {
    cek_desain: {},
    screenshots: [],
  };

  // 1. a1-pasien_kosong.png (2732 x 1536)
  console.log('[1/19] Mengambil a1-pasien_kosong...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'a1-pasien_kosong.png') });
  testResults.screenshots.push('a1-pasien_kosong.png');

  // Uji Cek Desain 1: Header Sticky & Tinggi 64px
  const headerCheck = await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return { found: false };
    const style = window.getComputedStyle(header);
    const rect = header.getBoundingClientRect();
    return {
      found: true,
      position: style.position,
      top: style.top,
      height: rect.height,
      computedHeight: style.height,
      zIndex: style.zIndex,
    };
  });
  testResults.cek_desain.header = headerCheck;

  // Uji Cek Desain 2: Lebar Isi Maksimum 1200px
  const mainCheck = await page.evaluate(() => {
    const main = document.querySelector('main');
    if (!main) return { found: false };
    const style = window.getComputedStyle(main);
    const rect = main.getBoundingClientRect();
    return {
      found: true,
      maxWidth: style.maxWidth,
      width: rect.width,
    };
  });
  testResults.cek_desain.main_container = mainCheck;

  // Uji Cek Desain 10: Tampilan 1366x768 tanpa scroll horizontal
  const horizontalScrollCheck = await page.evaluate(() => {
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  testResults.cek_desain.horizontal_scroll = horizontalScrollCheck;

  // 2. a2-pasien_terisi.png (2732 x 1536)
  console.log('[2/19] Mengambil a2-pasien_terisi...');
  await page.type('#input-nama', 'Siti Rahma (fiktif)');
  await page.type('#input-umur', '45');
  await page.click('#btn-jk-p');
  // Check symptoms: batuk_2minggu, demam, keringat_malam
  await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('label'));
    labels.forEach(l => {
      const text = l.innerText || '';
      if (text.includes('Batuk') || text.includes('Demam') || text.includes('Keringat')) {
        l.click();
      }
    });
  });
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'a2-pasien_terisi.png') });
  testResults.screenshots.push('a2-pasien_terisi.png');

  // 3. a3-pasien_error-validasi.png (2732 x 1536)
  console.log('[3/19] Mengambil a3-pasien_error-validasi...');
  // Pemicu nyata: ketik umur 250
  await page.evaluate(() => {
    const input = document.querySelector('#input-umur');
    input.value = '250';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await sleep(600);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'a3-pasien_error-validasi.png') });
  testResults.screenshots.push('a3-pasien_error-validasi.png');

  // 4. b1-unggah_kosong.png (2732 x 1536)
  console.log('[4/19] Mengambil b1-unggah_kosong...');
  // Fix usia back to 45 and click Lanjut
  await page.evaluate(() => {
    const input = document.querySelector('#input-umur');
    input.value = '45';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur', { bubbles: true }));
  });
  await sleep(300);
  await page.click('#btn-lanjut-step1');
  await sleep(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b1-unggah_kosong.png') });
  testResults.screenshots.push('b1-unggah_kosong.png');

  // 5. b2-unggah_citra-terpilih.png (2732 x 1536)
  console.log('[5/19] Mengambil b2-unggah_citra-terpilih...');
  const sampleImagePath = path.resolve(__dirname, 'rontgen_siti.png');
  const fileInput = await page.$('input[type="file"]');
  await fileInput.uploadFile(sampleImagePath);
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b2-unggah_citra-terpilih.png') });
  testResults.screenshots.push('b2-unggah_citra-terpilih.png');

  // 6. b3-unggah_menganalisis.png (2732 x 1536)
  console.log('[6/19] Mengambil b3-unggah_menganalisis...');
  await page.setRequestInterception(true);
  let intercepted = false;
  page.once('request', interceptedReq => {
    if (interceptedReq.url().includes('/analyze') && !intercepted) {
      intercepted = true;
      setTimeout(() => {
        interceptedReq.continue().catch(() => {});
      }, 4000);
    } else {
      interceptedReq.continue().catch(() => {});
    }
  });

  const analyzeBtn = await page.$('#btn-mulai-analisis');
  if (analyzeBtn) await analyzeBtn.click();
  await sleep(800); // capture during loading state
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b3-unggah_menganalisis.png') });
  testResults.screenshots.push('b3-unggah_menganalisis.png');
  await sleep(3500); // wait for request to complete
  await page.setRequestInterception(false);

  // 7. b4-unggah_popup-ditolak.png (2732 x 1536)
  console.log('[7/19] Mengambil b4-unggah_popup-ditolak...');
  await page.goto('http://localhost:3000/?preview=b4', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b4-unggah_popup-ditolak.png') });
  testResults.screenshots.push('b4-unggah_popup-ditolak.png');

  // 8. b5-unggah_error-server.png (2732 x 1536)
  console.log('[8/19] Mengambil b5-unggah_error-server...');
  await page.goto('http://localhost:3000/?preview=b5', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b5-unggah_error-server.png') });
  testResults.screenshots.push('b5-unggah_error-server.png');

  // 9. b6-unggah_error-bukan-gambar.png (2732 x 1536)
  console.log('[9/19] Mengambil b6-unggah_error-bukan-gambar...');
  const docxPath = path.resolve(__dirname, 'laporan_lab.docx');
  fs.writeFileSync(docxPath, 'ini dokumen bukan gambar');
  const fileInput3 = await page.$('input[type="file"]');
  await fileInput3.uploadFile(docxPath);
  await sleep(800);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'b6-unggah_error-bukan-gambar.png') });
  testResults.screenshots.push('b6-unggah_error-bukan-gambar.png');

  // 10. c1-hasil_merah.png (2732 x 1536)
  console.log('[10/19] Mengambil c1-hasil_merah...');
  await page.goto('http://localhost:3000/?id=101', { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'c1-hasil_merah.png') });
  testResults.screenshots.push('c1-hasil_merah.png');

  // Uji Cek Desain 7: Disclaimer terlihat di layar Hasil
  const disclaimerCheck = await page.evaluate(() => {
    const aside = document.querySelector('aside[role="note"]') || document.querySelector('aside');
    if (!aside) return { found: false };
    const style = window.getComputedStyle(aside);
    const rect = aside.getBoundingClientRect();
    return {
      found: true,
      visible: style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0,
      text: aside.innerText.trim().slice(0, 100),
    };
  });
  testResults.cek_desain.disclaimer = disclaimerCheck;

  // Uji Cek Desain 6: Kategori selalu warna + teks + ikon
  const categoryRibbonCheck = await page.evaluate(() => {
    const ribbon = document.querySelector('#banner-hasil-triase');
    if (!ribbon) return { found: false };
    const hasText = ribbon.innerText.includes('MERAH') || ribbon.innerText.includes('KUNING') || ribbon.innerText.includes('HIJAU');
    const hasIcon = ribbon.querySelector('svg') !== null;
    const style = window.getComputedStyle(ribbon);
    return {
      found: true,
      hasText,
      hasIcon,
      bgColor: style.backgroundColor,
      borderColor: style.borderColor,
      textColor: style.color,
    };
  });
  testResults.cek_desain.category_ribbon = categoryRibbonCheck;

  // Uji Cek Desain 9: Layar Hasil di viewport 1366x660
  await page.setViewport({ width: 1366, height: 660, deviceScaleFactor: 2 });
  await sleep(400);
  const viewport660Check = await page.evaluate(() => {
    const ribbon = document.querySelector('#banner-hasil-triase');
    const anjuran = document.querySelector('#kartu-anjuran-tindakan') || ribbon;
    const btnSetuju = document.querySelector('#btn-tinjau-setuju');
    const btnTidakSetuju = document.querySelector('#btn-tinjau-tidak-setuju');

    return {
      viewportHeight: 660,
      ribbonBottom: ribbon ? ribbon.getBoundingClientRect().bottom : null,
      ribbonVisibleWithoutScroll: ribbon ? ribbon.getBoundingClientRect().bottom <= 660 : false,
      btnSetujuBottom: btnSetuju ? btnSetuju.getBoundingClientRect().bottom : null,
      btnSetujuVisibleWithoutScroll: btnSetuju ? btnSetuju.getBoundingClientRect().bottom <= 660 : false,
      btnTidakSetujuBottom: btnTidakSetuju ? btnTidakSetuju.getBoundingClientRect().bottom : null,
      btnTidakSetujuVisibleWithoutScroll: btnTidakSetuju ? btnTidakSetuju.getBoundingClientRect().bottom <= 660 : false,
    };
  });
  testResults.cek_desain.viewport_660 = viewport660Check;
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
  await sleep(400);

  // 11. c2-hasil_kuning.png (2732 x 1536)
  console.log('[11/19] Mengambil c2-hasil_kuning...');
  await page.goto('http://localhost:3000/?id=102', { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'c2-hasil_kuning.png') });
  testResults.screenshots.push('c2-hasil_kuning.png');

  // 12. c3-hasil_hijau.png (2732 x 1536)
  console.log('[12/19] Mengambil c3-hasil_hijau...');
  await page.goto('http://localhost:3000/?id=103', { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'c3-hasil_hijau.png') });
  testResults.screenshots.push('c3-hasil_hijau.png');

  // 13. c4-hasil_citra-janggal.png (2732 x 1536)
  console.log('[13/19] Mengambil c4-hasil_citra-janggal...');
  await page.goto('http://localhost:3000/?id=104', { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'c4-hasil_citra-janggal.png') });
  testResults.screenshots.push('c4-hasil_citra-janggal.png');

  // 14. c5-hasil_tinjauan-tersimpan.png (2732 x 1536)
  console.log('[14/19] Mengambil c5-hasil_tinjauan-tersimpan...');
  await page.goto('http://localhost:3000/?id=105', { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'c5-hasil_tinjauan-tersimpan.png') });
  testResults.screenshots.push('c5-hasil_tinjauan-tersimpan.png');

  // 15. d1-dasbor_terisi.png (2732 x 2300, viewport height 1150)
  console.log('[15/19] Mengambil d1-dasbor_terisi...');
  // Ensure seed is populated
  try {
    await fetch('http://localhost:8001/demo/seed', {
      method: 'POST',
      headers: { 'x-api-key': 'dev-key' },
    });
  } catch (e) {
    console.error('Seed error:', e.message);
  }
  await page.setViewport({ width: 1366, height: 1150, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await sleep(1200);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'd1-dasbor_terisi.png') });
  testResults.screenshots.push('d1-dasbor_terisi.png');

  // 16. d2-dasbor_kosong.png (2732 x 1536, viewport height 768)
  console.log('[16/19] Mengambil d2-dasbor_kosong...');
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
  // Call DELETE /demo
  try {
    await fetch('http://localhost:8001/demo', {
      method: 'DELETE',
      headers: { 'x-api-key': 'dev-key' },
    });
  } catch (e) {
    console.error('Delete demo error:', e.message);
  }
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'd2-dasbor_kosong.png') });
  testResults.screenshots.push('d2-dasbor_kosong.png');

  // Restore seed for d3 or later use
  try {
    await fetch('http://localhost:8001/demo/seed', {
      method: 'POST',
      headers: { 'x-api-key': 'dev-key' },
    });
  } catch (e) {}

  // 17. d3-dasbor_gagal-memuat.png (2732 x 1536)
  console.log('[17/19] Mengambil d3-dasbor_gagal-memuat...');
  const handleAbort = req => {
    if (req.url().includes('8001') || req.url().includes('ringkasan')) {
      req.abort().catch(() => {});
    } else {
      req.continue().catch(() => {});
    }
  };
  await page.setRequestInterception(true);
  page.on('request', handleAbort);
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'd3-dasbor_gagal-memuat.png') });
  page.off('request', handleAbort);
  await page.setRequestInterception(false);
  testResults.screenshots.push('d3-dasbor_gagal-memuat.png');

  // 18. e1-riwayat_pemeriksaan.png (2732 x 1536)
  console.log('[18/19] Mengambil e1-riwayat_pemeriksaan...');
  await page.goto('http://localhost:3000/riwayat', { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e1-riwayat_pemeriksaan.png') });
  testResults.screenshots.push('e1-riwayat_pemeriksaan.png');

  // Uji Cek Desain 3: Fonts (Computed font families across DOM)
  const fontFamilies = await page.evaluate(() => {
    const fonts = new Set();
    document.querySelectorAll('*').forEach(el => {
      const ff = window.getComputedStyle(el).fontFamily;
      if (ff) fonts.add(ff);
    });
    return Array.from(fonts);
  });
  testResults.cek_desain.fonts = fontFamilies;

  // Uji Cek Desain 4: Ukuran Teks < 13px dan Tombol < 44px
  const sizeAudit = await page.evaluate(() => {
    const smallTexts = [];
    const smallButtons = [];

    document.querySelectorAll('*').forEach(el => {
      // Check text nodes
      if (el.children.length === 0 && el.innerText && el.innerText.trim()) {
        const fs = parseFloat(window.getComputedStyle(el).fontSize);
        if (fs < 13) {
          smallTexts.push({
            tag: el.tagName.toLowerCase(),
            class: el.className ? el.className.toString().slice(0, 50) : '',
            fontSize: fs,
            text: el.innerText.trim().slice(0, 30),
          });
        }
      }

      // Check buttons or links styled as buttons
      if (el.tagName === 'BUTTON' || (el.tagName === 'A' && el.getAttribute('role') === 'button')) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const h = Math.round(rect.height);
        if (h < 44 && rect.width > 0 && rect.height > 0) {
          smallButtons.push({
            tag: el.tagName.toLowerCase(),
            id: el.id || '',
            class: el.className ? el.className.toString().slice(0, 50) : '',
            height: h,
            text: el.innerText.trim().slice(0, 30),
          });
        }
      }
    });

    return {
      smallTexts: smallTexts.slice(0, 20),
      totalSmallTexts: smallTexts.length,
      smallButtons: smallButtons,
      totalSmallButtons: smallButtons.length,
    };
  });
  testResults.cek_desain.size_audit = sizeAudit;

  // 19. e2-riwayat_komponen-token.png (2732 x 2160, viewport 1366x1080)
  console.log('[19/19] Mengambil e2-riwayat_komponen-token...');
  await page.setViewport({ width: 1366, height: 1080, deviceScaleFactor: 2 });
  const specE2Url = 'file:///' + path.resolve(__dirname, 'spec_e2.html').replace(/\\/g, '/');
  await page.goto(specE2Url, { waitUntil: 'networkidle2' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'e2-riwayat_komponen-token.png') });
  testResults.screenshots.push('e2-riwayat_komponen-token.png');

  await browser.close();

  // Save audit results
  fs.writeFileSync(path.resolve(__dirname, 'hasil_cek_desain.json'), JSON.stringify(testResults, null, 2), 'utf-8');
  console.log('Semua 19 tangkapan layar selesai diambil & hasil cek desain tersimpan!');
}

run().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
