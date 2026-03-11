import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const DentalUpload = () => {
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [details, setDetails] = useState({
        case_type: "study_model",
        patient_id: "",
        dentist_name: "",
        clinic_name: "",
        special_instructions: ""
    });

    const [validationResult, setValidationResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleChange = (e) => {
        setDetails({ ...details, [e.target.name]: e.target.value });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return alert("Please select a scan file");

        setUploading(true);
        try {
            // 1. Upload File
            const formData = new FormData();
            formData.append("file", file);
            formData.append("category", "dental");
            formData.append("service_type", "printing");
            formData.append("user_tier", "dental"); // assuming dental tier

            console.log("Uploading file...");
            const uploadRes = await axios.post("http://localhost:8000/api/uploads/", formData);
            const uploadId = uploadRes.data.upload_id;

            // 2. Validate Scan
            console.log("Validating scan...", uploadId);
            const validationPayload = {
                upload_id: uploadId,
                case_details: details,
                scan_quality: "good"
            };

            const validateRes = await axios.post("http://localhost:8000/api/dental/validate-scan", validationPayload);

            setValidationResult(validateRes.data);

            if (validateRes.data.validation_status === "valid" || validateRes.data.validation_status === "flagged") {
                // Determine next step based on result
                // For now, show result
            }

        } catch (error) {
            console.error("Dental upload failed", error);
            alert("Upload failed: " + (error.response?.data?.detail || error.message));
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white pt-24 pb-12 px-4">
            <div className="max-w-4xl mx-auto">

                <h1 className="text-3xl font-bold text-blue-400 mb-2">Dental Lab Workflow</h1>
                <p className="text-gray-400 mb-8">Secure upload for diagnostic models, surgical guides, and aligners.</p>

                {!validationResult ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Form */}
                        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-xl">
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Case Type</label>
                                    <select
                                        name="case_type"
                                        value={details.case_type}
                                        onChange={handleChange}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="study_model">Study Model</option>
                                        <option value="crown">Crown / Bridge</option>
                                        <option value="surgical_guide">Surgical Guide</option>
                                        <option value="full_arch">Full Arch Model</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Patient ID / Ref</label>
                                        <input
                                            type="text"
                                            name="patient_id"
                                            value={details.patient_id}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none"
                                            placeholder="PT-XXXX"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Dentist Name</label>
                                        <input
                                            type="text"
                                            name="dentist_name"
                                            value={details.dentist_name}
                                            onChange={handleChange}
                                            required
                                            className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none"
                                            placeholder="Dr. Smith"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Clinic Name</label>
                                    <input
                                        type="text"
                                        name="clinic_name"
                                        value={details.clinic_name}
                                        onChange={handleChange}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white outline-none"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div className="p-4 border-2 border-dashed border-gray-600 rounded-xl hover:border-blue-500 transition-colors bg-gray-800/50">
                                    <label className="cursor-pointer block text-center">
                                        <span className="text-gray-400 block mb-2">Upload Scan (STL/OBJ/PLY)</span>
                                        <input
                                            type="file"
                                            accept=".stl,.obj,.ply"
                                            onChange={handleFileChange}
                                            required
                                            className="hidden"
                                        />
                                        <span className="bg-gray-700 px-4 py-2 rounded-lg text-sm text-blue-300 inline-block font-medium">
                                            {file ? file.name : "Select File"}
                                        </span>
                                    </label>
                                </div>

                                <div className="bg-yellow-900/20 border border-yellow-700/50 p-3 rounded-lg flex gap-3 text-sm text-yellow-200">
                                    <span className="text-xl">⚠️</span>
                                    <p>I confirm this scan contains no personally identifiable information (PII) other than the Patient ID reference.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg ${uploading ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-500'} transition-all`}
                                >
                                    {uploading ? "Processing Analysis..." : "Validate & Upload Case"}
                                </button>
                            </form>
                        </div>

                        {/* Info Panel */}
                        <div className="space-y-6">
                            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                                <h3 className="font-bold text-lg mb-4">Requirements</h3>
                                <ul className="space-y-3 text-gray-300 text-sm">
                                    <li className="flex items-center gap-2">✅ Files must be in mm units</li>
                                    <li className="flex items-center gap-2">✅ Watertight mesh required</li>
                                    <li className="flex items-center gap-2">✅ Minimum 50 micron resolution</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl max-w-2xl mx-auto">
                        <div className="text-center mb-6">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${validationResult.validation_status === 'valid' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                                <span className="text-3xl">{validationResult.validation_status === 'valid' ? '✓' : '⚠️'}</span>
                            </div>
                            <h2 className="text-2xl font-bold">Analysis Complete</h2>
                            <p className="text-gray-400">Case ID: {validationResult.case_id}</p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between p-3 bg-gray-900 rounded-lg">
                                <span className="text-gray-400">Scan Quality</span>
                                <span className="font-bold">{validationResult.validation_results?.quality_score}/10</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-900 rounded-lg">
                                <span className="text-gray-400">Volume</span>
                                <span>{validationResult.scan_analysis?.volume_cm3?.toFixed(2)} cm³</span>
                            </div>
                            <div className="flex justify-between p-3 bg-gray-900 rounded-lg">
                                <span className="text-gray-400">Estimated Price</span>
                                <span className="font-bold text-green-400">₹{validationResult.pricing?.final_price}</span>
                            </div>
                        </div>

                        <div className="space-y-2 mb-8">
                            {validationResult.validation_results?.issues?.map((issue, i) => (
                                <div key={i} className="text-red-400 text-sm flex gap-2">
                                    <span>❌</span> {issue}
                                </div>
                            ))}
                            {validationResult.validation_results?.recommendations?.map((rec, i) => (
                                <div key={i} className="text-blue-300 text-sm flex gap-2">
                                    <span>💡</span> {rec}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate("/dashboard")}
                            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold"
                        >
                            Proceed to Approval
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DentalUpload;
