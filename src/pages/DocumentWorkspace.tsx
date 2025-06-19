import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, Upload, Download, Search, Filter, Plus, MoreHorizontal, 
  Calendar, User, Folder, ChevronRight, Eye
} from 'lucide-react';
import Tooltip from '../components/ui/Tooltip';
import { motion } from 'framer-motion';
import { loadDocuments, uploadDocument, deleteDocument, Document } from '../utils/documents';

interface UploadedFile extends File {
  id: string;
  uploadProgress?: number;
}

const DocumentWorkspace = () => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<{id: string, name: string, files: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const docs = await loadDocuments(id);
        setDocuments(docs);
        
        // Extract folder types from documents
        const folderTypes = Array.from(new Set(docs.map(doc => doc.type)));
        const folderData = folderTypes.map(type => ({
          id: type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          files: docs.filter(doc => doc.type === type).length
        }));
        
        setFolders(folderData);
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [id]);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).map(file => ({
      ...file,
      id: crypto.randomUUID(),
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Upload files to Supabase
    if (id) {
      for (const file of files) {
        try {
          const folderType = selectedFolder || 'general';
          const uploaded = await uploadDocument(id, file, folderType);
          if (uploaded) {
            // Refresh documents list
            const docs = await loadDocuments(id);
            setDocuments(docs);
            
            // Update folder counts
            const folderTypes = Array.from(new Set(docs.map(doc => doc.type)));
            setFolders(folderTypes.map(type => ({
              id: type,
              name: type.charAt(0).toUpperCase() + type.slice(1),
              files: docs.filter(doc => doc.type === type).length
            })));
          }
        } catch (error) {
          console.error('Error uploading file:', error);
        }
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = async (docId: string) => {
    if (!id) return;
    
    try {
      const success = await deleteDocument(docId);
      if (success) {
        // Refresh documents list
        const docs = await loadDocuments(id);
        setDocuments(docs);
        
        // Update folder counts
        const folderTypes = Array.from(new Set(docs.map(doc => doc.type)));
        setFolders(folderTypes.map(type => ({
          id: type,
          name: type.charAt(0).toUpperCase() + type.slice(1),
          files: docs.filter(doc => doc.type === type).length
        })));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Filter documents based on search query and selected folder
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder ? doc.type === selectedFolder : true;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Folder Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-pastel-dusty">Folders</h3>
              <button className="p-1.5 text-pastel-gray hover:text-pastel-mauve rounded-lg hover:bg-pastel-peach hover:bg-opacity-10">
                <Plus size={16} />
              </button>
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolder(null)}
                className={`w-full flex items-center justify-between p-2 rounded-lg text-sm ${
                  selectedFolder === null
                    ? 'bg-pastel-pink bg-opacity-10 text-pastel-dusty'
                    : 'text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-5'
                }`}
              >
                <div className="flex items-center">
                  <Folder size={16} className="mr-2" />
                  <span>All Files</span>
                </div>
                <span className="text-xs">{documents.length}</span>
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id === selectedFolder ? null : folder.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-sm ${
                    selectedFolder === folder.id
                      ? 'bg-pastel-pink bg-opacity-10 text-pastel-dusty'
                      : 'text-pastel-gray hover:bg-pastel-peach hover:bg-opacity-5'
                  }`}
                >
                  <div className="flex items-center">
                    <Folder size={16} className="mr-2" />
                    <span>{folder.name}</span>
                  </div>
                  <span className="text-xs">{folder.files}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="relative w-full sm:w-auto sm:max-w-sm">
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-1 focus:ring-pastel-mauve text-pastel-dusty placeholder-pastel-gray"
              />
              <Search size={18} className="absolute left-3 top-2.5 text-pastel-gray" />
            </div>
            
            <div className="flex space-x-3">
              <input
                type="file"
                id="file-upload"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  handleFileSelect(e.target.files);
                  e.target.value = ''; // Reset input
                }}
              />
              <Tooltip content="Filter documents by type">
                <div className="relative">
                  <button className="px-4 py-2 border border-pastel-pink border-opacity-20 rounded-lg flex items-center gap-2 text-pastel-dusty hover:border-pastel-mauve">
                    <Filter size={16} />
                    <span>{filterType || 'All Types'}</span>
                  </button>
                </div>
              </Tooltip>
              
              <Tooltip content="Upload new documents">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="px-4 py-2 bg-pastel-mauve text-white rounded-lg flex items-center gap-2 hover:bg-pastel-dusty transition-colors">
                    <Upload size={16} />
                    <span>Upload Files</span>
                  </div>
                </label>
              </Tooltip>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-pastel-pink border-opacity-20">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-pastel-pink border-opacity-20">
                    <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Size</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Modified</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-pastel-gray uppercase tracking-wider">Tags</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-pastel-gray uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pastel-pink divide-opacity-20">
                  {[...filteredDocuments, ...uploadedFiles.map(file => ({
                    id: file.id,
                    name: file.name,
                    type: file.type.split('/')[1].toUpperCase(),
                    size: formatFileSize(file.size),
                    modifiedBy: 'You',
                    modifiedDate: new Date().toISOString().split('T')[0],
                    tags: ['New']
                  }))].map((file: any) => (
                    <tr key={file.id} className="hover:bg-pastel-peach hover:bg-opacity-5">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText size={16} className="text-pastel-gray mr-3" />
                          <span className="text-sm text-pastel-dusty">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-pastel-gray">{file.type}</span>
                      </td> 
                      <td className="px-6 py-4">
                        <span className="text-sm text-pastel-gray">{file.size}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-pastel-gray">{file.modifiedDate}</div>
                          <div className="text-xs text-pastel-gray">{file.modifiedBy}</div>
                        </div> 
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {file.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs rounded-full bg-pastel-peach bg-opacity-10 text-pastel-dusty"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <Tooltip content="View document">
                            <button className="p-1.5 rounded-lg text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10">
                              <Eye size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip content="Download document">
                            <button className="p-1.5 rounded-lg text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10">
                              <Download size={16} />
                            </button>
                          </Tooltip>
                          <Tooltip content="More options">
                            <button className="p-1.5 rounded-lg text-pastel-gray hover:text-pastel-mauve hover:bg-pastel-peach hover:bg-opacity-10">
                              <MoreHorizontal size={16} onClick={() => removeFile(file.id)} />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentWorkspace;