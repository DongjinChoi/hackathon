import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/solid';
import { DetectionStatus } from '../types';

interface LightIndicatorProps {
    status: DetectionStatus;
    lightState: 'on' | 'off' | 'unknown';
}

const LightIndicator: React.FC<LightIndicatorProps> = ({ status, lightState }) => {
    let iconColor = 'text-gray-600';
    let labelText = 'Light Offline';

    switch (status) {
        case DetectionStatus.MONITORING:
        case DetectionStatus.ANALYZING:
            labelText = 'Light Standby';
            break;
        case DetectionStatus.DANGER:
            labelText = 'Alert Active';
            break;
        case DetectionStatus.IDLE:
        case DetectionStatus.ERROR:
        default:
            labelText = 'Light Offline';
            break;
    }

    if (lightState === 'on') {
        iconColor = status === DetectionStatus.DANGER ? 'text-yellow-300' : 'text-cyan-400';
    } else if (lightState === 'off') {
        iconColor = 'text-gray-600';
    } else { // 'unknown'
        iconColor = 'text-gray-800';
        labelText = 'Status Unknown';
    }


    return (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-800/50 border border-gray-700 rounded-lg h-full">
            <LightBulbIcon className={`h-10 w-10 transition-colors duration-200 ${iconColor}`} />
            <span className="mt-2 text-sm font-medium text-gray-400">{labelText}</span>
        </div>
    );
};

export default LightIndicator;
