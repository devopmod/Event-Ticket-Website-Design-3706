import React from 'react';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const {
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiInfo
} = FiIcons;

const VenueVerificationBadge = ({ verificationData, onClick }) => {
  if (!verificationData) return null;

  const { discrepancies } = verificationData;
  
  const getBadgeStyles = (severity) => {
    switch (severity) {
      case 'high':
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          text: 'text-red-400',
          icon: FiAlertTriangle
        };
      case 'medium':
        return {
          bg: 'bg-yellow-500/20',
          border: 'border-yellow-500/50',
          text: 'text-yellow-400',
          icon: FiAlertCircle
        };
      case 'low':
        return {
          bg: 'bg-blue-500/20',
          border: 'border-blue-500/50',
          text: 'text-blue-400',
          icon: FiInfo
        };
      default:
        return {
          bg: 'bg-green-500/20',
          border: 'border-green-500/50',
          text: 'text-green-400',
          icon: FiCheckCircle
        };
    }
  };

  const styles = getBadgeStyles(discrepancies.severity);

  return (
    <button
      onClick={onClick}
      className={`flex items-center px-3 py-1.5 rounded-full ${styles.bg} ${styles.border} transition-colors hover:bg-opacity-30`}
    >
      <SafeIcon icon={styles.icon} className={`w-4 h-4 mr-1.5 ${styles.text}`} />
      <span className={`text-sm font-medium ${styles.text}`}>
        {discrepancies.hasDiscrepancies
          ? `${Object.keys(discrepancies.details.byEvent).length} issues found`
          : 'Verified'}
      </span>
    </button>
  );
};

export default VenueVerificationBadge;