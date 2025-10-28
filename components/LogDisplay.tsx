import React from 'react';
import { LogEntry } from '../types';

interface LogDisplayProps {
    logs: LogEntry[];
}

const LogDisplay: React.FC<LogDisplayProps> = ({ logs }) => {

    const getTypeColor = (type: LogEntry['type']) => {
        switch (type) {
            case 'warn':
                return 'text-red-400';
            case 'error':
                return 'text-yellow-400';
            case 'info':
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 h-64 flex flex-col">
             <h3 className="text-lg font-semibold text-gray-300 mb-4 flex-shrink-0">Event Log</h3>
            <div className="overflow-y-auto pr-2 flex-grow">
                <div className="space-y-3">
                    {logs.length === 0 ? (
                        <p className="text-gray-500 text-center pt-8">No events yet. Start monitoring to see logs.</p>
                    ) : (
                        logs.map((log, index) => (
                            <div key={index} className="flex items-start text-sm animate-fade-in">
                                <span className="font-mono text-gray-500 mr-4">{log.timestamp}</span>
                                <span className={`flex-1 break-words ${getTypeColor(log.type)}`}>{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogDisplay;
