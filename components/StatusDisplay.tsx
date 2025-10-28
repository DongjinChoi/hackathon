import React from 'react';
import { DetectionStatus } from '../types';
import { ShieldCheckIcon, ExclamationTriangleIcon, CpuChipIcon, NoSymbolIcon } from '@heroicons/react/24/solid';

const statusConfig = {
    [DetectionStatus.IDLE]: {
        text: 'Idle',
        description: 'Monitoring is off. Press start to begin.',
        icon: NoSymbolIcon,
        color: 'text-gray-500',
        bgColor: 'bg-gray-700/20',
        pulse: false,
    },
    [DetectionStatus.MONITORING]: {
        text: 'Monitoring',
        description: 'Actively listening for sounds of distress.',
        icon: ShieldCheckIcon,
        color: 'text-green-400',
        bgColor: 'bg-green-900/30',
        pulse: false,
    },
    [DetectionStatus.ANALYZING]: {
        text: 'Analyzing...',
        description: 'Processing audio with AI. Please wait.',
        icon: CpuChipIcon,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-900/30',
        pulse: true,
    },
    [DetectionStatus.DANGER]: {
        text: 'DANGER DETECTED',
        description: 'Potential distress signal identified. Take action!',
        icon: ExclamationTriangleIcon,
        color: 'text-red-400',
        bgColor: 'bg-red-900/30',
        pulse: true,
    },
    [DetectionStatus.ERROR]: {
        text: 'Error',
        description: 'An error occurred. See message below.',
        icon: ExclamationTriangleIcon,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-900/30',
        pulse: false,
    },
};


interface StatusDisplayProps {
    status: DetectionStatus;
    dangerDescription: string | null;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, dangerDescription }) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={`p-6 rounded-lg border border-gray-700 flex flex-col items-center justify-center text-center transition-all duration-300 ${config.bgColor}`}>
            <div className="relative flex items-center justify-center h-16 w-16 mb-4">
                 {config.pulse && (
                     <div className={`absolute h-16 w-16 ${config.color.replace('text', 'bg')} opacity-75 rounded-full animate-ping`}></div>
                )}
                <Icon className={`h-16 w-16 ${config.color} z-10`} />
            </div>
            <h2 className={`text-2xl font-bold ${config.color}`}>{config.text}</h2>
            <p className="text-gray-400 mt-1">{config.description}</p>
            {status === DetectionStatus.DANGER && dangerDescription && (
                <div className="mt-4 w-full bg-red-500/10 border border-red-400/30 rounded-lg py-2 px-4">
                    <p className="text-lg text-red-300 font-medium">{dangerDescription}</p>
                </div>
            )}
        </div>
    );
};

export default StatusDisplay;