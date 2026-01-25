
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, AlertCircle, Calendar, 
  Download, Plus, Filter, Search, CheckCircle2, X, ChevronRight, 
  Briefcase, User, PieChart, Wallet, FileText, ArrowLeft, Printer, Trash2,
  Building, Settings, Save, CreditCard, Copy, Eye, Loader2, Edit, Check,
  Receipt, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart as RePie, Pie
} from 'recharts';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where, getDoc, setDoc, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { InvoiceRecord, ExpenseRecord, PaymentRecord, InvoiceItem, FirmProfile, BankAccount, IncomeRecord } from '../../types';
import { differenceInDays, parseISO, format } from 'date-fns';
import { useSite } from '../../contexts/SiteContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Utility: Number to Words (Indian Format) ---
const numberToWords = (num: number): string => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString() as any).length > 9) return 'overflow';
    const n: any = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + ' Only';
};

// --- PDF Generator ---
const generateInvoicePDF = (invoice: InvoiceRecord, firm: FirmProfile, mode: 'download' | 'preview' = 'download') => {
    const doc = new jsPDF();
    const width = doc.internal.pageSize.width;
    
    // Layout Constants
    const margin = 10;
    const contentWidth = width - (2 * margin);
    let currentY = margin;

    doc.setLineWidth(0.3);
    doc.setDrawColor(0);
    doc.setTextColor(0);

    // Resolve Bank Details
    // Priority: Invoice Specific -> Default in Profile -> Legacy Fields in Profile
    let bankDetails = invoice.firmBankDetails;
    if (!bankDetails) {
        if (firm.bankAccounts && firm.bankAccounts.length > 0) {
            bankDetails = firm.bankAccounts.find(b => b.isDefault) || firm.bankAccounts[0];
        } else {
            // Fallback to legacy fields if no bankAccounts array
            bankDetails = {
                id: 'legacy',
                bankName: firm.bankName || '',
                accountName: firm.accountName || '',
                accountNumber: firm.accountNumber || '',
                ifscCode: firm.ifscCode || '',
                branchName: firm.branchName || ''
            };
        }
    }

    // --- ROW 1: HEADER ---
    const headerHeight = 44;
    doc.rect(margin, currentY, contentWidth, headerHeight);

    // "TAX INVOICE" Title
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', width / 2, currentY + 5, { align: 'center' });
    const titleWidth = doc.getTextWidth('TAX INVOICE');
    doc.line((width/2) - (titleWidth/2), currentY + 6, (width/2) + (titleWidth/2), currentY + 6);

    // GSTIN & Prop (Top Left)
    doc.setFontSize(9);
    doc.text(`GSTIN: ${firm.gstin}`, margin + 2, currentY + 12);
    doc.text(`(Prop. ${firm.proprietorName})`, margin + 2, currentY + 17);

    // Contact (Top Right)
    doc.text(`Email: ${firm.email}`, width - margin - 2, currentY + 12, { align: 'right' });
    doc.text(`${firm.phonePrimary} (P)`, width - margin - 2, currentY + 17, { align: 'right' });
    if(firm.phoneSecondary) {
       doc.text(`${firm.phoneSecondary} (O)`, width - margin - 2, currentY + 22, { align: 'right' });
    }

    // Firm Name Box (Center)
    const boxTop = currentY + 24;
    doc.rect(margin, boxTop, contentWidth, 8); // Inner box
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`• ${firm.firmName.toUpperCase()} •`, width / 2, boxTop + 5.5, { align: 'center' });

    // Subtitle & Address
    doc.setFontSize(9);
    doc.text(`• ${firm.subTitle} •`, width / 2, boxTop + 13, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(firm.address, width / 2, boxTop + 17, { align: 'center' });

    currentY += headerHeight;

    // --- ROW 2: RECIPIENT & INVOICE META ---
    const row2Height = 38;
    const splitX = width - margin - 75; // Vertical divider for Right Column

    doc.rect(margin, currentY, contentWidth, row2Height);
    doc.line(splitX, currentY, splitX, currentY + row2Height); // Vertical line

    // LEFT COLUMN: "To" Details
    let leftY = currentY + 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('To,', margin + 2, leftY);
    leftY += 5;
    doc.text('The Branch Head', margin + 2, leftY);
    leftY += 5;
    if (invoice.billingToBankName) { doc.text(invoice.billingToBankName, margin + 2, leftY); leftY += 5; }
    if (invoice.billingToBranch) { doc.text(invoice.billingToBranch, margin + 2, leftY); leftY += 5; }
    
    doc.setFont('helvetica', 'normal');
    if (invoice.billingToDistrict) { doc.text(invoice.billingToDistrict, margin + 2, leftY); leftY += 5; }
    if (invoice.billingToState) { doc.text(invoice.billingToState, margin + 2, leftY); }

    // RIGHT COLUMN: Date & Office Use
    let rightY = currentY + 5;
    
    // Date & Bill No
    doc.setFont('helvetica', 'normal');
    doc.text('Date', splitX + 2, rightY);
    doc.text(':', splitX + 25, rightY);
    doc.text(invoice.invoiceDate ? format(parseISO(invoice.invoiceDate), 'dd-MM-yy') : '', splitX + 28, rightY);
    rightY += 5;
    
    doc.text('Bill No.', splitX + 2, rightY);
    doc.text(':', splitX + 25, rightY);
    doc.text(invoice.invoiceNo, splitX + 28, rightY);
    
    // Office Use Box
    const officeBoxY = rightY + 3;
    doc.line(splitX, officeBoxY, width - margin, officeBoxY); // Separator line
    
    // "For Office use only" Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('For Office use only', splitX + 37.5, officeBoxY + 4, { align: 'center' });
    doc.line(splitX, officeBoxY + 5, width - margin, officeBoxY + 5);

    // Office Fields
    doc.setFont('helvetica', 'normal');
    let offY = officeBoxY + 10;
    doc.text('Mode of', splitX + 2, offY);
    doc.text('Payment:', splitX + 2, offY + 4);
    doc.text(':', splitX + 25, offY + 2);

    offY += 9;
    doc.text('Bill Received', splitX + 2, offY);
    doc.text('on date :', splitX + 2, offY + 4);

    currentY += row2Height;

    // --- ROW 3: BRANCH CASE ---
    const row3Height = 7;
    doc.rect(margin, currentY, contentWidth, row3Height);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Branch Case', margin + 2, currentY + 4.5);
    doc.text(':', margin + 60, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.branchCaseDetails || '', margin + 65, currentY + 4.5);

    currentY += row3Height;

    // --- ROW 4: CLIENT DETAILS ---
    const row4Height = 32;
    doc.rect(margin, currentY, contentWidth, row4Height);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Client Details:', margin + 2, currentY + 5);
    
    const fieldsStartY = currentY + 10;
    const fields = [
        { l: 'Account Name', v: invoice.clientName },
        { l: 'Owner Name', v: invoice.clientOwnerName },
        { l: 'GSTIN No.', v: invoice.clientGstin },
        { l: 'Mobile No.', v: invoice.clientMobile },
        { l: 'State', v: invoice.clientState }
    ];

    fields.forEach((f, i) => {
        const y = fieldsStartY + (i * 4.5);
        doc.setFont('helvetica', 'bold');
        doc.text(f.l, margin + 2, y);
        doc.text(':', margin + 60, y);
        doc.setFont('helvetica', 'normal');
        doc.text(f.v || '', margin + 65, y);
    });

    currentY += row4Height;

    // --- ROW 5: TABLE ---
    const isIntraState = !invoice.placeOfSupply || invoice.placeOfSupply.toLowerCase().includes('uttarakhand');
    
    const tableBody = invoice.items.map((item, i) => {
        const amt = item.amount;
        let cgst = '0.00', sgst = '0.00', igst = '0.00';
        if (isIntraState) {
            cgst = (amt * 0.09).toFixed(2);
            sgst = (amt * 0.09).toFixed(2);
        } else {
            igst = (amt * 0.18).toFixed(2);
        }
        return [
            i + 1,
            `${item.description}`,
            item.hsnSac,
            item.quantity,
            amt.toFixed(2),
            cgst,
            sgst,
            igst,
            '' // Remarks Column
        ];
    });

    autoTable(doc, {
        startY: currentY,
        head: [
            ['S.No.', 'Description', 'HSN\nCode', 'Qty.', 'Fees', 'CGST', 'SGST', 'IGST', 'Remarks'],
            ['', '', '', '', '', '9%', '9%', '18%', '']
        ],
        body: tableBody,
        theme: 'plain',
        styles: {
            lineColor: 0,
            lineWidth: 0.3,
            fontSize: 9,
            textColor: 0,
            valign: 'middle',
            cellPadding: 2
        },
        headStyles: {
            fontStyle: 'bold',
            halign: 'center',
            fillColor: 255,
            textColor: 0,
            lineWidth: 0.3,
            lineColor: 0
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 50 }, // Reduced width to fit Remarks
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 10, halign: 'center' },
            4: { cellWidth: 25, halign: 'right' },
            5: { cellWidth: 18, halign: 'right' },
            6: { cellWidth: 18, halign: 'right' },
            7: { cellWidth: 18, halign: 'right' },
            8: { cellWidth: 21, halign: 'center' } // New Remarks Column
        },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth
    });

    // @ts-ignore
    let finalY = doc.lastAutoTable.finalY;

    // --- ROW 6: TOTALS ---
    // Ensure space
    if (finalY + 60 > 290) {
        doc.addPage();
        finalY = margin;
    }

    const totalsY = finalY;
    const totalsHeight = 35;
    
    doc.rect(margin, totalsY, contentWidth, totalsHeight);

    const rightAlignX = width - margin - 2;
    const labelX = width - margin - 60;

    let ty = totalsY + 5;
    doc.setFontSize(9);
    
    doc.text('Total Amount Before Tax', labelX, ty, { align: 'right' });
    doc.text(invoice.subtotal.toFixed(2), rightAlignX, ty, { align: 'right' });
    
    ty += 5;
    doc.text('Total Amount : GST', labelX, ty, { align: 'right' });
    const totalTax = invoice.cgstAmount + invoice.sgstAmount + invoice.igstAmount;
    doc.text(totalTax.toFixed(2), rightAlignX, ty, { align: 'right' });
    
    ty += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Total Amount After Tax', labelX, ty, { align: 'right' });
    doc.text(invoice.amount.toFixed(2), rightAlignX, ty, { align: 'right' });

    // Amount in Words
    ty += 7;
    doc.text('Amount in Words = ', margin + 60, ty, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Rupees ${numberToWords(Math.round(invoice.amount))}`, margin + 62, ty);

    // Yellow Highlight Bar
    const barY = ty + 4;
    doc.setFillColor(255, 255, 0); // Yellow
    doc.rect(margin, barY, contentWidth, 8, 'F');
    doc.setDrawColor(0);
    doc.rect(margin, barY, contentWidth, 8); // Border
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount to be credited in Our Account Rs. ${Math.round(invoice.amount)}/-`, width / 2, barY + 5.5, { align: 'center' });

    currentY = barY + 8;

    // --- ROW 7: FOOTER ---
    const footerHeight = 45;
    doc.rect(margin, currentY, contentWidth, footerHeight);
    
    const footerSplit = margin + (contentWidth / 2);
    doc.line(footerSplit, currentY, footerSplit, currentY + footerHeight);

    // Footer Left
    let fy = currentY + 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Our Bank Details:', margin + 2, fy);
    
    fy += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(`Account in the name of ${bankDetails.accountName}`, margin + 2, fy);
    
    fy += 5;
    doc.text(`Bank A/C No. : ${bankDetails.accountNumber} / IFSC Code: ${bankDetails.ifscCode}`, margin + 2, fy);
    
    fy += 5;
    doc.text(`${bankDetails.bankName}, ${bankDetails.branchName}`, margin + 2, fy);

    fy += 3;
    doc.line(margin, fy, footerSplit, fy); // Divider line added here
    fy += 5;

    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', margin + 2, fy);
    
    fy += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('For Any quaries / issue regarding bill/work discuss', margin + 2, fy);
    fy += 4;
    doc.text('with in a week .', margin + 2, fy);

    // Footer Right
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Authorised Signatory
    doc.text(`For ${firm.firmName}`, width - margin - 2, currentY + 35, { align: 'right' });
    doc.text(firm.signatoryLabel || 'Authorised Signatory', width - margin - 2, currentY + 42, { align: 'right' });

    // Output
    if (mode === 'preview') {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`Invoice_${invoice.invoiceNo}.pdf`);
    }
};

// --- Default Firm Config ---
const DEFAULT_FIRM: FirmProfile = {
    firmName: 'AADITYA BUILDING SOLUTION',
    subTitle: 'CHARTERED ENGINEERS & GOVT. APPROVED VALUERS',
    proprietorName: 'Arpit Agarwal',
    address: 'H.O.- Punjabi Colony, Cheema Chauraha, Ward No- 19, Kashipur, U.S.Nagar, Uttarakhand - 244713',
    email: 'vr.arpitagarwal@gmail.com',
    phonePrimary: '9837179179',
    phoneSecondary: '9837179200',
    gstin: '05BWOPA3302G1Z2',
    bankName: 'State Bank of India', // Legacy
    accountName: 'Aaditya Building Solution', // Legacy
    accountNumber: '38095334533', // Legacy
    ifscCode: 'SBIN0018976', // Legacy
    branchName: 'Bazpur Road, Kashipur', // Legacy
    bankAccounts: [
        {
            id: 'default',
            bankName: 'State Bank of India',
            accountName: 'Aaditya Building Solution',
            accountNumber: '38095334533',
            ifscCode: 'SBIN0018976',
            branchName: 'Bazpur Road, Kashipur',
            isDefault: true
        }
    ],
    signatoryLabel: 'Authorised Signatory'
};

type Tab = 'dashboard' | 'income' | 'receipts' | 'expenses' | 'receivables' | 'settings';

// --- Sub-Modules ---

const InvoiceSettings = ({ firm, onSave }: { firm: FirmProfile, onSave: (f: FirmProfile) => void }) => {
    const [data, setData] = useState(firm);
    const [editingBankId, setEditingBankId] = useState<string | null>(null);
    const [tempBank, setTempBank] = useState<BankAccount>({
        id: '', bankName: '', accountName: '', accountNumber: '', ifscCode: '', branchName: '', isDefault: false
    });

    useEffect(() => {
        // Migration logic: If no bankAccounts but legacy fields exist, populate default
        if ((!data.bankAccounts || data.bankAccounts.length === 0) && data.bankName) {
            const legacyBank: BankAccount = {
                id: Date.now().toString(),
                bankName: data.bankName || '',
                accountName: data.accountName || '',
                accountNumber: data.accountNumber || '',
                ifscCode: data.ifscCode || '',
                branchName: data.branchName || '',
                isDefault: true
            };
            setData(prev => ({...prev, bankAccounts: [legacyBank]}));
        }
    }, []);

    const handleSaveBank = () => {
        if (!tempBank.bankName || !tempBank.accountNumber) return;
        
        let newAccounts = [...(data.bankAccounts || [])];
        if (editingBankId) {
            newAccounts = newAccounts.map(b => b.id === editingBankId ? tempBank : b);
        } else {
            newAccounts.push({ ...tempBank, id: Date.now().toString() });
        }

        // If this is the only account, make it default
        if (newAccounts.length === 1) newAccounts[0].isDefault = true;
        // If this is set to default, unset others
        if (tempBank.isDefault) {
            newAccounts = newAccounts.map(b => ({ ...b, isDefault: b.id === (editingBankId || newAccounts[newAccounts.length-1].id) }));
        }

        setData({ ...data, bankAccounts: newAccounts });
        setEditingBankId(null);
        setTempBank({ id: '', bankName: '', accountName: '', accountNumber: '', ifscCode: '', branchName: '', isDefault: false });
    };

    const handleEditBank = (bank: BankAccount) => {
        setTempBank(bank);
        setEditingBankId(bank.id);
    };

    const handleDeleteBank = (id: string) => {
        if (confirm('Remove this bank account?')) {
            const newAccounts = data.bankAccounts?.filter(b => b.id !== id) || [];
            if (newAccounts.length > 0 && !newAccounts.find(b => b.isDefault)) {
                newAccounts[0].isDefault = true;
            }
            setData({ ...data, bankAccounts: newAccounts });
        }
    };

    const handleSetDefault = (id: string) => {
        const newAccounts = data.bankAccounts?.map(b => ({ ...b, isDefault: b.id === id })) || [];
        setData({ ...data, bankAccounts: newAccounts });
    };

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl p-8 animate-fade-in space-y-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><Building size={20} /> Firm Profile & Billing Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-slate-400">Basic Info</h4>
                    <input placeholder="Firm Name" className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200" value={data.firmName} onChange={e => setData({...data, firmName: e.target.value})} />
                    <input placeholder="Sub Title (e.g. Chartered Engineers...)" className="w-full p-3 bg-slate-50 rounded-xl font-medium border border-slate-200" value={data.subTitle} onChange={e => setData({...data, subTitle: e.target.value})} />
                    <input placeholder="Proprietor Name" className="w-full p-3 bg-slate-50 rounded-xl font-medium border border-slate-200" value={data.proprietorName} onChange={e => setData({...data, proprietorName: e.target.value})} />
                    <textarea placeholder="Full Address" className="w-full p-3 bg-slate-50 rounded-xl font-medium border border-slate-200" rows={3} value={data.address} onChange={e => setData({...data, address: e.target.value})} />
                </div>
                <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-slate-400">Contact & Tax</h4>
                    <input placeholder="Email" className="w-full p-3 bg-slate-50 rounded-xl font-medium border border-slate-200" value={data.email} onChange={e => setData({...data, email: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input placeholder="Phone (Primary)" className="w-full p-3 bg-slate-50 rounded-xl font-medium border border-slate-200" value={data.phonePrimary} onChange={e => setData({...data, phonePrimary: e.target.value})} />
                        <input placeholder="Phone (Secondary)" className="w-full p-3 bg-slate-50 rounded-xl font-medium border border-slate-200" value={data.phoneSecondary} onChange={e => setData({...data, phoneSecondary: e.target.value})} />
                    </div>
                    <input placeholder="GSTIN" className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200" value={data.gstin} onChange={e => setData({...data, gstin: e.target.value})} />
                </div>
            </div>

            {/* Bank Accounts Section */}
            <div className="pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold uppercase text-slate-500 mb-4">Firm Bank Accounts</h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* List */}
                    <div className="space-y-3">
                        {data.bankAccounts?.map(bank => (
                            <div key={bank.id} className={`p-4 rounded-xl border transition-all ${bank.isDefault ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                            {bank.bankName}
                                            {bank.isDefault && <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Default</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">{bank.accountNumber} • {bank.ifscCode}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">{bank.branchName}</div>
                                    </div>
                                    <div className="flex gap-1">
                                        {!bank.isDefault && <button onClick={() => handleSetDefault(bank.id)} className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50" title="Set Default"><CheckCircle2 size={16} /></button>}
                                        <button onClick={() => handleEditBank(bank)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="Edit"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteBank(bank.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Delete"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={() => {
                                setEditingBankId(null);
                                setTempBank({ id: '', bankName: '', accountName: data.firmName, accountNumber: '', ifscCode: '', branchName: '', isDefault: false });
                            }}
                            className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-bold text-xs hover:border-indigo-200 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Add Another Account
                        </button>
                    </div>

                    {/* Editor */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <h5 className="font-bold text-slate-700 text-sm mb-4">{editingBankId ? 'Edit Bank Details' : 'New Bank Account'}</h5>
                        <div className="space-y-3">
                            <input placeholder="Bank Name" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={tempBank.bankName} onChange={e => setTempBank({...tempBank, bankName: e.target.value})} />
                            <input placeholder="Account Name" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium" value={tempBank.accountName} onChange={e => setTempBank({...tempBank, accountName: e.target.value})} />
                            <div className="grid grid-cols-2 gap-3">
                                <input placeholder="Account Number" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold" value={tempBank.accountNumber} onChange={e => setTempBank({...tempBank, accountNumber: e.target.value})} />
                                <input placeholder="IFSC Code" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-bold uppercase" value={tempBank.ifscCode} onChange={e => setTempBank({...tempBank, ifscCode: e.target.value})} />
                            </div>
                            <input placeholder="Branch Name" className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium" value={tempBank.branchName} onChange={e => setTempBank({...tempBank, branchName: e.target.value})} />
                            
                            <label className="flex items-center gap-2 text-sm text-slate-600 font-medium pt-2 cursor-pointer">
                                <input type="checkbox" checked={tempBank.isDefault} onChange={e => setTempBank({...tempBank, isDefault: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                Set as Default Account
                            </label>

                            <button onClick={handleSaveBank} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs mt-2 hover:bg-black transition-colors">
                                {editingBankId ? 'Update Account' : 'Add Account'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
                <button onClick={() => onSave(data)} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2">
                    <Save size={18} /> Save Complete Profile
                </button>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    let colorClass = 'bg-slate-100 text-slate-600';
    if (status === 'Paid') colorClass = 'bg-emerald-100 text-emerald-600';
    else if (status === 'Partially Paid') colorClass = 'bg-blue-100 text-blue-600';
    else if (status === 'Overdue') colorClass = 'bg-rose-100 text-rose-600';
    else if (status === 'Sent') colorClass = 'bg-amber-100 text-amber-600';
    
    return (
        <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${colorClass}`}>
            {status}
        </span>
    );
};

const ReceiptManager = () => {
    const { user } = useSite();
    const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<IncomeRecord>>({
        date: new Date().toISOString().split('T')[0],
        category: 'Consultation',
        description: '',
        amount: 0,
        paymentMode: 'Cash',
        source: ''
    });

    useEffect(() => {
        const q = query(collection(db, 'income_records'), orderBy('date', 'desc'), limit(100));
        const unsub = onSnapshot(q, {
            next: (snap) => {
                setIncomes(snap.docs.map(d => ({ id: d.id, ...d.data() } as IncomeRecord)));
                setLoading(false);
            },
            error: (err) => {
                console.error("Income fetch error:", err);
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.source) return;
        try {
            await addDoc(collection(db, 'income_records'), {
                ...formData,
                amount: Number(formData.amount),
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                category: 'Consultation',
                description: '',
                amount: 0,
                paymentMode: 'Cash',
                source: ''
            });
        } catch (err) {
            console.error("Add income error:", err);
            alert("Failed to add income record");
        }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete this receipt record?")) {
            await deleteDoc(doc(db, 'income_records', id));
        }
    };

    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-slate-900">Revenue Receipts</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Total: ₹{totalIncome.toLocaleString()}</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center gap-2">
                    {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'Record Income'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl animate-fade-in-up">
                    <h4 className="font-bold text-slate-900 mb-6">Record New Receipt</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Date</label>
                                <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Category</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                                    <option>Consultation</option><option>Valuation</option><option>Survey</option><option>Advance</option><option>Refund</option><option>Other</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Source / Payer</label>
                                <input required placeholder="Client Name or Bank" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm" value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Amount (₹)</label>
                                <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Payment Mode</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value as any})}>
                                    <option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Cheque</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Reference / Txn ID</label>
                                <input placeholder="Optional..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Description</label>
                            <input placeholder="Details..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-2 shadow-lg">Save Receipt</button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Source</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Mode</th>
                                <th className="px-4 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr> : 
                             incomes.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-sm">No receipts recorded.</td></tr> :
                             incomes.map(inc => (
                                <tr key={inc.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{inc.date}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-800 text-sm">{inc.source}</div>
                                        <div className="text-xs text-slate-400">{inc.description}</div>
                                    </td>
                                    <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">{inc.category}</span></td>
                                    <td className="px-6 py-4 text-right font-bold text-emerald-600">+₹{inc.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{inc.paymentMode}</td>
                                    <td className="px-4 py-4 text-right">
                                        <button onClick={() => handleDelete(inc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ExpenseManager = () => {
    const { user } = useSite();
    const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState<Partial<ExpenseRecord>>({
        date: new Date().toISOString().split('T')[0],
        category: 'Misc',
        description: '',
        amount: 0,
        paymentMode: 'Cash',
        status: 'Approved'
    });

    useEffect(() => {
        const q = query(collection(db, 'expenses'), orderBy('date', 'desc'), limit(100));
        const unsub = onSnapshot(q, {
            next: (snap) => {
                setExpenses(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExpenseRecord)));
                setLoading(false);
            },
            error: (err) => {
                console.error("Expense fetch error:", err);
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.description) return;
        try {
            await addDoc(collection(db, 'expenses'), {
                ...formData,
                amount: Number(formData.amount),
                createdAt: serverTimestamp(),
                employeeId: user?.uid,
                employeeName: user?.displayName || user?.email
            });
            setShowForm(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                category: 'Misc',
                description: '',
                amount: 0,
                paymentMode: 'Cash',
                status: 'Approved'
            });
        } catch (err) {
            console.error("Add expense error:", err);
            alert("Failed to add expense");
        }
    };

    const handleDelete = async (id: string) => {
        if(confirm("Delete this expense?")) {
            await deleteDoc(doc(db, 'expenses', id));
        }
    };

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <h3 className="text-xl font-black text-slate-900">Expense Tracker</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-1">Total: ₹{totalExpenses.toLocaleString()}</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex items-center gap-2">
                    {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? 'Cancel' : 'New Expense'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl animate-fade-in-up">
                    <h4 className="font-bold text-slate-900 mb-6">Record New Expense</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Date</label>
                                <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Category</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>
                                    <option>Salaries</option><option>Travel</option><option>Rent</option><option>Software</option><option>Printing</option><option>Misc</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Description</label>
                            <input required placeholder="Details..." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Amount (₹)</label>
                                <input type="number" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase text-slate-400 mb-1 block">Payment Mode</label>
                                <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value as any})}>
                                    <option>Cash</option><option>UPI</option><option>Bank</option><option>Card</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold mt-2 shadow-lg">Save Record</button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Description</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Mode</th>
                                <th className="px-4 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? <tr><td colSpan={6} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></td></tr> : 
                             expenses.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-sm">No expenses recorded.</td></tr> :
                             expenses.map(exp => (
                                <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{exp.date}</td>
                                    <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">{exp.category}</span></td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{exp.description}</td>
                                    <td className="px-6 py-4 text-right font-bold text-rose-600">-₹{exp.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-500">{exp.paymentMode}</td>
                                    <td className="px-4 py-4 text-right">
                                        <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const InvoiceManager = ({ invoices, firm }: { invoices: InvoiceRecord[], firm: FirmProfile }) => {
  const { user } = useSite();
  const [view, setView] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [isRecordPayOpen, setIsRecordPayOpen] = useState(false);
  
  // Payment Form
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  
  // Create Invoice Form State
  const [newInvoice, setNewInvoice] = useState<Partial<InvoiceRecord>>({
      invoiceNo: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15*24*60*60*1000).toISOString().split('T')[0],
      billingToBankName: 'Bank of Baroda',
      billingToBranch: 'Branch - Bazpur',
      billingToDistrict: 'Distt - U.S.Nagar',
      billingToState: 'Uttarakhand',
      branchCaseDetails: 'BOB - Bazpur',
      propertyAddress: '',
      clientName: '',
      clientOwnerName: '',
      clientGstin: '',
      clientMobile: '',
      clientState: 'Uttarakhand',
      items: [{ id: '1', description: 'Engineering consultancy', hsnSac: '998322', quantity: 1, rate: 0, amount: 0 }],
      status: 'Draft',
      termsAndConditions: 'For Any queries / issue regarding bill/work discuss with in a week .'
  });

  // Initialize firmBankDetails with default
  useEffect(() => {
      if (view === 'create' && !newInvoice.firmBankDetails && firm.bankAccounts) {
          const defaultBank = firm.bankAccounts.find(b => b.isDefault) || firm.bankAccounts[0];
          if (defaultBank) {
              setNewInvoice(prev => ({ ...prev, firmBankDetails: defaultBank }));
          }
      }
  }, [view, firm]);

  useEffect(() => {
      if (view === 'create' && invoices.length > 0 && !newInvoice.invoiceNo) {
          const maxNum = invoices.reduce((max, inv) => {
              const num = parseInt(inv.invoiceNo) || 0;
              return num > max ? num : max;
          }, 0);
          setNewInvoice(prev => ({ ...prev, invoiceNo: (maxNum + 1).toString() }));
      }
  }, [view, invoices]);

  const totals = useMemo(() => {
      if (!newInvoice.items) return { sub: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
      
      const subtotal = newInvoice.items.reduce((sum, item) => sum + (item.rate * item.quantity), 0);
      const isInterState = newInvoice.clientState?.trim().toLowerCase() !== 'uttarakhand'; // Hardcoded firm state logic for simplicity
      
      let cgst = 0, sgst = 0, igst = 0;
      
      if (isInterState) {
          igst = subtotal * 0.18;
      } else {
          cgst = subtotal * 0.09;
          sgst = subtotal * 0.09;
      }
      
      return { 
          sub: subtotal, 
          cgst, sgst, igst, 
          total: subtotal + cgst + sgst + igst 
      };
  }, [newInvoice.items, newInvoice.clientState]);

  const handleAddItem = () => {
      const newItem: InvoiceItem = { id: Date.now().toString(), description: '', hsnSac: '998322', quantity: 1, rate: 0, amount: 0 };
      setNewInvoice(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const handleRemoveItem = (id: string) => {
      setNewInvoice(prev => ({ ...prev, items: prev.items?.filter(i => i.id !== id) }));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
      setNewInvoice(prev => {
          const items = [...(prev.items || [])];
          const idx = items.findIndex(i => i.id === id);
          if (idx > -1) {
              // @ts-ignore
              items[idx][field] = value;
              
              if (field === 'quantity' || field === 'rate') {
                  items[idx].amount = items[idx].quantity * items[idx].rate;
              } else if (field === 'amount') {
                  // If amount is changed, recalculate rate
                  items[idx].rate = items[idx].quantity > 0 ? value / items[idx].quantity : 0;
              }
          }
          return { ...prev, items };
      });
  };

  const saveInvoice = async () => {
      if (!user || !newInvoice.clientName) return;
      try {
          const payload: any = {
              ...newInvoice,
              userId: user.uid,
              subtotal: totals.sub,
              taxType: (newInvoice.clientState?.trim().toLowerCase() !== 'uttarakhand') ? 'IGST' : 'CGST_SGST',
              cgstAmount: totals.cgst,
              sgstAmount: totals.sgst,
              igstAmount: totals.igst,
              amount: totals.total,
              balance: totals.total,
              received: 0,
              payments: [],
              placeOfSupply: newInvoice.clientState,
              createdAt: serverTimestamp()
          };
          
          await addDoc(collection(db, 'invoices'), payload);
          setView('list');
          setNewInvoice({ 
              invoiceNo: (parseInt(newInvoice.invoiceNo || '0') + 1).toString(),
              clientName: '', 
              items: [{ id: Date.now().toString(), description: 'Engineering consultancy', hsnSac: '998322', quantity: 1, rate: 0, amount: 0 }], 
              status: 'Draft',
              termsAndConditions: newInvoice.termsAndConditions,
              firmBankDetails: newInvoice.firmBankDetails // Keep selected bank
          }); 
      } catch (err) {
          console.error(err);
          alert("Failed to create invoice");
      }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amount = parseFloat(payAmount);
    const newReceived = (selectedInvoice.received || 0) + amount;
    const newBalance = selectedInvoice.amount - newReceived;
    
    let newStatus: InvoiceRecord['status'] = newBalance <= 1 ? 'Paid' : 'Partially Paid';
    
    const payment: PaymentRecord = {
      amount,
      date: new Date().toISOString(),
      mode: payMode as any,
      reference: payRef
    };

    try {
      await updateDoc(doc(db, 'invoices', selectedInvoice.id), {
        received: newReceived,
        balance: newBalance,
        status: newStatus,
        payments: [...(selectedInvoice.payments || []), payment]
      });
      setIsRecordPayOpen(false);
      setPayAmount(''); setPayRef('');
    } catch (err) {
      alert("Failed to record payment");
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const duplicateInvoice = (inv: InvoiceRecord) => {
      setNewInvoice({
          ...inv,
          invoiceNo: (parseInt(invoices[0]?.invoiceNo || '0') + 1).toString(), // Suggest next number
          invoiceDate: new Date().toISOString().split('T')[0],
          status: 'Draft',
          received: 0,
          balance: inv.amount,
          payments: [],
          firmBankDetails: inv.firmBankDetails || firm.bankAccounts?.[0] // Prefer existing, fallback to default
      });
      setView('create');
  };

  if (view === 'create') {
      return (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-fade-in">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setView('list')} className="p-2 hover:bg-white rounded-full transition-colors"><ArrowLeft size={20} /></button>
                      <h3 className="text-xl font-black text-slate-900">New Tax Invoice</h3>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={saveInvoice} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2">
                          <CheckCircle2 size={18} /> Save & Issue
                      </button>
                  </div>
              </div>
              
              <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column */}
                  <div className="space-y-6 lg:col-span-1">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"><Building size={14}/> Addressee (Bank/Branch)</h4>
                          <input placeholder="Bank Name" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none" value={newInvoice.billingToBankName} onChange={e => setNewInvoice({...newInvoice, billingToBankName: e.target.value})} />
                          <input placeholder="Branch" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm" value={newInvoice.billingToBranch} onChange={e => setNewInvoice({...newInvoice, billingToBranch: e.target.value})} />
                          <div className="grid grid-cols-2 gap-4">
                              <input placeholder="District" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm" value={newInvoice.billingToDistrict} onChange={e => setNewInvoice({...newInvoice, billingToDistrict: e.target.value})} />
                              <input placeholder="State" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm" value={newInvoice.billingToState} onChange={e => setNewInvoice({...newInvoice, billingToState: e.target.value})} />
                          </div>
                      </div>

                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"><FileText size={14}/> Case Details</h4>
                          <input placeholder="Branch Case Details (e.g. BOB - Bazpur)" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={newInvoice.branchCaseDetails} onChange={e => setNewInvoice({...newInvoice, branchCaseDetails: e.target.value})} />
                      </div>

                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest flex items-center gap-2"><Calendar size={14}/> Invoice Meta</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Invoice No</label>
                                  <input className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={newInvoice.invoiceNo} onChange={e => setNewInvoice({...newInvoice, invoiceNo: e.target.value})} />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                                  <input type="date" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm" value={newInvoice.invoiceDate} onChange={e => setNewInvoice({...newInvoice, invoiceDate: e.target.value})} />
                              </div>
                          </div>
                          
                          {/* Our Bank Selection */}
                          <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Credit To (Our Bank)</label>
                              <select 
                                  className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-sm"
                                  value={newInvoice.firmBankDetails?.id || ''}
                                  onChange={(e) => {
                                      const selected = firm.bankAccounts?.find(b => b.id === e.target.value);
                                      if (selected) setNewInvoice({...newInvoice, firmBankDetails: selected});
                                  }}
                              >
                                  {firm.bankAccounts?.map(b => (
                                      <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber.slice(-4)}</option>
                                  ))}
                              </select>
                          </div>
                      </div>
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-2"><User size={14}/> Client / Borrower Details</h4>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                              <input placeholder="Account Name (e.g. M/S Uma Shakti...)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm" value={newInvoice.clientName} onChange={e => setNewInvoice({...newInvoice, clientName: e.target.value})} />
                              <input placeholder="Owner Name (Prop/Director)" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm" value={newInvoice.clientOwnerName} onChange={e => setNewInvoice({...newInvoice, clientOwnerName: e.target.value})} />
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                              <input placeholder="GSTIN No." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm uppercase" value={newInvoice.clientGstin} onChange={e => setNewInvoice({...newInvoice, clientGstin: e.target.value})} />
                              <input placeholder="Mobile No." className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm" value={newInvoice.clientMobile} onChange={e => setNewInvoice({...newInvoice, clientMobile: e.target.value})} />
                              <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm" value={newInvoice.clientState} onChange={e => setNewInvoice({...newInvoice, clientState: e.target.value})}>
                                  <option>Uttarakhand</option>
                                  <option>Uttar Pradesh</option>
                                  <option>Delhi</option>
                                  <option>Other</option>
                              </select>
                          </div>
                      </div>

                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                          <table className="w-full text-left">
                              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                                  <tr>
                                      <th className="px-4 py-3">Description</th>
                                      <th className="px-4 py-3 w-24">HSN/SAC</th>
                                      <th className="px-4 py-3 w-20 text-center">Qty</th>
                                      <th className="px-4 py-3 w-32 text-right">Rate</th>
                                      <th className="px-4 py-3 w-32 text-right">Amount</th>
                                      <th className="px-2 py-3 w-10"></th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                  {newInvoice.items?.map((item, idx) => (
                                      <tr key={item.id}>
                                          <td className="p-2">
                                              <input className="w-full bg-transparent outline-none font-medium text-sm" value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} placeholder="Service description" />
                                          </td>
                                          <td className="p-2"><input className="w-full bg-transparent outline-none text-sm text-slate-500" value={item.hsnSac} onChange={e => handleItemChange(item.id, 'hsnSac', e.target.value)} /></td>
                                          <td className="p-2"><input type="number" className="w-full bg-transparent outline-none text-sm text-center font-bold" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value))} /></td>
                                          <td className="p-2"><input type="number" className="w-full bg-transparent outline-none text-sm text-right font-bold" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value))} /></td>
                                          <td className="p-2">
                                              <input 
                                                  type="number" 
                                                  className="w-full bg-transparent outline-none text-sm text-right font-bold" 
                                                  value={item.amount} 
                                                  onChange={e => handleItemChange(item.id, 'amount', parseFloat(e.target.value))} 
                                              />
                                          </td>
                                          <td className="p-2 text-center"><button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600"><X size={16} /></button></td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                          <button onClick={handleAddItem} className="w-full py-3 text-center text-xs font-bold uppercase text-slate-500 hover:bg-slate-50 transition-colors border-t border-slate-200">+ Add Line Item</button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-xs font-bold uppercase text-slate-400">Terms & Conditions</label>
                              <textarea 
                                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" 
                                  rows={4} 
                                  value={newInvoice.termsAndConditions} 
                                  onChange={e => setNewInvoice({...newInvoice, termsAndConditions: e.target.value})}
                              />
                          </div>
                          
                          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                              <div className="flex justify-between text-sm text-slate-600"><span>Subtotal</span><span className="font-bold">₹{totals.sub.toLocaleString()}</span></div>
                              {totals.igst > 0 ? (
                                  <div className="flex justify-between text-sm text-slate-600"><span>IGST (18%)</span><span className="font-bold">₹{totals.igst.toLocaleString()}</span></div>
                              ) : (
                                  <>
                                      <div className="flex justify-between text-sm text-slate-600"><span>CGST (9%)</span><span className="font-bold">₹{totals.cgst.toLocaleString()}</span></div>
                                      <div className="flex justify-between text-sm text-slate-600"><span>SGST (9%)</span><span className="font-bold">₹{totals.sgst.toLocaleString()}</span></div>
                                  </>
                              )}
                              <div className="pt-3 border-t border-slate-200 flex justify-between text-lg font-black text-slate-900">
                                  <span>Total</span>
                                  <span>₹{totals.total.toLocaleString()}</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            placeholder="Search invoice or client..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-sm font-bold border border-slate-200 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
            <div className="text-right hidden md:block mr-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</div>
                <div className="text-lg font-black text-slate-900">₹{invoices.reduce((a, b) => a + b.amount, 0).toLocaleString()}</div>
            </div>
            <button onClick={() => setView('create')} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2">
                <Plus size={18} /> New Invoice
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Invoice</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Client / Bank</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-slate-900">#{inv.invoiceNo}</td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-500">{inv.invoiceDate}</td>
                  <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 text-sm">{inv.clientName}</div>
                      <div className="text-xs text-slate-500">{inv.billingToBankName}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-slate-900">₹{inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-bold text-rose-500">₹{(inv.balance ?? inv.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center"><StatusBadge status={inv.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                        <button onClick={() => duplicateInvoice(inv)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Duplicate"><Copy size={16}/></button>
                        <button 
                            onClick={() => generateInvoicePDF(inv, firm, 'preview')} 
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Preview Invoice"
                        >
                            <Eye size={16} />
                        </button>
                        <button 
                            onClick={() => generateInvoicePDF(inv, firm, 'download')}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Download PDF"
                        >
                            <Printer size={16} />
                        </button>
                        {inv.status !== 'Paid' && (
                        <button 
                            onClick={() => { setSelectedInvoice(inv); setIsRecordPayOpen(true); }}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                        >
                            Pay
                        </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isRecordPayOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
            <h3 className="text-xl font-black mb-1">Record Payment</h3>
            <p className="text-sm text-slate-500 mb-6">For Invoice #{selectedInvoice.invoiceNo} • Balance: ₹{(selectedInvoice.balance ?? selectedInvoice.amount).toLocaleString()}</p>
            
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-400">Amount Received</label>
                <input 
                  type="number" required max={selectedInvoice.balance ?? selectedInvoice.amount}
                  className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 mt-1"
                  value={payAmount} onChange={e => setPayAmount(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400">Mode</label>
                    <select className="w-full p-3 bg-slate-50 rounded-xl font-bold border border-slate-200 mt-1" value={payMode} onChange={e => setPayMode(e.target.value)}>
                        <option>UPI</option><option>Cash</option><option>Cheque</option><option>NEFT/RTGS</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-400">Reference</label>
                    <input className="w-full p-3 bg-slate-50 rounded-xl font-medium border border-slate-200 mt-1" placeholder="Ref No." value={payRef} onChange={e => setPayRef(e.target.value)} />
                  </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsRecordPayOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-200">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const FinanceModule = () => {
  const [activeTab, setActiveTab] = useState<Tab>('income');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [firmProfile, setFirmProfile] = useState<FirmProfile>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('abs_firm_profile');
        return saved ? JSON.parse(saved) : DEFAULT_FIRM;
    }
    return DEFAULT_FIRM;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Permission-safe query: order by createdAt requires an index, which might be missing.
    // If permission denied or index missing, we fallback to client-side sort if needed.
    // However, AdminPanel usually has index.
    const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'), limit(200));
    const unsub = onSnapshot(q, {
      next: (snap) => {
        const invs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvoiceRecord));
        setInvoices(invs);
        setLoading(false);
      },
      error: (err) => {
        console.error("FinanceModule Error:", err);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveFirm = (newProfile: FirmProfile) => {
    setFirmProfile(newProfile);
    localStorage.setItem('abs_firm_profile', JSON.stringify(newProfile));
    alert("Configuration Saved Locally");
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-slate-400" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button 
          onClick={() => setActiveTab('income')} 
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'income' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
        >
          <Wallet size={18} /> Invoices
        </button>
        <button 
          onClick={() => setActiveTab('receipts')} 
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'receipts' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
        >
          <ArrowUpRight size={18} /> Receipts
        </button>
        <button 
          onClick={() => setActiveTab('expenses')} 
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'expenses' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
        >
          <Receipt size={18} /> Expenses
        </button>
        <button 
          onClick={() => setActiveTab('settings')} 
          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'settings' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
        >
          <Settings size={18} /> Configuration
        </button>
      </div>

      {activeTab === 'income' && <InvoiceManager invoices={invoices} firm={firmProfile} />}
      {activeTab === 'receipts' && <ReceiptManager />}
      {activeTab === 'expenses' && <ExpenseManager />}
      {activeTab === 'settings' && <InvoiceSettings firm={firmProfile} onSave={handleSaveFirm} />}
    </div>
  );
};

export default FinanceModule;
