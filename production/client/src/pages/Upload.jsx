import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload as UploadIcon, Cube, Image as ImageIcon, CheckCircle, Loader2 } from 'lucide-react';
import axios from 'axios';
import ThreeViewer from '../components/3d/ThreeViewer';

const Upload = () => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [slicingProgress, setSlicingProgress] = useState(0);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        setFile(selected);
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            // Fake progress for UX
            const interval = setInterval(() => {
                setSlicingProgress(prev => (prev < 90 ? prev + 10 : prev));
            }, 500);

            const res = await axios.post('http://localhost:5000/api/upload', formData);

            clearInterval(interval);
            setSlicingProgress(100);

            setTimeout(() => {
                setResult(res.data);
                setIsUploading(false);
            }, 1000);
        } catch (err) {
            console.error(err);
            setIsUploading(false);
            alert('Error uploading file');
        }
    };

    return (
        <div className="container mx-auto px-6 py-32">
            <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-2">Production Queue</h2>
                <p className="text-gray-400 mb-10">Upload STL or Photo for instant geometric analysis</p>

                {!result ? (
                    <div className="glass-panel p-12 rounded-3xl border-dashed border-2 border-white/10 flex flex-col items-center text-center">
                        {!isUploading ? (
                            <>
                                <div className="w-20 h-20 bg-brand-accent/10 rounded-full flex items-center justify-center mb-6">
                                    <UploadIcon className="text-brand-accent" size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-4">DRAG & DROP FILES</h3>
                                <p className="text-gray-500 mb-8 text-sm">Supported formats: STL, OBJ, JPG, PNG</p>
                                <input
                                    type="file"
                                    id="fileInput"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <label
                                    htmlFor="fileInput"
                                    className="cursor-pointer px-8 py-3 border border-brand-accent text-brand-accent rounded-md font-tech hover:bg-brand-accent/5 transition-all"
                                >
                                    {file ? file.name : "SELECT FILE"}
                                </label>
                                {file && (
                                    <button
                                        onClick={handleUpload}
                                        className="mt-6 px-10 py-4 bg-brand-accent text-black font-tech rounded-md glow-btn"
                                    >
                                        INITIALIZE ANALYSIS
                                    </button>
                                )}
                            </>
                        ) : (
                            <div className="w-full max-w-md">
                                <Loader2 className="animate-spin text-brand-accent mx-auto mb-6" size={48} />
                                <h3 className="text-xl font-tech text-brand-accent mb-2">SLICING IN PROGRESS...</h3>
                                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-6">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${slicingProgress}%` }}
                                        className="h-full bg-brand-accent"
                                    ></motion.div>
                                </div>
                                <div className="mt-4 flex justify-between text-[10px] text-gray-500 font-tech">
                                    <span>G-CODE GENERATION</span>
                                    <span>{slicingProgress}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid lg:grid-cols-3 gap-8"
                    >
                        <div className="lg:col-span-2">
                            <ThreeViewer />
                        </div>
                        <div className="glass-panel p-8 rounded-3xl flex flex-col">
                            <div className="flex items-center gap-2 text-brand-accent mb-6">
                                <CheckCircle size={18} />
                                <span className="font-tech text-xs">ANALYSIS COMPLETE</span>
                            </div>
                            <h3 className="text-2xl font-bold mb-1 uppercase">{result.fileName}</h3>
                            <div className="text-[10px] text-gray-500 font-tech mb-8">MODEL_ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-xs text-gray-400">FILAMENT USE</span>
                                    <span className="text-white font-tech">{result.grams}g</span>
                                </div>
                                <div className="flex justify-between p-3 bg-white/5 rounded-lg">
                                    <span className="text-xs text-gray-400">PRINT TIME</span>
                                    <span className="text-white font-tech">{Math.floor(result.printTime / 3600)}h {Math.floor((result.printTime % 3600) / 60)}m</span>
                                </div>
                                <div className="flex justify-between p-3 bg-white/5 rounded-lg border border-brand-accent/20">
                                    <span className="text-xs text-brand-accent font-bold">PRODUCTION PRICE</span>
                                    <span className="text-white font-tech">₹{result.estimatedPrice}</span>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-brand-accent text-black font-tech rounded-md mt-auto shadow-[0_0_20px_rgba(0,242,255,0.2)]">
                                PROCEED TO CHECKOUT
                            </button>
                            <button
                                onClick={() => setResult(null)}
                                className="w-full py-3 text-gray-500 font-tech text-xs mt-4 hover:text-white transition-all"
                            >
                                UPLOAD NEW VERSION
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Upload;
