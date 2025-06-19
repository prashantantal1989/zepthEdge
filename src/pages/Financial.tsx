import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Plus, Filter, Search, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import * as XLSX from 'xlsx';
import { UploadModal } from '../components/financial/UploadModal';
import { ReportTable } from '../components/financial/ReportTable'; 
import { loadFinancialReports, uploadFinancialReport, FinancialReport } from '../utils/financialReports';

type ReportType = 'daily' | 'weekly' | 'monthly';

interface TabData {
  value: ReportType;
  label: string;
}

const tabs: TabData[] = [
  { value: 'daily', label: 'Daily Reports' },
  { value: 'weekly', label: 'Weekly Reports' },
  { value: 'monthly', label: 'Monthly Reports' }
];

const Financial = () => {
  const { id } = useParams();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReportType>('daily');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<FinancialReport[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      try {
        const data = await loadFinancialReports(id || '', activeTab);
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReports();
    }
  }, [id, activeTab]);

  const handleExport = () => {
    if (!reports.length) return;
    
    const worksheet = XLSX.utils.json_to_sheet(reports.map(report => report.data).flat());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `${activeTab}_report_export.xlsx`);
  };

  const handleFileUpload = useCallback(async (file: File, type: ReportType, date: string) => {
    if (!file) return;

    setLoading(true);
    const fileData = await file.arrayBuffer();
    const workbook = XLSX.read(fileData);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    try {
      const report = await uploadFinancialReport(id || '', type, date, jsonData);
      if (report) {
        setReports(prev => [...jsonData, ...prev]);
      }
    } catch (error) {
      console.error('Error uploading report:', error);
    }

    setLoading(false);
  }, []);


  return (
    <div className="px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-pastel-dusty">Financial Reports</h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
        >
          <Plus size={16} />
          <span>New Report</span>
        </button>
      </div>
      
      {/* Tabs and Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
        <div className="p-4 border-b border-pastel-pink border-opacity-20">
          <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as ReportType)}>
            <Tabs.List className="flex space-x-4 border-b border-pastel-pink border-opacity-20">
              {tabs.map(tab => (
                <Tabs.Trigger
                  key={tab.value}
                  value={tab.value}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.value
                      ? 'border-pastel-mauve text-pastel-mauve'
                      : 'border-transparent text-pastel-gray hover:text-pastel-dusty hover:border-pastel-pink'
                  }`}
                >
                  {tab.label}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>
        </div>

        <div className="p-6">
          <ReportTable
            data={reports.map(report => report.data).flat()}
            onExport={handleExport}
          />
        </div>
      </div>
      
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleFileUpload}
      />
    </div>
  );
};

export default Financial;