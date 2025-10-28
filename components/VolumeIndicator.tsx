import React from 'react';

interface VolumeIndicatorProps {
    volume: number; // A value between 0 and 1
}

const NUM_BARS = 30;

const VolumeIndicator: React.FC<VolumeIndicatorProps> = ({ volume }) => {
    const activeBars = Math.round(volume * NUM_BARS);

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center justify-center h-24">
            <div className="flex items-end h-full space-x-[2px]">
                {Array.from({ length: NUM_BARS }).map((_, i) => {
                    const isActive = i < activeBars;
                    // Create a subtle curve for the bar heights
                    const barHeight = 4 + ((i + 1) / NUM_BARS) * 76; // min height 4px, max height 80px
                    return (
                        <div
                            key={i}
                            className={`w-1.5 rounded-full transition-colors duration-100 ${isActive ? 'bg-cyan-400' : 'bg-gray-600/50'}`}
                            style={{ height: `${barHeight}px` }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default VolumeIndicator;