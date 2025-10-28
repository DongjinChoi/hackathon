import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DetectionStatus, LogEntry } from './types';
import { analyzeAudioForDistress } from './services/geminiService';
import { blobToBase64 } from './services/geminiService';
import { controlLight, getLightStatus } from './services/smartThingsService';
import StatusDisplay from './components/StatusDisplay';
import LogDisplay from './components/LogDisplay';
import AdminPanel from './components/AdminPanel';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import LightIndicator from './components/LightIndicator';
import VolumeIndicator from './components/VolumeIndicator';


const RECORDING_INTERVAL_MS = 5000; // Record 5-second chunks

const App: React.FC = () => {
    const [status, setStatus] = useState<DetectionStatus>(DetectionStatus.IDLE);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [dangerDescription, setDangerDescription] = useState<string | null>(null);
    const [isAdminOpen, setIsAdminOpen] = useState(false);
    const [micVolume, setMicVolume] = useState(0);
    const [lightState, setLightState] = useState<'on' | 'off' | 'unknown'>('unknown');
    const [dangerTypes, setDangerTypes] = useState<string[]>(() => {
        try {
            const savedTypes = localStorage.getItem('dangerTypes');
            return savedTypes ? JSON.parse(savedTypes) : ['human distress', 'screams', 'shouts for help', 'loud groans', 'struggles'];
        } catch (error) {
            console.error("Failed to parse danger types from localStorage", error);
            return ['human distress', 'screams', 'shouts for help', 'loud groans', 'struggles'];
        }
    });

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioStreamRef = useRef<MediaStream | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const isMonitoringRef = useRef(false);
    const blinkingIntervalRef = useRef<number | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            const status = await getLightStatus();
            setLightState(status);
        };

        fetchStatus(); // Initial fetch
        const intervalId = setInterval(fetchStatus, 1000); // Poll every second for responsiveness

        return () => clearInterval(intervalId);
    }, []);

    const updateDangerTypes = useCallback((newTypes: string[]) => {
        setDangerTypes(newTypes);
        localStorage.setItem('dangerTypes', JSON.stringify(newTypes));
    }, []);

    const addDangerType = useCallback((type: string) => {
        const lowerCaseType = type.toLowerCase().trim();
        if (lowerCaseType && !dangerTypes.includes(lowerCaseType)) {
            updateDangerTypes([...dangerTypes, lowerCaseType]);
        }
    }, [dangerTypes, updateDangerTypes]);

    const removeDangerType = useCallback((typeToRemove: string) => {
        updateDangerTypes(dangerTypes.filter(type => type !== typeToRemove));
    }, [dangerTypes, updateDangerTypes]);


    const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [{ timestamp, message, type }, ...prev].slice(0, 100));
    }, []);

    const handleTriggerDanger = useCallback(() => {
        if (isMonitoringRef.current) {
            isMonitoringRef.current = false;
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                mediaRecorderRef.current.stop();
            }
            addLog("Monitoring loop stopped due to manual DANGER trigger.", "info");
        }
        
        addLog('DANGER state manually triggered from Admin Panel.', 'warn');
        setStatus(DetectionStatus.DANGER);
        setDangerDescription('Manual trigger from Admin Panel.');
        setErrorMessage(null);
    }, [addLog]);
    
    useEffect(() => {
        if (status === DetectionStatus.DANGER) {
            if (blinkingIntervalRef.current) {
                clearInterval(blinkingIntervalRef.current);
            }
            addLog('DANGER detected. Activating SmartThings light alert.', 'warn');
            
            let lightIsOn = false;
            controlLight('on'); // Immediately turn on
            lightIsOn = true;

            blinkingIntervalRef.current = window.setInterval(() => {
                controlLight(lightIsOn ? 'off' : 'on');
                lightIsOn = !lightIsOn;
            }, 1000); // 1 second on, 1 second off cycle

        } else {
            if (blinkingIntervalRef.current) {
                addLog('Danger cleared. Deactivating light alert.', 'info');
                clearInterval(blinkingIntervalRef.current);
                blinkingIntervalRef.current = null;
                controlLight('off'); 
            }
        }

        return () => {
            if (blinkingIntervalRef.current) {
                clearInterval(blinkingIntervalRef.current);
                controlLight('off'); 
            }
        };
    }, [status, addLog]);

    const recordChunk = useCallback(() => {
        if (mediaRecorderRef.current && isMonitoringRef.current) {
            mediaRecorderRef.current.start();
            setTimeout(() => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    mediaRecorderRef.current.stop();
                }
            }, RECORDING_INTERVAL_MS);
        }
    }, []);

    const processAudio = useCallback(async () => {
        if (audioChunksRef.current.length === 0) {
            if(isMonitoringRef.current) recordChunk();
            return;
        }

        setStatus(DetectionStatus.ANALYZING);
        addLog("Analyzing audio snippet...");

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];

        try {
            const base64Audio = await blobToBase64(audioBlob);
            const result = await analyzeAudioForDistress(base64Audio, audioBlob.type, dangerTypes);

            if (result.status === 'DANGER') {
                setStatus(DetectionStatus.DANGER);
                setDangerDescription(result.description);
                addLog(`Distress detected: ${result.description}`, 'warn');
            } else {
                setStatus(DetectionStatus.MONITORING);
                addLog("Audio safe. Resuming monitoring.");
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
            setErrorMessage(errorMessage);
            setStatus(DetectionStatus.ERROR);
            addLog(`Analysis failed: ${errorMessage}`, 'error');
        } finally {
            if (isMonitoringRef.current) {
                recordChunk();
            }
        }
    }, [addLog, dangerTypes, recordChunk]);

    const startMonitoring = useCallback(async () => {
        setErrorMessage(null);
        setDangerDescription(null);
        addLog("Starting monitoring...");

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const msg = "Media Devices API not supported.";
            setErrorMessage(msg);
            setStatus(DetectionStatus.ERROR);
            addLog(msg, 'error');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;

            // Setup for volume analysis
            const context = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = context.createMediaStreamSource(stream);
            const analyser = context.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            audioContextRef.current = context;
            analyserRef.current = analyser;

            // Setup for recording
            const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current = recorder;

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            recorder.onstop = processAudio;

            // Start volume visualization
            const draw = () => {
                if (!analyserRef.current) return;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteTimeDomainData(dataArray);

                let sumSquares = 0.0;
                for (const amplitude of dataArray) {
                    const normalized = (amplitude / 128.0) - 1.0;
                    sumSquares += normalized * normalized;
                }
                const rms = Math.sqrt(sumSquares / dataArray.length);
                setMicVolume(Math.min(rms * 2.5, 1.0)); // Amplify for better visualization

                animationFrameRef.current = requestAnimationFrame(draw);
            };
            draw();

            isMonitoringRef.current = true;
            setStatus(DetectionStatus.MONITORING);
            addLog("Microphone access granted. Monitoring active.");
            recordChunk();

        } catch (err) {
            const msg = "Microphone access denied or not available.";
            console.error(err);
            setErrorMessage(msg);
            setStatus(DetectionStatus.ERROR);
            addLog(msg, 'error');
        }
    }, [addLog, processAudio, recordChunk]);

    const stopMonitoring = useCallback(() => {
        isMonitoringRef.current = false;

        // Stop volume visualizer
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        setMicVolume(0);

        // Stop recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.onstop = null; // Prevent onstop from firing after manual stop
            mediaRecorderRef.current.stop();
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        mediaRecorderRef.current = null;
        audioChunksRef.current = [];
        
        setStatus(DetectionStatus.IDLE);
        setDangerDescription(null);
        setErrorMessage(null);
        addLog("Monitoring stopped by user.");
    }, [addLog]);

    const isActivelyListening = status === DetectionStatus.MONITORING || status === DetectionStatus.ANALYZING;

    return (
        <div className="min-h-screen text-white flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl mx-auto space-y-6">
                <header className="text-center">
                    <h1 className="text-4xl font-bold text-cyan-300">Silent Sentinel</h1>
                    <p className="text-gray-400 mt-2">AI-powered audio monitoring for enhanced safety.</p>
                </header>
                
                <main className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <StatusDisplay status={status} dangerDescription={dangerDescription} />
                        </div>
                        <LightIndicator status={status} lightState={lightState} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={startMonitoring}
                            disabled={status !== DetectionStatus.IDLE && status !== DetectionStatus.ERROR}
                            className="w-full py-4 px-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 bg-cyan-600 hover:bg-cyan-500 focus:ring-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-105 active:scale-100"
                        >
                            Start Monitoring
                        </button>
                        <button
                            onClick={stopMonitoring}
                            disabled={status === DetectionStatus.IDLE || status === DetectionStatus.ERROR || status === DetectionStatus.ANALYZING}
                            className="w-full py-4 px-6 text-lg font-semibold rounded-lg shadow-lg transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 bg-red-600 hover:bg-red-500 focus:ring-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:hover:scale-100 hover:scale-105 active:scale-100"
                        >
                            Stop Monitoring
                        </button>
                    </div>
                    {isActivelyListening && <VolumeIndicator volume={micVolume} />}
                    {errorMessage && (
                        <div className="bg-yellow-900/30 border border-yellow-400/30 text-yellow-300 p-4 rounded-lg text-center">
                            <p>{errorMessage}</p>
                        </div>
                    )}
                    <LogDisplay logs={logs} />
                </main>
                
                <footer className="text-center pt-4">
                    <button onClick={() => setIsAdminOpen(true)} className="inline-flex items-center text-gray-400 hover:text-cyan-300 transition-colors">
                        <Cog6ToothIcon className="h-5 w-5 mr-2" />
                        Admin Panel
                    </button>
                </footer>
            </div>
            
            <AdminPanel
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
                dangerTypes={dangerTypes}
                onAddDangerType={addDangerType}
                onRemoveDangerType={removeDangerType}
                onTriggerDanger={handleTriggerDanger}
            />
        </div>
    );
};

export default App;