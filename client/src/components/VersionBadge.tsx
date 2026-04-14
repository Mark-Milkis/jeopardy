import React from 'react';
import { version } from '../utils/version';

/**
 * Version Badge Component
 * Displays version information in a compact badge format.
 * 
 * Usage:
 * <VersionBadge /> - Full version with build metadata
 * <VersionBadge compact /> - Just version number
 * <VersionBadge position="top-right" /> - Positioned overlay
 */

interface VersionBadgeProps {
  compact?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'inline';
  className?: string;
}

const positionClasses = {
  'top-left': 'fixed top-4 left-4 z-50',
  'top-right': 'fixed top-4 right-4 z-50',
  'bottom-left': 'fixed bottom-4 left-4 z-50',
  'bottom-right': 'fixed bottom-4 right-4 z-50',
  'inline': ''
};

export const VersionBadge: React.FC<VersionBadgeProps> = ({ 
  compact = false, 
  position = 'inline',
  className = ''
}) => {
  const isDevelopment = version.buildMetadata && version.buildMetadata.length > 0;
  
  const displayVersion = compact ? version.version : version.fullVersion;
  const bgColor = isDevelopment ? 'bg-yellow-500' : 'bg-blue-600';
  const textColor = isDevelopment ? 'text-black' : 'text-white';

  return (
    <div 
      className={`${positionClasses[position]} ${className}`}
      title={`Built: ${new Date(version.buildDate).toLocaleString()}\nSHA: ${version.gitSha}\nBranch: ${version.gitBranch}`}
    >
      <span className={`${bgColor} ${textColor} px-2 py-1 rounded text-xs font-mono font-bold shadow-lg`}>
        v{displayVersion}
      </span>
      {!compact && isDevelopment && (
        <span className="ml-1 text-xs text-gray-500 font-mono">
          ({version.gitBranch})
        </span>
      )}
    </div>
  );
};

/**
 * Full Version Info Component
 * Displays detailed version information for admin/debug views.
 */
export const VersionInfo: React.FC = () => {
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg font-mono text-sm">
      <h3 className="text-lg font-bold mb-2">Version Information</h3>
      <dl className="grid grid-cols-2 gap-2">
        <dt className="text-gray-400">Version:</dt>
        <dd className="font-bold">{version.version}</dd>
        
        <dt className="text-gray-400">Full Version:</dt>
        <dd className="font-bold">{version.fullVersion}</dd>
        
        <dt className="text-gray-400">Git SHA:</dt>
        <dd className="text-blue-400">{version.gitSha}</dd>
        
        <dt className="text-gray-400">Branch:</dt>
        <dd className="text-green-400">{version.gitBranch}</dd>
        
        <dt className="text-gray-400">Build Date:</dt>
        <dd>{new Date(version.buildDate).toLocaleString()}</dd>
      </dl>
    </div>
  );
};

export default VersionBadge;
