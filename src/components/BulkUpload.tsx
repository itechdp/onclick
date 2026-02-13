import React, { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, XCircle, Loader, Eye } from 'lucide-react';
import { bulkUploadService, BulkUploadResult } from '../services/bulkUploadService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface BulkUploadProps {
  onSuccess?: () => void;
}

export function BulkUpload({ onSuccess }: BulkUploadProps) {
  const { user, effectiveUserId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedFailures, setExpandedFailures] = useState<Set<number>>(new Set());

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        toast.success('File selected');
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        toast.success('File selected');
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      bulkUploadService.downloadTemplate();
      toast.success('Template downloaded');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !effectiveUserId) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    setUploadProgress({ current: 0, total: 0 });
    setUploadResult(null);

    try {
      const result = await bulkUploadService.bulkUploadPolicies(
        selectedFile,
        effectiveUserId,
        user?.email || 'Unknown',
        (current, total) => {
          setUploadProgress({ current, total });
        }
      );

      setUploadResult(result);
      setShowResults(true);
      setSelectedFile(null);

      if (result.failureCount === 0) {
        toast.success(`✓ All ${result.successCount} policies uploaded successfully!`);
      } else {
        toast.success(
          `${result.successCount} policies uploaded, ${result.failureCount} failed`
        );
      }

      onSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const toggleFailureDetails = (rowIndex: number) => {
    const newExpanded = new Set(expandedFailures);
    if (newExpanded.has(rowIndex)) {
      newExpanded.delete(rowIndex);
    } else {
      newExpanded.add(rowIndex);
    }
    setExpandedFailures(newExpanded);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Bulk Upload Policies</h2>

      {/* Template Download */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Need Our Template?</h3>
            <p className="text-sm text-blue-700 mt-1">
              Download our pre-formatted CSV template with all required fields and instructions.
            </p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 whitespace-nowrap"
          >
            <Download size={18} />
            Download Template
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      {!showResults ? (
        <div className="mb-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} size={40} />
            <p className="text-lg font-semibold text-gray-700">
              {selectedFile ? selectedFile.name : 'Drag & drop your CSV file here'}
            </p>
            <p className="text-sm text-gray-500 mt-2">or click to select a file</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {selectedFile && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                {isUploading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={18} />
                    Upload Policies
                  </>
                )}
              </button>
              <button
                onClick={() => setSelectedFile(null)}
                disabled={isUploading}
                className="px-6 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold transition-colors"
              >
                Clear
              </button>
            </div>
          )}

          {isUploading && uploadProgress && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-300"
                  style={{
                    width: `${uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Processing: {uploadProgress.current} / {uploadProgress.total}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Results Display */}
      {uploadResult && showResults && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-600 text-sm">Total Rows</p>
              <p className="text-3xl font-bold text-gray-800">{uploadResult.totalRows}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-green-600 text-sm">Successful</p>
              <p className="text-3xl font-bold text-green-600">{uploadResult.successCount}</p>
            </div>
            <div className={`rounded-lg p-4 border ${uploadResult.failureCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className={uploadResult.failureCount > 0 ? 'text-red-600 text-sm' : 'text-green-600 text-sm'}>
                Failed
              </p>
              <p className={`text-3xl font-bold ${uploadResult.failureCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {uploadResult.failureCount}
              </p>
            </div>
          </div>

          {/* Success Rate Bar */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-700">Success Rate</p>
              <p className="text-lg font-bold text-gray-800">
                {uploadResult.totalRows > 0 
                  ? ((uploadResult.successCount / uploadResult.totalRows) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  uploadResult.failureCount === 0 ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{
                  width: `${uploadResult.totalRows > 0 
                    ? (uploadResult.successCount / uploadResult.totalRows) * 100 
                    : 0}%`,
                }}
              />
            </div>
          </div>

          {/* Failed Rows Details */}
          {uploadResult.failureCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
                <XCircle size={18} />
                Failed Uploads ({uploadResult.failureCount})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {uploadResult.results
                  .filter(r => !r.success)
                  .map((result) => (
                    <div key={result.rowIndex} className="bg-white p-3 rounded border border-red-100">
                      <div
                        className="flex items-start justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                        onClick={() => toggleFailureDetails(result.rowIndex)}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">Row {result.rowIndex}</p>
                          <p className="text-sm text-red-600 mt-1">{result.error}</p>
                        </div>
                        <Eye size={16} className="text-gray-400" />
                      </div>
                      {expandedFailures.has(result.rowIndex) && result.data && (
                        <div className="mt-3 pt-3 border-t border-red-100 bg-gray-50 p-2 rounded text-sm">
                          <p className="font-semibold text-gray-700 mb-2">Row Data:</p>
                          <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap break-words">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadResult.successCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle size={18} />
                Successfully Uploaded
              </h3>
              <p className="text-green-700">
                {uploadResult.successCount} {uploadResult.successCount === 1 ? 'policy' : 'policies'} have been added to your system.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowResults(false);
                setUploadResult(null);
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Upload More Files
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
            >
              Download Template Again
            </button>
          </div>
        </div>
      )}

      {/* Information Section */}
      <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
          <AlertCircle size={18} />
          Important Information
        </h3>
        <ul className="text-sm text-amber-800 space-y-2">
          <li>• <strong>User ID:</strong> Automatically captured from your account - no need to include in the CSV</li>
          <li>• <strong>Required Columns:</strong> Policyholder Name, Policy Type, Policy Number, Insurance Company, Policy Start Date, Policy End Date</li>
          <li>• <strong>Optional Columns:</strong> Contact No, Email ID, Premium Amount, and many more (see template)</li>
          <li>• <strong>Date Format:</strong> Use DD-MM-YYYY format (e.g., 01-01-2024)</li>
          <li>• <strong>Empty Values:</strong> Leave cells blank for optional fields</li>
          <li>• <strong>On Failure:</strong> Review error messages and correct the data before re-uploading</li>
        </ul>
      </div>
    </div>
  );
}
