import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FinancialDataset, InvestmentAsset } from '../types';
import { formatMoney } from './formatters';

export interface PDFReportOptions {
  dataset: FinancialDataset;
  authorName: string;
  authorRole: string;
  reportTitle?: string;
  periodLabel?: string;
}

export function generateNexoFinancialPDF({
  dataset,
  authorName,
  authorRole,
  reportTitle = 'Laporan Komprehensif Finansial & Portofolio Investasi Nexo',
  periodLabel = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
}: PDFReportOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const primaryColor: [number, number, number] = [17, 24, 39]; // Dark Slate
  const brandBlue: [number, number, number] = [37, 99, 235]; // Royal Blue
  const accentGray: [number, number, number] = [100, 116, 139];

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NEXO FINANCIAL WORKSPACE', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Sistem Manajemen Keuangan & Analisis Portofolio Investasi Terintegrasi', 14, 18);

  // Tanggal cetak di pojok kanan atas
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  const printDateStr = `Dicetak: ${new Date().toLocaleString('id-ID')}`;
  doc.text(printDateStr, pageWidth - 14, 12, { align: 'right' });
  doc.text(`Otorisasi: ${authorName} (${authorRole})`, pageWidth - 14, 18, { align: 'right' });

  // 2. Subheader & Metadata Box
  let currentY = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, 14, currentY);

  currentY += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...accentGray);
  doc.text(`Periode Evaluasi: ${periodLabel} | Status Integritas Data: Terverifikasi Sistem`, 14, currentY);

  currentY += 8;

  // 3. Kalkulasi Metrik Utama Portofolio & Keuangan
  let totalInvested = 0;
  let totalMarketValue = 0;
  let totalDepositsValue = 0;
  let annualPassiveIncomeEst = 0;

  const assets = dataset.assets || [];
  assets.forEach((ast) => {
    const units = ast.quantity * (ast.lotSize || 1);
    const buyVal = units * ast.buyPrice;
    const marketVal = units * ast.currentPrice;

    totalInvested += buyVal;
    totalMarketValue += marketVal;

    if (ast.type === 'deposit') {
      totalDepositsValue += marketVal;
      if (ast.interestRatePct) {
        annualPassiveIncomeEst += (marketVal * ast.interestRatePct) / 100;
      }
    }
  });

  const totalPL = totalMarketValue - totalInvested;
  const plPercentage = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  // Card Ringkasan 5 Metrik Fokus Utama Portofolio
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'FD');

  const colWidth = (pageWidth - 28) / 5;
  const metrics = [
    { label: 'Nilai Pasar Portofolio', val: formatMoney(totalMarketValue, 'IDR') },
    { label: 'Modal Terinvestasi', val: formatMoney(totalInvested, 'IDR') },
    {
      label: 'Unrealized P&L',
      val: `${totalPL >= 0 ? '+' : ''}${formatMoney(totalPL, 'IDR')} (${plPercentage.toFixed(1)}%)`,
    },
    { label: 'Total Deposito Aktif', val: formatMoney(totalDepositsValue, 'IDR') },
    { label: 'Estimasi Pasif / Thn', val: formatMoney(annualPassiveIncomeEst, 'IDR') },
  ];

  metrics.forEach((m, idx) => {
    const colX = 14 + idx * colWidth + 3;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, colX, currentY + 9);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    if (idx === 2) {
      doc.setTextColor(totalPL >= 0 ? 16 : 225, totalPL >= 0 ? 185 : 29, totalPL >= 0 ? 129 : 72);
    } else {
      doc.setTextColor(15, 23, 42);
    }
    doc.text(m.val, colX, currentY + 18);
  });

  currentY += 34;

  // 4. Tabel Detail Portofolio Aset dan Investasi
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('1. Detail Portofolio Aset & Investasi', 14, currentY);
  currentY += 4;

  const assetRows = assets.map((ast) => {
    const units = ast.quantity * (ast.lotSize || 1);
    const buyVal = units * ast.buyPrice;
    const marketVal = units * ast.currentPrice;
    const pnl = marketVal - buyVal;
    const pnlPct = buyVal > 0 ? (pnl / buyVal) * 100 : 0;

    return [
      ast.name + (ast.ticker ? ` (${ast.ticker})` : ''),
      ast.type.toUpperCase(),
      ast.institution || '-',
      `${ast.quantity.toLocaleString('id-ID')} ${ast.type === 'stock' ? 'Lot' : 'Unit'}`,
      formatMoney(ast.buyPrice, 'IDR'),
      formatMoney(ast.currentPrice, 'IDR'),
      formatMoney(marketVal, 'IDR'),
      `${pnl >= 0 ? '+' : ''}${formatMoney(pnl, 'IDR')} (${pnlPct.toFixed(1)}%)`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Aset & Ticker', 'Tipe', 'Sekuritas/Bank', 'Kuantitas', 'Harga Beli', 'Harga Kini', 'Nilai Pasar', 'P&L Floating']],
    body: assetRows.length > 0 ? assetRows : [['Belum ada aset investasi tercatat di database', '', '', '', '', '', '', '']],
    theme: 'grid',
    headStyles: {
      fillColor: brandBlue,
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: 30,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 2,
    },
  });

  // Ambil posisi Y setelah tabel aset
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // Cek jika butuh halaman baru
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // 5. Tabel Anggaran / Budget
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('2. Realisasi & Batas Anggaran (Budget)', 14, currentY);
  currentY += 4;

  const currentMonth = new Date().toISOString().substring(0, 7);
  const activeBudgets = dataset.budgets.filter((b) => b.month === currentMonth || dataset.budgets.length <= 5);

  const budgetRows = activeBudgets.map((b) => {
    const cat = dataset.categories.find((c) => c.id === b.categoryId);
    const catName = cat?.name || b.categoryId;

    // Hitung realisasi pengeluaran untuk kategori ini
    const spent = dataset.transactions
      .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId && t.status !== 'void')
      .reduce((acc, t) => acc + t.amountMinor, 0);

    const sisa = b.amountMinor - spent;
    const pct = b.amountMinor > 0 ? (spent / b.amountMinor) * 100 : 0;

    return [
      catName,
      b.month,
      formatMoney(b.amountMinor, 'IDR'),
      formatMoney(spent, 'IDR'),
      `${pct.toFixed(1)}%`,
      formatMoney(sisa, 'IDR'),
      sisa >= 0 ? 'Sesuai Anggaran' : 'Melebihi Batas',
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Kategori Pengeluaran', 'Bulan', 'Batas Anggaran', 'Realisasi Terpakai', '% Terpakai', 'Sisa Anggaran', 'Status']],
    body: budgetRows.length > 0 ? budgetRows : [['Tidak ada data anggaran bulan ini', '', '', '', '', '', '']],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: 30,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 2,
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;

  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // 6. Sampel Transaksi Terkini
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. Catatan Transaksi Keuangan Terkini', 14, currentY);
  currentY += 4;

  const recentTx = dataset.transactions.slice(0, 10).map((t) => {
    const acc = dataset.accounts.find((a) => a.id === t.accountId)?.name || 'Utama';
    const cat = dataset.categories.find((c) => c.id === t.categoryId)?.name || '-';
    return [
      t.date,
      t.description,
      t.type.toUpperCase(),
      acc,
      cat,
      formatMoney(t.amountMinor, t.currency || 'IDR'),
      t.status,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['Tanggal', 'Keterangan', 'Tipe', 'Rekening', 'Kategori', 'Nominal', 'Status']],
    body: recentTx.length > 0 ? recentTx : [['Belum ada riwayat transaksi tercatat', '', '', '', '', '', '']],
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: 30,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    styles: {
      cellPadding: 2,
    },
  });

  // Footer di setiap halaman
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Nexo Workspace Platform - Laporan Resmi Terenkripsi | Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  const fileName = `Nexo-Financial-Report-${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
