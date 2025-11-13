'use client';

import { useState } from 'react';

interface Invoice {
  id: number;
  customer: string;
  amount: number;
  days_overdue: number;
  priority_score: number;
  segment: string;
}

interface DraftEmail {
  subject: string;
  body: string;
  tone: string;
  tone_rationale: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [draftEmail, setDraftEmail] = useState<DraftEmail | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch('http://localhost:8000/ar/priority', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process file');

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error processing file. Make sure backend is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setLoadingDraft(true);
    setDraftEmail(null);

    try {
      const response = await fetch('http://localhost:8000/ar/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: invoice.customer,
          amount_due: invoice.amount,
          days_overdue: invoice.days_overdue,
          segment: invoice.segment,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate draft');

      const data = await response.json();
      setDraftEmail(data);
    } catch (error) {
      console.error('Error generating draft:', error);
      alert('Error generating email draft. Check backend connection.');
    } finally {
      setLoadingDraft(false);
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 7) return 'bg-red-100 text-red-800';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const totalOverdue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const avgDaysOverdue = invoices.length > 0
    ? Math.round(invoices.reduce((sum, inv) => sum + inv.days_overdue, 0) / invoices.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Total Overdue</p>
          <p className="text-3xl font-bold text-gray-900">${totalOverdue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Invoices</p>
          <p className="text-3xl font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">Avg Days Overdue</p>
          <p className="text-3xl font-bold text-gray-900">{avgDaysOverdue}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Invoices CSV</h2>
        
        <div className="space-y-4">
          {/* Botón de datos de ejemplo */}
          <div>
            <button
              onClick={() => {
                const sampleData = [
                  { id: 1, customer: "Premier Construction Group", amount: 187500, days_overdue: 118, priority_score: 846.5, segment: "Enterprise" },
                  { id: 2, customer: "National Food Distributors", amount: 168000, days_overdue: 108, priority_score: 753.2, segment: "Enterprise" },
                  { id: 3, customer: "Southern Metal Works", amount: 215000, days_overdue: 94, priority_score: 731.8, segment: "Enterprise" },
                  { id: 4, customer: "Metro Super Markets", amount: 18500, days_overdue: 78, priority_score: 52.1, segment: "SMB" },
                  { id: 5, customer: "Global Tech Industries", amount: 152000, days_overdue: 113, priority_score: 761.4, segment: "Enterprise" },
                  { id: 6, customer: "LogiTech Solutions", amount: 22000, days_overdue: 53, priority_score: 47.3, segment: "Startup" },
                  { id: 7, customer: "Rosewood Hotels Inc", amount: 98000, days_overdue: 71, priority_score: 271.6, segment: "Enterprise" },
                  { id: 8, customer: "StartupHub Inc", amount: 45000, days_overdue: 67, priority_score: 126.8, segment: "Startup" },
                  { id: 9, customer: "Coffee Plus International", amount: 5600, days_overdue: 27, priority_score: 5.8, segment: "SMB" },
                  { id: 10, customer: "Downtown Food Plaza", amount: 8200, days_overdue: 58, priority_score: 17.5, segment: "SMB" },
                  { id: 11, customer: "Artisan Bakery Supply", amount: 3400, days_overdue: 36, priority_score: 4.8, segment: "SMB" },
                  { id: 12, customer: "EduTech Partners", amount: 38000, days_overdue: 63, priority_score: 100.4, segment: "Startup" },
                  { id: 13, customer: "Auto Parts Warehouse", amount: 12700, days_overdue: 43, priority_score: 22.7, segment: "SMB" },
                  { id: 14, customer: "PharmaCare Suppliers", amount: 125000, days_overdue: 87, priority_score: 486.2, segment: "Enterprise" },
                  { id: 15, customer: "Grand Plaza Hotels", amount: 91000, days_overdue: 98, priority_score: 368.7, segment: "Enterprise" }
                ];
                setInvoices(sampleData);
                setFile(null);
              }}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              🚀 Try with Sample Data (Click Here!)
            </button>
            <p className="mt-2 text-sm text-gray-600 text-center">
              No CSV needed - see how it works instantly with 15 realistic invoices
            </p>
          </div>

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or upload your own CSV</span>
            </div>
          </div>

          {/* Upload CSV */}
          <div>
            <label className="block">
              <span className="sr-only">Choose file</span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="block w-full text-base text-gray-900 file:mr-4 file:py-3 file:px-6 file:rounded-md file:border-0 file:text-base file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
              />
            </label>
            {loading && <p className="mt-3 text-base text-blue-600 font-medium">Processing...</p>}
            {file && !loading && <p className="mt-3 text-base text-green-600 font-medium">✓ {file.name}</p>}
            
            {/* Formato CSV */}
            <details className="mt-3">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                CSV format required (click to see example)
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
{`customer,amount,days_past_due,segment
Acme Corp,150000,113,Enterprise
TechStart Inc,25000,45,SMB
Startup XYZ,12000,30,Startup`}
              </pre>
            </details>
          </div>
        </div>
      </div>