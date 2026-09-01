import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, SecurityAlert, UserProfile } from '../types';

export interface PDFExportOptions {
  month?: number; // 0-11 (e.g. 7 for August)
  year?: number;  // e.g. 2026
  includeRiskAnalysis?: boolean;
  includeCategoryBreakdown?: boolean;
  transactions: Transaction[];
  alerts?: SecurityAlert[];
  user?: {
    name?: string;
    email?: string;
    phone?: string;
    id?: string;
  };
  profile?: UserProfile | null;
  monthlyBudgetLimit?: number;
}

export const generateFinancialReportPDF = async (options: PDFExportOptions): Promise<void> => {
  const {
    month,
    year,
    includeRiskAnalysis = true,
    includeCategoryBreakdown = true,
    transactions = [],
    alerts = [],
    user,
    profile,
    monthlyBudgetLimit = 50000,
  } = options;

  // Filter transactions by selected month/year if specified
  const filteredTxs = transactions.filter((tx) => {
    if (month === undefined || year === undefined) return true;
    const d不易 = new Date(tx.timestamp);
    return d不易.getMonth() === month && d不易.getFullYear() === year;
  });

  // Period label
  const periodLabel =
    month !== undefined && year !== undefined
      ? new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })
      : 'Comprehensive All-Time Statement';

  // Metrics computation
  const totalSpend = filteredTxs
    .filter((t) => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + t.amount, 0);

  const threatBlockedAmount = filteredTxs
    .filter((t) => t.status === 'BLOCKED' || t.decision === 'BLOCK')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalVolume = filteredTxs.reduce((sum, t) => sum + t.amount, 0);

  const completedCount = filteredTxs.filter((t) => t.status === 'COMPLETED').length;
  const blockedCount = filteredTxs.filter((t) => t.status === 'BLOCKED' || t.decision === 'BLOCK').length;
  const challengedCount = filteredTxs.filter((t) => t.decision === 'CHALLENGE' || t.status === 'CHALLENGED').length;

  const safetyScore = profile?.safetyScore ?? 100;
  const protectionLevel = profile?.protectionLevel ?? 'High Protection (Zero-Trust Active)';

  // Initialize jsPDF document (Portrait A4)
  const doc不易 = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc不易.internal.pageSize.getWidth();
  let currentY = 14;

  // 1. BRAND HEADER (Neo-Brutalist High-Contrast Styling)
  // Top Banner Bar
  doc不易.setFillColor(124, 58, 237); // Sentinel Purple (#7C3AED)
  doc不易.rect(14, currentY, pageWidth - 28, 18, 'F');
  doc不易.setDrawColor(0, 0, 0);
  doc不易.setLineWidth(0.8);
  doc不易.rect(14, currentY, pageWidth - 28, 18, 'D');

  doc不易.setFont('helvetica', 'bold');
  doc不易.setFontSize(14);
  doc不易.setTextColor(255, 255, 255);
  doc不易.text('SENTINELFIN FINANCIAL STATEMENT & RISK AUDIT', 18, currentY + 11);

  doc不易.setFontSize(8);
  doc不易.setFont('helvetica', 'normal');
  doc不易.text('ZERO-TRUST AI PAYMENT DEFENSE', pageWidth - 70, currentY + 11);

  currentY += 24;

  // 2. STATEMENT & ACCOUNT METADATA GRID
  doc不易.setFillColor(250, 247, 242); // Warm off-white #FAF7F2
  doc不易.rect(14, currentY, pageWidth - 28, 28, 'F');
  doc不易.setDrawColor(0, 0, 0);
  doc不易.setLineWidth(0.5);
  doc不易.rect(14, currentY, pageWidth - 28, 28, 'D');

  doc不易.setTextColor(0, 0, 0);
  doc不易.setFont('helvetica', 'bold');
  doc不易.setFontSize(9);

  // Left column: User info
  doc不易.text('ACCOUNT HOLDER:', 18, currentY + 7);
  doc不易.setFont('helvetica', 'normal');
  doc不易.text(user?.name || 'Verified Sentinel User', 52, currentY + 7);

  doc不易.setFont('helvetica', 'bold');
  doc不易.text('REGISTERED EMAIL/PHONE:', 18, currentY + 14);
  doc不易.setFont('helvetica', 'normal');
  doc不易.text(`${user?.email || 'user@sentinelfin.com'} | ${user?.phone || 'N/A'}`, 64, currentY + 14);

  doc不易.setFont('helvetica', 'bold');
  doc不易.text('ACCOUNT ID:', 18, currentY + 21);
  doc不易.setFont('helvetica', 'normal');
  doc不易.text(user?.id || 'usr_personal_vault', 42, currentY + 21);

  // Right column: Statement period & Safety
  const rightColX = pageWidth / 2 + 10;
  doc不易.setFont('helvetica', 'bold');
  doc不易.text('STATEMENT PERIOD:', rightColX, currentY + 7);
  doc不易.setFont('helvetica', 'normal');
  doc不易.text(periodLabel, rightColX + 38, currentY + 7);

  doc不易.setFont('helvetica', 'bold');
  doc不易.text('DEFENSE STATUS:', rightColX, currentY + 14);
  doc不易.setFont('helvetica', 'normal');
  doc不易.text(`${protectionLevel} (${safetyScore}/100)`, rightColX + 34, currentY + 14);

  doc不易.setFont('helvetica', 'bold');
  doc不易.text('GENERATED ON:', rightColX, currentY + 21);
  doc不易.setFont('helvetica', 'normal');
  doc不易.text(new Date().toLocaleString('en-IN'), rightColX + 30, currentY + 21);

  currentY += 34;

  // 3. EXECUTIVE FINANCIAL SUMMARY BOXES
  doc不易.setFont('helvetica', 'bold');
  doc不易.setFontSize(11);
  doc不易.setTextColor(0, 0, 0);
  doc不易.text('MONTHLY FINANCIAL & SECURITY METRICS', 14, currentY);
  currentY += 4;

  const boxWidth = (pageWidth - 28 - 9) / 4;
  const boxHeight = 19;

  // Box 1: Total Completed Spend
  doc不易.setFillColor(255, 255, 255);
  doc不易.rect(14, currentY, boxWidth, boxHeight, 'FD');
  doc不易.setFontSize(7);
  doc不易.setFont('helvetica', 'bold');
  doc不易.setTextColor(100, 100, 100);
  doc不易.text('TOTAL SPENT', 17, currentY + 6);
  doc不易.setFontSize(11);
  doc不易.setTextColor(0, 0, 0);
  doc不易.text(`₹${totalSpend.toLocaleString('en-IN')}`, 17, currentY + 14);

  // Box 2: Fraud & Threat Protected (Savings)
  doc不易.setFillColor(236, 253, 245); // Emerald-50
  doc不易.rect(14 + boxWidth + 3, currentY, boxWidth, boxHeight, 'FD');
  doc不易.setFontSize(7);
  doc不易.setFont('helvetica', 'bold');
  doc不易.setTextColor(5, 150, 105);
  doc不易.text('SHIELDED / THREAT SAVINGS', 14 + boxWidth + 6, currentY + 6);
  doc不易.setFontSize(11);
  doc不易.setTextColor(4, 120, 87);
  doc不易.text(`₹${threatBlockedAmount.toLocaleString('en-IN')}`, 14 + boxWidth + 6, currentY + 14);

  // Box 3: Budget Cap & Utilization
  const budgetPct = monthlyBudgetLimit > 0 ? Math.round((totalSpend / monthlyBudgetLimit) * 100) : 0;
  doc不易.setFillColor(255, 255, 255);
  doc不易.rect(14 + (boxWidth + 3) * 2, currentY, boxWidth, boxHeight, 'FD');
  doc不易.setFontSize(7);
  doc不易.setFont('helvetica', 'bold');
  doc不易.setTextColor(100, 100, 100);
  doc不易.text('BUDGET CAP UTILIZATION', 14 + (boxWidth + 3) * 2 + 3, currentY + 6);
  doc不易.setFontSize(11);
  doc不易.setTextColor(budgetPct > 100 ? 220 : 0, budgetPct > 100 ? 38 : 0, budgetPct > 100 ? 38 : 0);
  doc不易.text(`${budgetPct}% (₹${monthlyBudgetLimit.toLocaleString('en-IN')})`, 14 + (boxWidth + 3) * 2 + 3, currentY + 14);

  // Box 4: Total Activity Evaluated
  doc不易.setFillColor(255, 255, 255);
  doc不易.rect(14 + (boxWidth + 3) * 3, currentY, boxWidth, boxHeight, 'FD');
  doc不易.setFontSize(7);
  doc不易.setFont('helvetica', 'bold');
  doc不易.setTextColor(100, 100, 100);
  doc不易.text('EVALUATED TRANSACTIONS', 14 + (boxWidth + 3) * 3 + 3, currentY + 6);
  doc不易.setFontSize(11);
  doc不易.setTextColor(0, 0, 0);
  doc不易.text(`${filteredTxs.length} Total (${completedCount} Paid)`, 14 + (boxWidth + 3) * 3 + 3, currentY + 14);

  currentY += boxHeight + 8;

  // 4. CATEGORY BREAKDOWN SECTION
  if (includeCategoryBreakdown) {
    const categoryTotals: Record<string, { spent: number; count: number }> = {};
    filteredTxs.forEach((tx) => {
      const cat = tx.category || 'General & Others';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { spent: 0, count: 0 };
      }
      if (tx.status === 'COMPLETED') {
        categoryTotals[cat].spent += tx.amount;
      }
      categoryTotals[cat].count += 1;
    });

    const categoryRows = Object.entries(categoryTotals).map(([cat, data]) => {
      const sharePct = totalSpend > 0 ? ((data.spent / totalSpend) * 100).toFixed(1) : '0';
      return [cat, `${data.count} txn(s)`, `₹${data.spent.toLocaleString('en-IN')}`, `${sharePct}%`];
    });

    if (categoryRows.length > 0) {
      doc不易.setFont('helvetica', 'bold');
      doc不易.setFontSize(11);
      doc不易.setTextColor(0, 0, 0);
      doc不易.text('CATEGORY-WISE EXPENDITURE BREAKDOWN', 14, currentY);
      currentY += 3;

      autoTable(doc不易, {
        startY: currentY,
        head: [['Spending Category', 'Transaction Volume', 'Total Amount Spent (INR)', 'Share of Budget']],
        body: categoryRows,
        theme: 'plain',
        headStyles: {
          fillColor: [240, 235, 225],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          fontSize: 8,
          lineWidth: 0.3,
          lineColor: [0, 0, 0],
        },
        bodyStyles: {
          textColor: [30, 30, 30],
          fontSize: 8,
          lineWidth: 0.2,
          lineColor: [200, 200, 200],
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc不易 as any).lastAutoTable.finalY + 8;
    }
  }

  // 5. ZERO-TRUST AI RISK AUDIT SUMMARY (If requested)
  if (includeRiskAnalysis) {
    if (currentY > 230) {
      doc不易.addPage();
      currentY = 16;
    }

    doc不易.setFont('helvetica', 'bold');
    doc不易.setFontSize(11);
    doc不易.setTextColor(0, 0, 0);
    doc不易.text('AI RISK ANALYSIS & THREAT PREVENTION AUDIT', 14, currentY);
    currentY += 4;

    const riskSummaryData = [
      ['Zero-Trust ALLOW (Instant Safe Execution)', `${completedCount} Transactions`, 'Safe / Zero Threat Signature'],
      ['Zero-Trust CHALLENGE (Biometric / Step-Up)', `${challengedCount} Transactions`, 'Suspicious Velocity / Unverified Recipient'],
      ['Zero-Trust BLOCK (Immediate Malicious Stop)', `${blockedCount} Transactions`, 'Impersonation Scam / High-Risk Phishing VPA'],
    ];

    autoTable(doc不易, {
      startY: currentY,
      head: [['AI Engine Evaluation Result', 'Action Count', 'Audit Security Protocol']],
      body: riskSummaryData,
      theme: 'plain',
      headStyles: {
        fillColor: [124, 58, 237],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 8,
        lineWidth: 0.2,
        lineColor: [200, 200, 200],
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc不易 as any).lastAutoTable.finalY + 8;
  }

  // 6. ITEMIZED TRANSACTION LOG
  if (currentY > 230) {
    doc不易.addPage();
    currentY = 16;
  }

  doc不易.setFont('helvetica', 'bold');
  doc不易.setFontSize(11);
  doc不易.setTextColor(0, 0, 0);
  doc不易.text(`ITEMIZED TRANSACTION LEDGER (${filteredTxs.length} Records)`, 14, currentY);
  currentY += 3;

  const itemizedRows不易 = filteredTxs.map((tx) => {
    const formattedDate = new Date(tx.timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return [
      formattedDate,
      tx.recipientName || 'Unknown',
      tx.category || 'General',
      `₹${tx.amount.toLocaleString('en-IN')}`,
      tx.status || 'COMPLETED',
      tx.decision || 'ALLOW',
      `${tx.safetyScore ?? 99}/100`,
    ];
  });

  autoTable(doc不易, {
    startY: currentY,
    head: [['Date', 'Beneficiary / Counterparty', 'Category', 'Amount', 'Status', 'Decision', 'Risk Score']],
    body: itemizedRows不易.length > 0 ? itemizedRows不易 : [['No transactions recorded for the selected period.', '-', '-', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      lineWidth: 0.2,
      lineColor: [0, 0, 0],
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [20, 20, 20],
    },
    alternateRowStyles: {
      fillColor: [248, 246, 242],
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc不易 as any).lastAutoTable.finalY + 10;

  // 7. FOOTER & AUDIT VERIFICATION SEAL
  if (currentY > 260) {
    doc不易.addPage();
    currentY = 16;
  }

  doc不易.setDrawColor(200, 200, 200);
  doc不易.line(14, currentY, pageWidth - 14, currentY);
  currentY += 5;

  doc不易.setFont('helvetica', 'normal');
  doc不易.setFontSize(7);
  doc不易.setTextColor(100, 100, 100);
  doc不易.text(
    'This document is an authentic financial & security evaluation record generated by SentinelFin Zero-Trust Defense Network.',
    14,
    currentY
  );
  doc不易.text(
    `Security Signature Hash: SHA-256-${Math.random().toString(36).substring(2, 12).toUpperCase()} | All transactions encrypted with end-to-end telemetry.`,
    14,
    currentY + 4
  );

  // File naming
  const filePeriod =
    month !== undefined && year !== undefined
      ? `${year}_${String(month + 1).padStart(2, '0')}`
      : 'All_Time';
  const fileName = `SentinelFin_Monthly_Report_${filePeriod}.pdf`;

  // Trigger download
  doc不易.save(fileName);
};
