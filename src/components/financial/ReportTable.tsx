import { useState } from 'react';
import { 
  ArrowUpDown, ChevronDown, Download, Filter,
  ArrowUp, ArrowDown, Search, Eye, MoreHorizontal
} from 'lucide-react';
import Tooltip from '../ui/Tooltip';
import { motion } from 'framer-motion';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  format?: (value: any) => string;
}

interface ReportTableProps {
  data: any[];
  onExport: () => void;
}

export const ReportTable = ({ data, onExport }: ReportTableProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(Object.keys(data[0] || {}))
  );

  // Generate columns from the first data item
  const columns: Column[] = Object.keys(data[0] || {}).map(key => ({
    key,
    label: key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    sortable: true,
    format: (value: any) => {
      if (typeof value === 'number') {
        // Format numbers with commas and 2 decimal places if needed
        return value % 1 === 0 
          ? value.toLocaleString()
          : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return String(value);
    }
  }));

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(current => {
      const updated = new Set(current);
      if (updated.has(key)) {
        if (updated.size > 1) { // Prevent hiding all columns
          updated.delete(key);
        }
      } else {
        updated.add(key);
      }
      return updated;
    });
  };

  const filteredAndSortedData = [...data]
    .filter(row => 
      Object.entries(row).some(([key, value]) => 
        visibleColumns.has(key) && 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortConfig) return 0;
      
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return sortConfig.direction === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 bg-pastel-peach bg-opacity-5 rounded-lg">
        <div className="relative">
          <input
            type="text"
            placeholder="Search data..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-1 focus:ring-pastel-mauve text-pastel-dusty placeholder-pastel-gray"
          />
          <Search size={18} className="absolute left-3 top-2.5 text-pastel-gray" />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Tooltip content="Show or hide columns">
              <button className="px-4 py-2 border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve group">
                <Filter size={16} />
                <span>Columns</span>
                <ChevronDown size={16} className="text-pastel-gray group-hover:text-pastel-mauve" />
              </button>
            </Tooltip>

            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-pastel-pink border-opacity-20 py-2 z-10 hidden group-hover:block">
              {columns.map(column => (
                <label
                  key={column.key}
                  className="flex items-center px-4 py-2 hover:bg-pastel-peach hover:bg-opacity-5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.has(column.key)}
                    onChange={() => toggleColumn(column.key)}
                    className="rounded border-pastel-pink text-pastel-mauve focus:ring-pastel-mauve"
                  />
                  <span className="ml-2 text-sm text-pastel-dusty">{column.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Tooltip content="Export data to CSV">
            <button
              onClick={onExport}
              className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-pastel-pink divide-opacity-20">
          <thead className="bg-pastel-peach bg-opacity-5">
            <tr>
              {columns.filter(col => visibleColumns.has(col.key)).map(column => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider whitespace-nowrap"
                >
                  <button
                    onClick={() => column.sortable && handleSort(column.key)}
                    className={`flex items-center gap-2 ${
                      column.sortable ? 'cursor-pointer hover:text-pastel-mauve' : ''
                    }`}
                  >
                    {column.label}
                    {column.sortable && (
                      sortConfig?.key === column.key ? (
                        sortConfig.direction === 'asc' ? (
                          <ArrowUp size={14} />
                        ) : (
                          <ArrowDown size={14} />
                        )
                      ) : (
                        <ArrowUpDown size={14} className="text-pastel-gray" />
                      )
                    )}
                  </button>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-pastel-gray uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-pastel-pink divide-opacity-20">
            {filteredAndSortedData.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: rowIndex * 0.05 }}
                className="hover:bg-pastel-peach hover:bg-opacity-5"
              >
                {columns
                  .filter(col => visibleColumns.has(col.key))
                  .map(column => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-pastel-dusty"
                    >
                      {column.format ? column.format(row[column.key]) : row[column.key]}
                    </td>
                  ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Tooltip content="View details">
                      <button className="p-1.5 text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10 rounded-lg">
                        <Eye size={16} />
                      </button>
                    </Tooltip>
                    <Tooltip content="More options">
                      <button className="p-1.5 text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10 rounded-lg">
                        <MoreHorizontal size={16} />
                      </button>
                    </Tooltip>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredAndSortedData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-pastel-gray">No data found</p>
        </div>
      )}
    </div>
  );
};