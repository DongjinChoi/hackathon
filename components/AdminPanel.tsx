import React, { useState } from 'react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';
import { analyzeAudioForDistress } from '../services/geminiService';
import { testAssets } from '../services/testAssets';
import { TestResult } from '../types';

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    dangerTypes: string[];
    onAddDangerType: (type: string) => void;
    onRemoveDangerType: (type: string) => void;
    onTriggerDanger: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, dangerTypes, onAddDangerType, onRemoveDangerType, onTriggerDanger }) => {
    const [newDangerType, setNewDangerType] = useState('');
    const [isTesting, setIsTesting] = useState(false);
    const [testResults, setTestResults] = useState<TestResult[]>([]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newDangerType.trim()) {
            onAddDangerType(newDangerType.trim());
            setNewDangerType('');
        }
    };

    const handleTriggerDanger = () => {
        onTriggerDanger();
        onClose();
    };

    const runTests = async () => {
        setIsTesting(true);
        setTestResults([]);

        const results: TestResult[] = [];
        for (const testCase of testAssets) {
            // Add a small delay between API calls to avoid rate limiting if necessary
            await new Promise(resolve => setTimeout(resolve, 250)); 
            const result = await analyzeAudioForDistress(testCase.data, testCase.mimeType, dangerTypes);
            const passed = result.status === testCase.expected;
            results.push({
                name: testCase.name,
                expected: testCase.expected,
                actual: result.status,
                description: result.description,
                passed,
            });
        }
        
        setTestResults(results);
        setIsTesting(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 animate-fade-in-fast" role="dialog" aria-modal="true" aria-labelledby="admin-panel-title">
            <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <header className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                    <h2 id="admin-panel-title" className="text-xl font-bold text-cyan-400">Admin Panel</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close Admin Panel">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </header>

                <div className="p-6 space-y-8 overflow-y-auto">
                    {/* Danger Types Section */}
                    <section aria-labelledby="danger-types-heading">
                        <h3 id="danger-types-heading" className="text-lg font-semibold text-gray-300 mb-3">Manage Danger Types</h3>
                        <p className="text-sm text-gray-400 mb-4">Add or remove keywords for sounds to monitor. This will change the AI's analysis prompt.</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {dangerTypes.length > 0 ? dangerTypes.map(type => (
                                <span key={type} className="flex items-center bg-gray-700 text-gray-200 text-sm font-medium px-3 py-1 rounded-full">
                                    {type}
                                    <button onClick={() => onRemoveDangerType(type)} className="ml-2 text-gray-400 hover:text-white">
                                        <XMarkIcon className="h-4 w-4" />
                                    </button>
                                </span>
                            )) : <p className="text-gray-500 text-sm">No danger types defined.</p>}
                        </div>
                        <form onSubmit={handleAdd} className="flex gap-2">
                            <input
                                type="text"
                                value={newDangerType}
                                onChange={(e) => setNewDangerType(e.target.value)}
                                placeholder="Add a new danger type (e.g., gunshot)"
                                className="flex-grow bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                            />
                            <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded-md transition-colors">Add</button>
                        </form>
                    </section>

                    {/* Self Test Section */}
                    <section aria-labelledby="self-test-heading">
                        <div className="border-t border-gray-700 pt-6">
                            <h3 id="self-test-heading" className="text-lg font-semibold text-gray-300 mb-3">System Self-Test</h3>
                             <p className="text-sm text-gray-400 mb-4">Run a test using pre-defined audio samples to check if the AI correctly identifies dangers based on the current configuration.</p>
                            <button onClick={runTests} disabled={isTesting} className="w-full flex justify-center items-center py-2 px-4 text-base font-semibold rounded-lg shadow-md transition-all duration-300 bg-indigo-600 hover:bg-indigo-500 focus:ring-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                {isTesting ? <><ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> Running Test...</> : 'Run Test'}
                            </button>
                        </div>

                        {testResults.length > 0 && (
                             <div className="mt-6 space-y-2">
                                {testResults.map(result => (
                                    <div key={result.name} className={`p-3 rounded-lg flex items-start gap-4 ${result.passed ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                                        <div className="flex-shrink-0 mt-1">
                                            {result.passed ? <CheckCircleIcon className="h-5 w-5 text-green-400" /> : <XCircleIcon className="h-5 w-5 text-red-400" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-200">{result.name}</p>
                                            <p className="text-sm text-gray-400">
                                                Expected: <span className="font-mono p-1 bg-gray-700/50 rounded text-xs">{result.expected}</span>, 
                                                Got: <span className="font-mono p-1 bg-gray-700/50 rounded text-xs">{result.actual}</span>
                                            </p>
                                            {!result.passed && result.description && <p className="text-sm text-red-300 mt-1">AI Reason: "{result.description}"</p>}
                                        </div>
                                         <div className={`ml-auto text-sm font-bold px-2 py-1 rounded-full ${result.passed ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                            {result.passed ? 'PASS' : 'FAIL'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Manual Trigger Section */}
                    <section aria-labelledby="manual-trigger-heading">
                        <div className="border-t border-gray-700 pt-6">
                            <h3 id="manual-trigger-heading" className="text-lg font-semibold text-gray-300 mb-3">Manual System Triggers</h3>
                            <p className="text-sm text-gray-400 mb-4">Manually trigger system states for testing purposes. This will activate all associated alerts.</p>
                            <button
                                onClick={handleTriggerDanger}
                                className="w-full flex justify-center items-center py-2 px-4 text-base font-semibold rounded-lg shadow-md transition-all duration-300 bg-red-700 hover:bg-red-600 focus:ring-red-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800"
                            >
                                <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                                Trigger DANGER Alert
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
