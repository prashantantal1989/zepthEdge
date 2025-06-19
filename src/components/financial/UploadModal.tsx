import { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ReportType = 'daily' | 'weekly' | 'monthly';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, type: ReportType, date: string) => void;
}

export const UploadModal = ({ isOpen, onClose, onUpload }: UploadModalProps) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('daily');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;

    const dateString = selectedReportType === 'monthly' 
      ? `${selectedYear}-${selectedMonth}-01`
      : selectedDate;

    onUpload(selectedFile, selectedReportType, dateString);
    onClose();
    
    // Reset form
    setSelectedFile(null);
    setSelectedDate('');
    setSelectedMonth('');
    setSelectedReportType('daily');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b border-pastel-pink border-opacity-20">
                <h2 className="text-xl font-semibold text-pastel-dusty">Upload Financial Report</h2>
                <button
                  onClick={onClose}
                  className="p-2 text-pastel-gray hover:text-pastel-dusty rounded-lg hover:bg-pastel-peach hover:bg-opacity-10"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-pastel-gray mb-1">
                    Report Type
                  </label>
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
                    className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                  >
                    <option value="daily">Daily Report</option>
                    <option value="weekly">Weekly Report</option>
                    <option value="monthly">Monthly Report</option>
                  </select>
                </div>

                {selectedReportType === 'daily' && (
                  <div>
                    <label className="block text-sm font-medium text-pastel-gray mb-1">
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                    />
                  </div>
                )}

                {selectedReportType === 'weekly' && (
                  <div>
                    <label className="block text-sm font-medium text-pastel-gray mb-1">
                      Select Week
                    </label>
                    <input
                      type="week"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                    />
                  </div>
                )}

                {selectedReportType === 'monthly' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-pastel-gray mb-1">
                        Month
                      </label>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                      >
                        <option value="">Select</option>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = (i + 1).toString().padStart(2, '0');
                          return (
                            <option key={month} value={month}>
                              {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-pastel-gray mb-1">
                        Year
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve"
                      >
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = (new Date().getFullYear() - 2 + i).toString();
                          return (
                            <option key={year} value={year}>{year}</option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    id="modal-file-upload"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="modal-file-upload"
                    className="block w-full cursor-pointer"
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className={`p-8 border-2 ${
                      dragActive 
                        ? 'border-pastel-mauve bg-pastel-peach bg-opacity-5' 
                        : 'border-pastel-pink border-opacity-20'
                    } border-dashed rounded-lg text-center transition-all duration-200 ${
                      !selectedFile && 'hover:border-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-5'
                    }`}>
                      <Upload 
                        size={32} 
                        className={`mx-auto mb-3 ${
                          dragActive ? 'text-pastel-mauve' : 'text-pastel-gray'
                        }`} 
                      />
                      <div className="text-sm text-pastel-gray">
                        <span className="text-pastel-mauve font-medium">Click to upload</span>
                        <span className="px-1">or drag and drop</span>
                      </div>
                      <p className="text-xs text-pastel-gray mt-2">
                        Excel or CSV files up to 10MB
                      </p>
                      {selectedFile && (
                        <div className="mt-4 p-3 bg-pastel-peach bg-opacity-5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Upload size={16} className="text-pastel-mauve mr-2" />
                              <span className="text-sm font-medium text-pastel-dusty">
                                {selectedFile.name}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedFile(null);
                              }}
                              className="p-1 text-pastel-gray hover:text-red-500"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <p className="text-xs text-pastel-gray mt-1">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-6 border-t border-pastel-pink border-opacity-20">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-pastel-gray hover:text-pastel-dusty rounded-lg hover:bg-pastel-peach hover:bg-opacity-10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selectedFile || (!selectedDate && selectedReportType !== 'monthly') || (selectedReportType === 'monthly' && !selectedMonth)}
                  className="px-4 py-2 bg-pastel-mauve text-white rounded-lg hover:bg-pastel-dusty transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Report
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};