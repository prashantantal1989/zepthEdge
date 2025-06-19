import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { submitSupportTicket } from '../utils/helpCenter';

const categories = [
  'General Question',
  'Technical Issue',
  'Feature Request',
  'Billing',
  'Account Access',
  'Data Import/Export',
  'Other'
];

const SubmitTicket = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    
    if (!subject.trim()) newErrors.subject = 'Subject is required';
    if (!category) newErrors.category = 'Category is required';
    if (!message.trim()) newErrors.message = 'Message is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await submitSupportTicket(email, subject, message, category);
      
      if (success) {
        setIsSubmitted(true);
        // Reset form
        setEmail('');
        setSubject('');
        setCategory('');
        setMessage('');
        setAttachments([]);
      } else {
        alert('Failed to submit ticket. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('An error occurred while submitting your ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...fileArray]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <button
          onClick={() => navigate('/help')}
          className="flex items-center text-pastel-mauve hover:text-pastel-dusty mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          <span>Back to Help Center</span>
        </button>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm p-8"
        >
          {isSubmitted ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket Submitted Successfully</h2>
              <p className="text-gray-600 mb-8">
                Thank you for contacting us. We've received your support ticket and will get back to you as soon as possible.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="px-4 py-2 border border-pastel-mauve text-pastel-mauve rounded-lg hover:bg-pastel-peach hover:bg-opacity-10"
                >
                  Submit Another Ticket
                </button>
                <button
                  onClick={() => navigate('/help')}
                  className="px-4 py-2 bg-pastel-mauve text-white rounded-lg hover:bg-pastel-dusty"
                >
                  Return to Help Center
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit a Support Ticket</h1>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full rounded-lg border ${errors.email ? 'border-red-300' : 'border-gray-300'} focus:border-pastel-mauve focus:ring-pastel-mauve`}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`w-full rounded-lg border ${errors.subject ? 'border-red-300' : 'border-gray-300'} focus:border-pastel-mauve focus:ring-pastel-mauve`}
                    placeholder="Brief description of your issue"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full rounded-lg border ${errors.category ? 'border-red-300' : 'border-gray-300'} focus:border-pastel-mauve focus:ring-pastel-mauve`}
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className={`w-full rounded-lg border ${errors.message ? 'border-red-300' : 'border-gray-300'} focus:border-pastel-mauve focus:ring-pastel-mauve`}
                    placeholder="Please describe your issue in detail"
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachments (Optional)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-pastel-mauve hover:text-pastel-dusty focus-within:outline-none"
                        >
                          <span>Upload a file</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            multiple
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                    </div>
                  </div>
                  
                  {attachments.length > 0 && (
                    <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-200">
                      {attachments.map((file, index) => (
                        <li key={index} className="flex items-center justify-between py-3 px-4">
                          <div className="flex items-center">
                            <span className="truncate text-sm font-medium text-gray-900">
                              {file.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({(file.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="ml-4 text-sm font-medium text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-pastel-mauve text-white rounded-lg hover:bg-pastel-dusty flex items-center gap-2"
                  >
                    <Send size={16} />
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SubmitTicket;