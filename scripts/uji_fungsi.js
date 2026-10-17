const path = require('path');
const puppeteer = require(path.resolve(__dirname, '..', 'frontend', 'node_modules', 'puppeteer-core'));

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

async function testE2E() {
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1366,768']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    console.log('[1/4] Menguji alur analisis rontgen...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    // Fill step 1
    await page.type('#input-nama', 'Siti Aminah');
    await page.type('#input-umur', '45');
    await page.click('#btn-jk-p');
    await page.click('#btn-lanjut-step1');
    await new Promise(r => setTimeout(r, 600));

    // Upload file in step 2
    const fileInput = await page.$('input[type="file"]');
    const sampleImg = path.join(process.cwd(), 'scripts', 'sample_valid_xray.png');
    await fileInput.uploadFile(sampleImg);
    await new Promise(r => setTimeout(r, 800));

    // Click analyze
    const btnAnalisis = await page.waitForSelector('#btn-mulai-analisis');
    await btnAnalisis.click();

    // Wait for step 3 (Hasil)
    await page.waitForSelector('#input-catatan-dokter', { timeout: 20000 });
    console.log('  -> Hasil: Analisis BERHASIL (Berada di Layar Hasil Langkah 3).');

    // Simpan tinjauan
    console.log('[2/4] Menguji simpan tinjauan dokter...');
    await page.click('#btn-tinjau-setuju');
    await page.type('#input-catatan-dokter', 'Kondisi klinis sesuai dengan gambaran rontgen');
    await page.click('#btn-simpan-tinjauan');
    await new Promise(r => setTimeout(r, 1500));
    
    const pageContent = await page.content();
    const reviewSaved = pageContent.includes('Tinjauan tersimpan');
    console.log('  -> Hasil: Simpan tinjauan ' + (reviewSaved ? 'BERHASIL (Kartu tinjauan tersimpan muncul).' : 'GAGAL.'));

    // Check PDF link
    console.log('[3/4] Menguji ketersediaan tautan surat rujukan PDF...');
    const pdfLink = await page.$('a[href*="rujukan.pdf"]');
    if (pdfLink) {
      const pdfHref = await page.evaluate(el => el.href, pdfLink);
      console.log('  -> Hasil: Buka PDF BERHASIL (URL: ' + pdfHref + ').');
    } else {
      console.log('  -> Hasil: Buka PDF GAGAL (link rujukan tidak ditemukan).');
    }

    // Dasbor memuat
    console.log('[4/4] Menguji pemuatan dasbor...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    const dashContent = await page.content();
    const dashLoaded = dashContent.includes('Total') && (dashContent.includes('Pemeriksaan') || dashContent.includes('Ringkasan'));
    console.log('  -> Hasil: Dasbor memuat ' + (dashLoaded ? 'BERHASIL (Data dan ringkasan ter-render).' : 'GAGAL.'));

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await browser.close();
  }
}

testE2E();
