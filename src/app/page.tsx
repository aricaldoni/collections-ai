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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', uploadedFile);

    try {
      const response = await fetch(`${API_URL}/ar/priority`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to process file');

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error processing file. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = async (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setLoadingDraft(true);
    setDraftEmail(null);

    try {
      const response = await fetch(`${API_URL}/ar/draft`, {
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

  const loadSampleData = () => {
    const sampleData = [
      { id: 1, customer: "Premier Construction Group", amount: 187500, days_overdue: 118, priority_score: 846, segment: "Enterprise" },
      { id: 2, customer: "National Food Distributors", amount: 168000, days_overdue: 108, priority_score: 753, segment: "Enterprise" },
      { id: 3, customer: "Southern Metal Works", amount: 215000, days_overdue: 94, priority_score: 732, segment: "Enterprise" },
      { id: 4, customer: "Metro Super Markets", amount: 18500, days_overdue: 78, priority_score: 52, segment: "SMB" },
      { id: 5, customer: "Global Tech Industries", amount: 152000, days_overdue: 113, priority_score: 761, segment: "Enterprise" },
      { id: 6, customer: "LogiTech Solutions", amount: 22000, days_overdue: 53, priority_score: 47, segment: "Startup" },
      { id: 7, customer: "Rosewood Hotels Inc", amount: 98000, days_overdue: 71, priority_score: 272, segment: "Enterprise" },
      { id: 8, customer: "StartupHub Inc", amount: 45000, days_overdue: 67, priority_score: 127, segment: "Startup" },
      { id: 9, customer: "Coffee Plus International", amount: 5600, days_overdue: 27, priority_score: 6, segment: "SMB" },
      { id: 10, customer: "Downtown Food Plaza", amount: 8200, days_overdue: 58, priority_score: 18, segment: "SMB" },
      { id: 11, customer: "Artisan Bakery Supply", amount: 3400, days_overdue: 36, priority_score: 5, segment: "SMB" },
      { id: 12, customer: "EduTech Partners", amount: 38000, days_overdue: 63, priority_score: 100, segment: "Startup" },
      { id: 13, customer: "Auto Parts Warehouse", amount: 12700, days_overdue: 43, priority_score: 23, segment: "SMB" },
      { id: 14, customer: "PharmaCare Suppliers", amount: 125000, days_overdue: 87, priority_score: 486, segment: "Enterprise" },
      { id: 15, customer: "Grand Plaza Hotels", amount: 91000, days_overdue: 98, priority_score: 369, segment: "Enterprise" }
    ];
    setInvoices(sampleData);
    setFile(null);
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
          <div>
            <button
              onClick={loadSampleData}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-lg rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              🚀 Try with Sample Data (Click Here!)
            </button>
            <p className="mt-2 text-sm text-gray-600 text-center">
              No CSV needed - see how it works instantly with 15 realistic invoices
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or upload your own CSV</span>
            </div>
          </div>

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

      {invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Priority-Ranked Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Days Overdue</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Segment</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-900">{invoice.customer}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">${invoice.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">{invoice.days_overdue} days</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-sm font-bold text-gray-900 bg-gray-100 rounded">
                        {invoice.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getPriorityColor(invoice.priority_score)}`}>
                        {invoice.priority_score}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleRowClick(invoice)}
                        className="text-base text-blue-600 hover:text-blue-800 font-bold"
                      >
                        Draft Email
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">AI Draft - {selectedInvoice.customer}</h2>
              <button
                onClick={() => {
                  setSelectedInvoice(null);
                  setDraftEmail(null);
                }}
                className="text-gray-600 hover:text-gray-900 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-base text-gray-900 font-semibold">Customer: {selectedInvoice.customer}</p>
                <p className="text-base text-gray-900 font-semibold">Segment: <span className="font-bold">{selectedInvoice.segment}</span></p>
                <p className="text-base text-gray-900 font-semibold">Amount: ${selectedInvoice.amount.toLocaleString()}</p>
                <p className="text-base text-gray-900 font-semibold">Days Overdue: {selectedInvoice.days_overdue}</p>
              </div>

              {loadingDraft && (
                <div className="text-center py-8">
                  <p className="text-base text-gray-900 font-medium">Generating email with AI...</p>
                </div>
              )}

              {draftEmail && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm font-bold text-blue-900 mb-2">Subject:</p>
                    <p className="text-base text-blue-900 font-medium">{draftEmail.subject}</p>
                  </div>

                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-sm font-bold text-gray-900 mb-2">Tone: {draftEmail.tone}</p>
                    <p className="text-sm text-gray-700 italic">{draftEmail.tone_rationale}</p>
                  </div>

                  <div className="border rounded p-4">
                    <p className="text-sm font-bold text-gray-900 mb-3">Email Body:</p>
                    <div className="whitespace-pre-wrap text-base text-gray-900 leading-relaxed">{draftEmail.body}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}