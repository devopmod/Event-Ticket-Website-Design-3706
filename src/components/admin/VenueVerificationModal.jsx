```jsx
import React from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../../components/common/SafeIcon';

const { FiX, FiAlertTriangle, FiCheckCircle, FiInfo, FiRefreshCw, FiArrowRight } = FiIcons;

const VenueVerificationModal = ({ isOpen, onClose, verificationData, onRegenerate, isRegenerating = false }) => {
  if (!isOpen || !verificationData) return null;

  const { layout, database, discrepancies } = verificationData;

  // Определяем, нужна ли регенерация мест
  const needsRegeneration = database.total === 0 && layout.total > 0;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-green-400';
    }
  };

  const getStatusIcon = (severity) => {
    switch (severity) {
      case 'high': return FiAlertTriangle;
      case 'medium': return FiInfo;
      case 'low': return FiInfo;
      default: return FiCheckCircle;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div className="flex items-center">
            <SafeIcon
              icon={needsRegeneration ? FiAlertTriangle : getStatusIcon(discrepancies.severity)}
              className={`w-6 h-6 mr-3 ${needsRegeneration ? 'text-yellow-400' : getSeverityColor(discrepancies.severity)}`}
            />
            <div>
              <h2 className="text-xl font-semibold text-white">Seat Verification Results</h2>
              <p className="text-sm text-gray-400">
                {new Date(verificationData.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <SafeIcon icon={FiX} className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Layout Info */}
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Layout Seats</h3>
              <div className="text-2xl font-bold text-white">{layout.total}</div>
              <div className="mt-2 space-y-1 text-sm">
                {Object.entries(layout.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-gray-400">
                    <span className="capitalize">{type}s:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Database Info */}
            <div className="bg-zinc-700/50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Database Seats</h3>
              <div className="text-2xl font-bold text-white">{database.total}</div>
              <div className="mt-2 text-sm text-gray-400">
                <div>Events: {Object.keys(database.byEvent).length}</div>
                <div>Total Records: {database.total}</div>
                {database.total === 0 && layout.total > 0 && (
                  <div className="mt-2 text-yellow-400">
                    No seats generated yet
                  </div>
                )}
              </div>
            </div>

            {/* Status Info */}
            <div className={`rounded-lg p-4 ${
              needsRegeneration 
                ? 'bg-yellow-500/20 border border-yellow-500/50'
                : discrepancies.hasDiscrepancies 
                  ? 'bg-red-500/20 border border-red-500/50' 
                  : 'bg-green-500/20 border border-green-500/50'
            }`}>
              <h3 className="text-sm font-medium text-gray-400 mb-2">Status</h3>
              <div className={`text-2xl font-bold ${
                needsRegeneration 
                  ? 'text-yellow-400'
                  : discrepancies.hasDiscrepancies 
                    ? 'text-red-400' 
                    : 'text-green-400'
              }`}>
                {needsRegeneration 
                  ? 'Seats Need Generation'
                  : discrepancies.hasDiscrepancies 
                    ? `${Object.keys(discrepancies.details.byEvent).length} Events` 
                    : 'No Issues'}
              </div>
              {(needsRegeneration || discrepancies.hasDiscrepancies) && (
                <div className="mt-2 text-sm">
                  <div className={getSeverityColor(discrepancies.severity)}>
                    {needsRegeneration 
                      ? 'Seats need to be generated for events'
                      : `Severity: ${discrepancies.severity.toUpperCase()}`}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Required Message */}
          {needsRegeneration && (
            <div className="mb-6">
              <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-yellow-400 mb-2">Action Required</h3>
                <p className="text-yellow-200">
                  This venue has {layout.total} seats defined in its layout, but no seats have been generated in the database yet. 
                  Click "Generate Seats" to create the necessary seat records for all events using this venue.
                </p>
              </div>
            </div>
          )}

          {/* Detailed Analysis */}
          {discrepancies.hasDiscrepancies && !needsRegeneration && (
            <>
              {/* Recommendations */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {discrepancies.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="flex items-start bg-blue-500/20 border border-blue-500/50 rounded-lg p-3"
                    >
                      <SafeIcon icon={FiInfo} className="w-5 h-5 text-blue-400 mr-2 mt-0.5" />
                      <span className="text-sm text-blue-200">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Analysis */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Event Analysis</h3>
                <div className="space-y-3">
                  {Object.entries(discrepancies.details.byEvent).map(([eventId, details]) => (
                    <div key={eventId} className="bg-zinc-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-white">Event: {eventId}</div>
                        <div className={`text-sm ${
                          Math.abs(details.difference) > 10 ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          Difference: {details.difference > 0 ? '+' : ''}{details.difference} seats
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-400">Expected: {details.expected}</div>
                          <div className="text-gray-400">Actual: {details.actual}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-400">
                            Free: {details.breakdown.free}
                          </div>
                          <div className="text-gray-400">
                            Reserved/Sold: {details.breakdown.held + details.breakdown.sold}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-700 p-6 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-600 hover:border-zinc-500 text-white rounded-lg transition-colors"
          >
            Close
          </button>
          {(needsRegeneration || discrepancies.hasDiscrepancies) && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className={`flex items-center px-6 py-2 rounded-lg transition-colors ${
                isRegenerating
                  ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                  : 'bg-primary-400 hover:bg-primary-500 text-black'
              }`}
            >
              <SafeIcon
                icon={isRegenerating ? FiRefreshCw : FiArrowRight}
                className={`w-5 h-5 mr-2 ${isRegenerating ? 'animate-spin' : ''}`}
              />
              {isRegenerating ? 'Generating...' : needsRegeneration ? 'Generate Seats' : 'Regenerate Event Seats'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VenueVerificationModal;
```