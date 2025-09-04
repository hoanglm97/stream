import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon,
  EyeSlashIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const ContentModerationPanel = () => {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    severity: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/moderation/reports', {
        params: filters
      });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportAction = async (reportId, action, reason = '') => {
    try {
      await axios.post(`/api/moderation/reports/${reportId}/action`, {
        action,
        reason
      });
      
      setReports(reports.map(report => 
        report.id === reportId 
          ? { ...report, status: action, updatedAt: new Date().toISOString() }
          : report
      ));
      
      setSelectedReport(null);
    } catch (error) {
      console.error('Error handling report action:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const ReportCard = ({ report }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={() => setSelectedReport(report)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${getSeverityColor(report.severity)}`}>
            <FlagIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{report.type}</h3>
            <p className="text-sm text-gray-600">{report.reason}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
            {report.status}
          </span>
          <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        {report.contentType === 'video' && (
          <div className="flex items-center space-x-3">
            <img 
              src={report.thumbnail || '/api/placeholder/80/60'} 
              alt="Content thumbnail"
              className="w-20 h-15 rounded-lg object-cover"
            />
            <div>
              <h4 className="font-medium text-gray-800">{report.title}</h4>
              <p className="text-sm text-gray-600">{report.duration}</p>
            </div>
          </div>
        )}
        {report.contentType === 'comment' && (
          <div className="flex items-start space-x-3">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-gray-800">{report.content}</p>
              <p className="text-sm text-gray-600 mt-1">by @{report.author}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ExclamationTriangleIcon className="h-4 w-4" />
          <span>Reported by {report.reportedBy} users</span>
        </div>
        <div className="flex items-center space-x-2">
          {report.aiFlags && report.aiFlags.length > 0 && (
            <div className="flex space-x-1">
              {report.aiFlags.map((flag, index) => (
                <span key={index} className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">
                  {flag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const ReportDetailModal = ({ report, onClose }) => (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Report Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <XCircleIcon className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Report Information */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Report Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{report.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Severity:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityColor(report.severity)}`}>
                        {report.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reports:</span>
                      <span className="font-medium">{report.reportedBy} users</span>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                {report.aiAnalysis && (
                  <div className="bg-purple-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 mr-2 text-purple-600" />
                      AI Analysis
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Confidence Score:</span>
                        <div className="mt-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${report.aiAnalysis.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{report.aiAnalysis.confidence}%</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Detected Issues:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {report.aiAnalysis.issues?.map((issue, index) => (
                            <span key={index} className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                              {issue}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-700">Recommendation:</span>
                        <p className="text-sm text-gray-600 mt-1">{report.aiAnalysis.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Reports */}
                <div className="bg-orange-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">User Reports</h3>
                  <div className="space-y-2">
                    {report.userReports?.map((userReport, index) => (
                      <div key={index} className="bg-white rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-800">@{userReport.username}</span>
                          <span className="text-xs text-gray-500">{new Date(userReport.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-600">{userReport.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Preview */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Content Preview</h3>
                  {report.contentType === 'video' && (
                    <div>
                      <img 
                        src={report.thumbnail || '/api/placeholder/400/225'} 
                        alt="Video thumbnail"
                        className="w-full h-48 rounded-lg object-cover mb-3"
                      />
                      <h4 className="font-medium text-gray-800 mb-1">{report.title}</h4>
                      <p className="text-sm text-gray-600">{report.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>{report.duration}</span>
                        <span>{report.views} views</span>
                        <span>by @{report.author}</span>
                      </div>
                    </div>
                  )}
                  {report.contentType === 'comment' && (
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-gray-800 mb-2">{report.content}</p>
                      <div className="text-sm text-gray-600">
                        by @{report.author} • {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleReportAction(report.id, 'approved')}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Approve Content
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, 'rejected')}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    Remove Content
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, 'flagged')}
                    className="w-full bg-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center"
                  >
                    <FlagIcon className="h-5 w-5 mr-2" />
                    Flag for Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Content Moderation</h1>
        <p className="text-gray-600">Review and manage reported content to keep the platform safe</p>
      </motion.div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <select 
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select 
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="violence">Violence</option>
              <option value="language">Bad Language</option>
              <option value="spam">Spam</option>
            </select>

            <select 
              value={filters.severity}
              onChange={(e) => setFilters({...filters, severity: e.target.value})}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
};

export default ContentModerationPanel;