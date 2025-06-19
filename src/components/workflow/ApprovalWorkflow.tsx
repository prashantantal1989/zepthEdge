import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Clock, XCircle, 
  ArrowRight, User, AlertCircle, MessageSquare
} from 'lucide-react';
import Tooltip from '../ui/Tooltip';

interface ApprovalStep {
  id: string;
  role: string;
  name?: string;
  status: 'pending' | 'approved' | 'rejected' | 'waiting';
  date?: string;
  comment?: string;
}

interface ApprovalWorkflowProps {
  steps: ApprovalStep[];
  currentStep: number;
  onApprove?: (stepIndex: number, comment: string) => void;
  onReject?: (stepIndex: number, comment: string) => void;
}

const ApprovalWorkflow = ({ steps, currentStep, onApprove, onReject }: ApprovalWorkflowProps) => {
  const [comment, setComment] = useState('');
  
  const getStepIcon = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 'rejected':
        return <XCircle size={20} className="text-red-500" />;
      case 'pending':
        return <Clock size={20} className="text-amber-500" />;
      case 'waiting':
        return <AlertCircle size={20} className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: ApprovalStep['status']) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'pending':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'waiting':
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleApprove = () => {
    if (onApprove && currentStep < steps.length) {
      onApprove(currentStep, comment);
      setComment('');
    }
  };

  const handleReject = () => {
    if (onReject && currentStep < steps.length) {
      onReject(currentStep, comment);
      setComment('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-pastel-dusty">Approval Workflow</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-pastel-gray">Progress:</span>
          <span className="text-sm font-medium text-pastel-dusty">
            {Math.round((currentStep / steps.length) * 100)}%
          </span>
        </div>
      </div>
      
      {/* Submitter Information */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-pastel-pink bg-opacity-20"></div>
        <div className="relative flex items-start space-x-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pastel-peach bg-opacity-10 ring-8 ring-white">
            <User size={20} className="text-pastel-mauve" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-pastel-dusty">Submitted by {steps[0].name}</div>
            <div className="mt-1 text-xs text-pastel-gray">{steps[0].date}</div>
          </div>
        </div>
      </div>
      
      <div className="relative space-y-6">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-pastel-pink bg-opacity-20"></div>
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className="relative flex items-start space-x-4">
              <div className="relative">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ring-8 ring-white ${
                  step.status === 'waiting' ? 'bg-gray-100' :
                  step.status === 'pending' ? 'bg-amber-50' :
                  step.status === 'approved' ? 'bg-green-50' :
                  'bg-red-50'
                }`}>
                  {getStepIcon(step.status)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-pastel-dusty">{step.role}</div>
                    <div className="mt-0.5 text-xs text-pastel-gray">{step.name}</div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(step.status)}`}>
                    {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
                  </div>
                </div>
                <Tooltip content="Reject this request">
                  <button
                    onClick={handleReject}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject
                  </button>
                </Tooltip>
                <Tooltip content="Approve this request">
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle2 size={16} className="mr-2" />
                    Approve
                  </button>
                </Tooltip>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress Indicator */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-8">
        <div 
          className="h-full bg-pastel-mauve rounded-full transition-all duration-500"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
      
      {/* Action Buttons for current step */}
      {onApprove && onReject && currentStep < steps.length && steps[currentStep]?.status === 'pending' && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-pastel-gray mb-2">
              Add Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add your comments here..."
              className="w-full rounded-lg border border-pastel-pink border-opacity-20 focus:border-pastel-mauve focus:ring-pastel-mauve text-pastel-dusty placeholder-pastel-gray"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Tooltip content="Reject this request">
              <button
                onClick={handleReject}
                className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center"
              >
                <XCircle size={16} className="mr-2" />
                Reject
              </button>
            </Tooltip>
            <Tooltip content="Approve this request">
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
              >
                <CheckCircle2 size={16} className="mr-2" />
                Approve
              </button>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflow;