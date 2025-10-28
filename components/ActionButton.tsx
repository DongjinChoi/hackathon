import React from 'react';
import { DetectionStatus } from '../types';

interface ActionButtonProps {
    status: DetectionStatus;
    onStart: () => void;
    onStop: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ status, onStart, onStop }) => {
    const isIdle = status === DetectionStatus.IDLE || status === DetectionStatus.ERROR;
    const isMonitoring = status === DetectionStatus.MONITORING || status === DetectionStatus.DANGER;
    const isProcessing = status === DetectionStatus.ANALYZING;

    const handleClick = () => {
        if (isIdle) {
            onStart();
        } else if (isMonitoring) {
            onStop();
        }
    };

    const getButtonText = () => {
        if (isIdle) return 'Start Monitoring';
        if (isMonitoring) return 'Stop Monitoring';
        if (isProcessing) return 'Analyzing...';
        return 'Start Monitoring';
    };

    const getButtonClass = () => {
        if (isIdle) return 'bg-cyan-600 hover:bg-cyan-500 focus:ring-cyan-500';
        if (isMonitoring) return 'bg-red-600 hover:bg-red-500 focus:ring-red-500';
        if (isProcessing) return 'bg-gray-600 cursor-not-allowed';
        return 'bg-cyan-600 hover:bg-cyan-500 focus:ring-cyan-500';
    };

    return (
        <button
            onClick={handleClick}
            disabled={isProcessing}
            className={`w-full py-4 px-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 ${getButtonClass()} ${isProcessing ? '' : 'hover:scale-105 active:scale-100'}`}
        >
            {getButtonText()}
        </button>
    );
};

export default ActionButton;
