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
        
        <div className="flex items-center gap-4">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <span className="inline-block px-6 py-3 bg-blue-50 text-blue-700 font-semibold text-base rounded-md hover:bg-blue-100 transition-colors">
              Choose File
            </span>
          </label>
          
          <div className="flex-1">
            {loading && <p className="text-base text-blue-600 font-medium">Processing...</p>}
            {file && !loading && <p className="text-base text-green-600 font-medium">✓ {file.name}</p>}
            {!file && !loading && <p className="text-base text-gray-500">No file selected</p>}
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
                        {invoice.priority_score.toFixed(0)}
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