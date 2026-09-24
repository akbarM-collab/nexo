import * as XLSX from 'xlsx';
import { FinancialDataset, Transaction, InvestmentAsset, Budget, Account } from '../types';

export interface ValidationIssue {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ExcelImportResult {
  success: boolean;
  importedTransactionsCount: number;
  importedAssetsCount: number;
  importedBudgetsCount: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/**
 * Generate dan unduh template Excel resmi Nexo (.xlsx)
 */
export function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Transaksi
  const txData = [
    {
      'Tanggal (YYYY-MM-DD)': '2025-01-15',
      'Keterangan': 'Gaji Pokok Bulanan',
      'Tipe (income/expense/transfer)': 'income',
      'Nominal (Rp)': 15000000,
      'Nama Akun/Dompet': 'BCA Tabungan',
      'Kategori': 'Gaji & Pendapatan',
      'Status (cleared/pending)': 'cleared',
      'Catatan': 'Transfer payroll kantor',
    },
    {
      'Tanggal (YYYY-MM-DD)': '2025-01-16',
      'Keterangan': 'Belanja Kebutuhan Dapur',
      'Tipe (income/expense/transfer)': 'expense',
      'Nominal (Rp)': 750000,
      'Nama Akun/Dompet': 'BCA Tabungan',
      'Kategori': 'Makanan & Minuman',
      'Status (cleared/pending)': 'cleared',
      'Catatan': 'Supermarket bulanan',
    },
  ];
  const txSheet = XLSX.utils.json_to_sheet(txData);
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transaksi');

  // Sheet 2: Aset & Investasi
  const assetData = [
    {
      'Nama Aset': 'PT Bank Central Asia Tbk',
      'Kode Ticker': 'BBCA.JK',
      'Tipe (stock/deposit/gold/mutual_fund/other)': 'stock',
      'Jumlah (Lot / Gram / Unit)': 10,
      'Ukuran Lot': 100,
      'Harga Beli Rata-Rata': 9800,
      'Harga Pasar Saat Ini': 10250,
      'Institusi / Sekuritas': 'Stockbit',
      'Bunga Deposito % p.a.': '',
      'Tanggal Jatuh Tempo (YYYY-MM-DD)': '',
      'Catatan': 'Investasi jangka panjang',
    },
    {
      'Nama Aset': 'Deposito Berjangka Mandiri 12 Bulan',
      'Kode Ticker': 'DEP-MDR-01',
      'Tipe (stock/deposit/gold/mutual_fund/other)': 'deposit',
      'Jumlah (Lot / Gram / Unit)': 1,
      'Ukuran Lot': 1,
      'Harga Beli Rata-Rata': 50000000,
      'Harga Pasar Saat Ini': 50000000,
      'Institusi / Sekuritas': 'Bank Mandiri',
      'Bunga Deposito % p.a.': 4.75,
      'Tanggal Jatuh Tempo (YYYY-MM-DD)': '2025-12-31',
      'Catatan': 'Roll-over pokok',
    },
  ];
  const assetSheet = XLSX.utils.json_to_sheet(assetData);
  XLSX.utils.book_append_sheet(wb, assetSheet, 'Aset_Investasi');

  // Sheet 3: Petunjuk Pengisian
  const guideData = [
    { Panduan: 'Format Tanggal', Deskripsi: 'Wajib berformat YYYY-MM-DD (Contoh: 2025-01-20)' },
    { Panduan: 'Tipe Transaksi', Deskripsi: 'income (pemasukan), expense (pengeluaran), transfer' },
    { Panduan: 'Tipe Aset', Deskripsi: 'stock (saham), deposit (deposito), gold (emas), mutual_fund (reksadana), other' },
    { Panduan: 'Nominal', Deskripsi: 'Angka murni tanpa titik atau tanda koma Rp' },
  ];
  const guideSheet = XLSX.utils.json_to_sheet(guideData);
  XLSX.utils.book_append_sheet(wb, guideSheet, 'Panduan_Format');

  XLSX.writeFile(wb, 'Nexo-Template-Import.xlsx');
}

/**
 * Validasi dan Parsing file Excel yang diunggah
 */
export async function parseAndValidateExcel(
  file: File,
  existingDataset: FinancialDataset
): Promise<{
  result?: ExcelImportResult;
  validTransactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[];
  validAssets: Omit<InvestmentAsset, 'id' | 'createdAt'>[];
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}> {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const validTransactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const validAssets: Omit<InvestmentAsset, 'id' | 'createdAt'>[] = [];

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  // Map akun dan kategori yang ada
  const accountMap = new Map<string, string>();
  existingDataset.accounts.forEach((a) => {
    accountMap.set(a.name.toLowerCase().trim(), a.id);
  });

  const categoryMap = new Map<string, string>();
  existingDataset.categories.forEach((c) => {
    categoryMap.set(c.name.toLowerCase().trim(), c.id);
  });

  // 1. Proses Sheet Transaksi jika ada
  const txSheetName = wb.SheetNames.find((name) =>
    name.toLowerCase().includes('transaksi') || name.toLowerCase().includes('transaction')
  );

  if (txSheetName) {
    const rawTxRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[txSheetName], { defval: '' });
    rawTxRows.forEach((row, idx) => {
      const rowNum = idx + 2; // header di baris 1
      const rawDate = String(row['Tanggal (YYYY-MM-DD)'] || row['Tanggal'] || row['Date'] || '').trim();
      const rawDesc = String(row['Keterangan'] || row['Description'] || '').trim();
      const rawType = String(row['Tipe (income/expense/transfer)'] || row['Tipe'] || row['Type'] || '').trim().toLowerCase();
      const rawAmount = Number(row['Nominal (Rp)'] || row['Nominal'] || row['Amount'] || 0);
      const rawAccount = String(row['Nama Akun/Dompet'] || row['Akun'] || row['Account'] || '').trim();
      const rawCat = String(row['Kategori'] || row['Category'] || '').trim();
      const rawNotes = String(row['Catatan'] || row['Notes'] || '').trim();

      // Validasi Tanggal
      if (!rawDate) {
        errors.push({ row: rowNum, field: 'Tanggal', message: 'Tanggal transaksi wajib diisi.', severity: 'error' });
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate) && isNaN(Date.parse(rawDate))) {
        errors.push({ row: rowNum, field: 'Tanggal', message: `Format tanggal '${rawDate}' tidak valid. Gunakan YYYY-MM-DD.`, severity: 'error' });
      }

      // Validasi Keterangan
      if (!rawDesc) {
        errors.push({ row: rowNum, field: 'Keterangan', message: 'Keterangan transaksi wajib diisi.', severity: 'error' });
      }

      // Validasi Tipe
      let validNormalizedType: 'income' | 'expense' | 'transfer' = 'expense';
      if (['income', 'pemasukan', 'masuk'].includes(rawType)) {
        validNormalizedType = 'income';
      } else if (['expense', 'pengeluaran', 'keluar'].includes(rawType)) {
        validNormalizedType = 'expense';
      } else if (['transfer', 'pindah'].includes(rawType)) {
        validNormalizedType = 'transfer';
      } else {
        errors.push({ row: rowNum, field: 'Tipe', message: `Tipe '${rawType}' tidak valid. Harus 'income', 'expense', atau 'transfer'.`, severity: 'error' });
      }

      // Validasi Nominal
      if (isNaN(rawAmount) || rawAmount <= 0) {
        errors.push({ row: rowNum, field: 'Nominal', message: 'Nominal harus berupa angka lebih besar dari 0.', severity: 'error' });
      }

      // Validasi Akun
      let accountId = existingDataset.accounts[0]?.id || 'acc_default';
      if (rawAccount) {
        const found = accountMap.get(rawAccount.toLowerCase());
        if (found) {
          accountId = found;
        } else {
          warnings.push({ row: rowNum, field: 'Akun', message: `Akun '${rawAccount}' tidak ditemukan. Menggunakan akun utama '${existingDataset.accounts[0]?.name || 'Utama'}'.`, severity: 'warning' });
        }
      }

      // Validasi Kategori
      let categoryId: string | null = null;
      if (rawCat) {
        const foundCat = categoryMap.get(rawCat.toLowerCase());
        if (foundCat) {
          categoryId = foundCat;
        } else {
          warnings.push({ row: rowNum, field: 'Kategori', message: `Kategori '${rawCat}' tidak dikenal. Disimpan tanpa kategori.`, severity: 'warning' });
        }
      }

      // Cek Duplikasi transaksi serupa
      const isDuplicate = existingDataset.transactions.some(
        (t) => t.date === rawDate && t.description.toLowerCase() === rawDesc.toLowerCase() && t.amountMinor === rawAmount
      );
      if (isDuplicate) {
        warnings.push({ row: rowNum, field: 'Duplikasi', message: `Transaksi '${rawDesc}' Rp ${rawAmount.toLocaleString('id-ID')} pada tanggal ${rawDate} sudah ada di database.`, severity: 'warning' });
      }

      if (!errors.some((e) => e.row === rowNum)) {
        validTransactions.push({
          date: rawDate,
          description: rawDesc,
          type: validNormalizedType,
          amountMinor: rawAmount,
          currency: 'IDR',
          accountId,
          categoryId,
          status: 'cleared',
          tags: ['import-excel'],
          notes: rawNotes ? `${rawNotes} (Import Excel)` : 'Import Excel Nexo',
        });
      }
    });
  }

  // 2. Proses Sheet Aset & Investasi jika ada
  const assetSheetName = wb.SheetNames.find((name) =>
    name.toLowerCase().includes('aset') || name.toLowerCase().includes('asset') || name.toLowerCase().includes('investasi')
  );

  if (assetSheetName) {
    const rawAssetRows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[assetSheetName], { defval: '' });
    rawAssetRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const rawName = String(row['Nama Aset'] || row['Nama'] || row['Name'] || '').trim();
      const rawTicker = String(row['Kode Ticker'] || row['Ticker'] || '').trim().toUpperCase();
      const rawType = String(row['Tipe (stock/deposit/gold/mutual_fund/other)'] || row['Tipe'] || row['Type'] || 'stock').trim().toLowerCase();
      const rawQty = Number(row['Jumlah (Lot / Gram / Unit)'] || row['Jumlah'] || row['Quantity'] || 0);
      const rawLotSize = Number(row['Ukuran Lot'] || row['LotSize'] || (rawType === 'stock' ? 100 : 1));
      const rawBuyPrice = Number(row['Harga Beli Rata-Rata'] || row['Harga Beli'] || row['BuyPrice'] || 0);
      const rawCurPrice = Number(row['Harga Pasar Saat Ini'] || row['Harga Pasar'] || row['CurrentPrice'] || rawBuyPrice);
      const rawInst = String(row['Institusi / Sekuritas'] || row['Institusi'] || '').trim();
      const rawRate = Number(row['Bunga Deposito % p.a.'] || 0);
      const rawDueDate = String(row['Tanggal Jatuh Tempo (YYYY-MM-DD)'] || '').trim();
      const rawNotes = String(row['Catatan'] || '').trim();

      if (!rawName) {
        errors.push({ row: rowNum, field: 'Nama Aset', message: 'Nama aset wajib diisi.', severity: 'error' });
      }
      if (rawQty <= 0) {
        errors.push({ row: rowNum, field: 'Jumlah', message: 'Jumlah kuantitas harus lebih dari 0.', severity: 'error' });
      }
      if (rawBuyPrice <= 0) {
        errors.push({ row: rowNum, field: 'Harga Beli', message: 'Harga beli harus lebih besar dari 0.', severity: 'error' });
      }

      let assetType: any = 'other';
      if (['stock', 'saham'].includes(rawType)) assetType = 'stock';
      else if (['deposit', 'deposito'].includes(rawType)) assetType = 'deposit';
      else if (['gold', 'emas'].includes(rawType)) assetType = 'gold';
      else if (['mutual_fund', 'reksadana'].includes(rawType)) assetType = 'mutual_fund';

      if (!errors.some((e) => e.row === rowNum)) {
        validAssets.push({
          name: rawName,
          ticker: rawTicker || undefined,
          type: assetType,
          quantity: rawQty,
          lotSize: rawLotSize,
          buyPrice: rawBuyPrice,
          currentPrice: rawCurPrice || rawBuyPrice,
          currency: 'IDR',
          institution: rawInst || 'Sekuritas / Bank',
          interestRatePct: rawRate > 0 ? rawRate : undefined,
          maturityDate: rawDueDate || undefined,
          notes: rawNotes,
        });
      }
    });
  }

  const success = errors.length === 0;
  return {
    result: {
      success,
      importedTransactionsCount: validTransactions.length,
      importedAssetsCount: validAssets.length,
      importedBudgetsCount: 0,
      errors,
      warnings,
    },
    validTransactions,
    validAssets,
    errors,
    warnings,
  };
}

/**
 * Ekspor Komprehensif Data Nexo ke format Excel (.xlsx)
 */
export function exportDatabaseToExcel(dataset: FinancialDataset, activeProfileName: string = 'Nexo Workspace') {
  const wb = XLSX.utils.book_new();

  // 1. Ringkasan Eksekutif Finansial & Net Worth
  let totalBalance = 0;
  dataset.accounts.forEach((acc) => {
    totalBalance += acc.openingBalanceMinor;
  });

  const summaryData = [
    { Metrik: 'Nama Workspace', Nilai: activeProfileName },
    { Metrik: 'Waktu Ekspor', Nilai: new Date().toLocaleString('id-ID') },
    { Metrik: 'Jumlah Rekening / Akun', Nilai: dataset.accounts.length },
    { Metrik: 'Total Transaksi Tercatat', Nilai: dataset.transactions.length },
    { Metrik: 'Total Item Aset & Investasi', Nilai: (dataset.assets || []).length },
    { Metrik: 'Jumlah Pos Anggaran', Nilai: dataset.budgets.length },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan_Nexo');

  // 2. Sheet Transaksi Lengkap
  const txRows = dataset.transactions.map((tx) => {
    const acc = dataset.accounts.find((a) => a.id === tx.accountId)?.name || tx.accountId;
    const cat = dataset.categories.find((c) => c.id === tx.categoryId)?.name || 'Tanpa Kategori';
    return {
      ID: tx.id,
      Tanggal: tx.date,
      Keterangan: tx.description,
      Tipe: tx.type === 'income' ? 'Pemasukan' : tx.type === 'expense' ? 'Pengeluaran' : 'Transfer',
      'Nominal (Rp)': tx.amountMinor,
      Mata_Uang: tx.currency,
      Rekening: acc,
      Kategori: cat,
      Status: tx.status,
      Tag: (tx.tags || []).join(', '),
      Catatan: tx.notes || '',
    };
  });
  const txSheet = XLSX.utils.json_to_sheet(txRows);
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transaksi');

  // 3. Sheet Aset & Investasi
  if (dataset.assets && dataset.assets.length > 0) {
    const assetRows = dataset.assets.map((ast) => {
      const units = ast.quantity * (ast.lotSize || 1);
      const totalBuy = units * ast.buyPrice;
      const totalMarket = units * ast.currentPrice;
      const pnl = totalMarket - totalBuy;
      const pnlPct = totalBuy > 0 ? (pnl / totalBuy) * 100 : 0;

      return {
        ID: ast.id,
        Nama_Aset: ast.name,
        Ticker: ast.ticker || '-',
        Kategori: ast.type,
        Kuantitas: ast.quantity,
        Ukuran_Lot: ast.lotSize || 1,
        Total_Unit: units,
        Harga_Beli: ast.buyPrice,
        Harga_Pasar: ast.currentPrice,
        Modal_Terinvestasi: totalBuy,
        Nilai_Pasar_Total: totalMarket,
        Floating_PL: pnl,
        Floating_PL_Persen: `${pnlPct.toFixed(2)}%`,
        Institusi: ast.institution || '-',
        Bunga_Deposito_Pct: ast.interestRatePct ? `${ast.interestRatePct}%` : '-',
        Jatuh_Tempo: ast.maturityDate || '-',
        Catatan: ast.notes || '',
      };
    });
    const assetSheet = XLSX.utils.json_to_sheet(assetRows);
    XLSX.utils.book_append_sheet(wb, assetSheet, 'Portofolio_Investasi');
  }

  // 4. Sheet Anggaran / Budget
  if (dataset.budgets && dataset.budgets.length > 0) {
    const budgetRows = dataset.budgets.map((b) => {
      const cat = dataset.categories.find((c) => c.id === b.categoryId)?.name || b.categoryId;
      return {
        ID: b.id,
        Bulan: b.month,
        Kategori: cat,
        Batas_Maksimal_Rp: b.amountMinor,
        Rollover: b.rollover ? 'Ya' : 'Tidak',
        Catatan: b.notes || '',
      };
    });
    const budgetSheet = XLSX.utils.json_to_sheet(budgetRows);
    XLSX.utils.book_append_sheet(wb, budgetSheet, 'Anggaran_Budget');
  }

  // 5. Sheet Daftar Rekening / Akun
  const accRows = dataset.accounts.map((a) => ({
    ID: a.id,
    Nama_Akun: a.name,
    Tipe: a.type,
    Saldo_Awal: a.openingBalanceMinor,
    Mata_Uang: a.currency,
    Institusi: a.institution || '-',
    Status: a.archived ? 'Diarsipkan' : 'Aktif',
  }));
  const accSheet = XLSX.utils.json_to_sheet(accRows);
  XLSX.utils.book_append_sheet(wb, accSheet, 'Daftar_Rekening');

  const fileName = `Nexo-Export-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
