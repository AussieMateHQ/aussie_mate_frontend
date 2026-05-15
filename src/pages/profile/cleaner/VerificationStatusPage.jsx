import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { PageHeader, Loader, PageLayout } from '../../../components';
import PdfIcon from '../../../assets/pdf.svg';
import CalendarIcon from '../../../assets/Calendar.svg';
import InfoIcon from '../../../assets/info.svg';
import { userAPI } from '../../../services/api';

const Pill = ({ label, tone = 'gray' }) => {
    const toneClasses = {
        green: 'bg-green-100 text-green-700 border-green-200',
        yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        red: 'bg-red-100 text-red-700 border-red-200',
        gray: 'bg-gray-100 text-gray-700 border-gray-200',
    }[tone];

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${toneClasses}`}>{label}</span>
    );
};

const RowMeta = ({ icon, text }) => (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <img src={icon} alt="" className="w-3.5 h-3.5 opacity-60" />
        <span>{text}</span>
    </div>
);

const DocumentRow = ({ name, status, uploadedAt, expiry, tone, actionText = 'Replace File', onReplaceFile, docType }) => {
    const inputRef = useRef(null);

    const handleReplaceClick = () => {
        inputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file && onReplaceFile) {
            onReplaceFile(file, docType);
        }
    };

    return (
        <div className="w-full rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <img src={PdfIcon} alt="PDF" className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm sm:text-base font-semibold text-gray-900 truncate">{name}</span>
                        <div className="flex items-center gap-3 mt-1 overflow-x-auto no-scrollbar">
                            {uploadedAt && <RowMeta icon={CalendarIcon} text={`Uploaded: ${uploadedAt}`} />}
                            {expiry && <RowMeta icon={CalendarIcon} text={`Expiry: ${expiry}`} />}
                        </div>
                    </div>
                </div>
                <Pill label={status} tone={tone} />
            </div>
            
            <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-1">
                <button
                    type="button"
                    onClick={handleReplaceClick}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors cursor-pointer uppercase tracking-wide"
                >
                    {actionText}
                </button>
                
                <input
                    ref={inputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};


const VerificationStatusPage = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditingAbn, setIsEditingAbn] = useState(false);
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [tempAbn, setTempAbn] = useState('');
    const [tempBio, setTempBio] = useState('');

    // Fetch documents on component mount
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getDocumentStatus();
            if (response.success) {
                setDocuments(response.data);
            } else {
                setError('Failed to fetch documents');
            }
        } catch (error) {
            console.error('Error fetching documents:', error);
            setError('Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    const getDocumentStatus = (docType) => {
        if (!documents?.documents) return { status: 'Not Uploaded', tone: 'gray' };

        const doc = documents.documents[docType];
        if (!doc) return { status: 'Not Uploaded', tone: 'gray' };

        switch (doc.status) {
            case 'approved':
            case 'verified': return { status: 'Verified', tone: 'green' };
            case 'pending_review': return { status: 'Pending', tone: 'yellow' };
            case 'rejected': return { status: 'Rejected', tone: 'red' };
            default: return { status: 'Not Uploaded', tone: 'gray' };
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };


    const handleReplaceFile = async (file, docType) => {
        if (!file) return;

        try {
            setLoading(true);
            const formData = new FormData();

            // Map document types to the expected field names
            const fieldMapping = {
                'policeCheck': 'policeCheck',
                'visaWorkRights': 'visaWorkRights',
                'trainingCertificates': 'trainingCertificates',
                'photoId': 'photoId',
            };

            const fieldName = fieldMapping[docType];
            if (fieldName) {
                formData.append(fieldName, file);
            }

            const response = await userAPI.verifyDocuments(formData);
            if (response.success) {
                fetchDocuments(); // Refresh documents
            } else {
                setError(response.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setError('Upload failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAbn = async () => {
        try {
            setLoading(true);
            const response = await userAPI.verifyDocuments({ abnNumber: tempAbn });
            if (response.success) {
                setIsEditingAbn(false);
                fetchDocuments();
            } else {
                setError(response.message || 'Update failed');
            }
        } catch (error) {
            console.error('Update error:', error);
            setError('Update failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBio = async () => {
        try {
            setLoading(true);
            const response = await userAPI.verifyDocuments({ bio: tempBio });
            if (response.success) {
                setIsEditingBio(false);
                fetchDocuments();
            } else {
                setError(response.message || 'Update failed');
            }
        } catch (error) {
            console.error('Update error:', error);
            setError('Update failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageLayout className="bg-[#FAFAFA] min-h-screen">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <PageHeader
                    title="Verification & Documents"
                    onBack={() => navigate(-1)}
                    className="mb-6 bg-transparent"
                    titleClassName="text-xl sm:text-2xl font-bold text-gray-900"
                />

                <div className="space-y-6">
                {/* ABN verified card */}
                {documents?.documents?.abnNumber !== undefined && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">ABN Details</h3>
                                    {!isEditingAbn && (
                                        (documents?.documents?.abnVerified || documents?.verificationStatus === 'verified') ? (
                                            <Pill label="Verified" tone="green" />
                                        ) : (
                                            <Pill label="Pending" tone="yellow" />
                                        )
                                    )}
                                </div>
                                {!isEditingAbn && (
                                    <button
                                        onClick={() => {
                                            setTempAbn(documents?.documents?.abnNumber || '');
                                            setIsEditingAbn(true);
                                        }}
                                        className="text-xs font-bold text-primary-600 hover:text-primary-700 underline cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            {isEditingAbn ? (
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="text"
                                        value={tempAbn}
                                        onChange={(e) => setTempAbn(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Enter ABN Number"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => setIsEditingAbn(false)}
                                            className="px-4 py-2 text-xs font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveAbn}
                                            className="px-4 py-2 text-xs font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-base text-gray-600 font-medium">
                                    {documents?.documents?.abnNumber || 'Not specified'}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Bio Section */}
                {documents?.documents?.bio !== undefined && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Bio / Introduction</h3>
                                {!isEditingBio && (
                                    <button
                                        onClick={() => {
                                            setTempBio(documents?.documents?.bio || '');
                                            setIsEditingBio(true);
                                        }}
                                        className="text-xs font-bold text-primary-600 hover:text-primary-700 underline cursor-pointer"
                                    >
                                        Edit
                                    </button>
                                )}
                            </div>
                            {isEditingBio ? (
                                <div className="flex flex-col gap-3">
                                    <textarea
                                        value={tempBio}
                                        onChange={(e) => setTempBio(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm min-h-[120px] focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Enter your Bio"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => setIsEditingBio(false)}
                                            className="px-4 py-2 text-xs font-bold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveBio}
                                            className="px-4 py-2 text-xs font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                    {documents?.documents?.bio || 'No bio provided yet.'}
                                </p>
                            )}
                        </div>
                    </div>
                )}


                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <Loader message="Refreshing verification status..." />
                )}

                {/* Document Sections */}
                {!loading && documents && (
                    <div className="grid grid-cols-1 gap-6">
                        {/* Police Check */}
                        {(() => {
                            const policeDoc = documents.documents?.policeCheck;
                            const policeStatus = getDocumentStatus('policeCheck');
                            return (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider px-1">Police Check</h3>
                                    <DocumentRow
                                        name={policeDoc?.fileName || 'Police Check.pdf'}
                                        status={policeStatus.status}
                                        tone={policeStatus.tone}
                                        uploadedAt={formatDate(policeDoc?.uploadedAt)}
                                        onReplaceFile={handleReplaceFile}
                                        docType="policeCheck"
                                    />
                                    {policeStatus.status === 'Rejected' && policeDoc?.rejectionReason && (
                                        <div className="mx-1 flex items-start gap-2 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                            <img src={InfoIcon} alt="Info" className="w-3.5 h-3.5 mt-0.5" />
                                            <span>{policeDoc.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Visa Document */}
                        {(() => {
                            const visaDoc = documents.documents?.visaWorkRights;
                            const visaStatus = getDocumentStatus('visaWorkRights');
                            return (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider px-1">Visa Status</h3>
                                    <DocumentRow
                                        name={visaDoc?.fileName || 'Visa.pdf'}
                                        status={visaStatus.status}
                                        tone={visaStatus.tone}
                                        uploadedAt={formatDate(visaDoc?.uploadedAt)}
                                        onReplaceFile={handleReplaceFile}
                                        docType="visaWorkRights"
                                    />
                                    {visaStatus.status === 'Rejected' && visaDoc?.rejectionReason && (
                                        <div className="mx-1 flex items-start gap-2 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                            <img src={InfoIcon} alt="Info" className="w-3.5 h-3.5 mt-0.5" />
                                            <span>{visaDoc.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Training Certificates */}
                        {(() => {
                            const trainingDoc = documents.documents?.trainingCertificates;
                            const trainingStatus = getDocumentStatus('trainingCertificates');
                            return (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider px-1">Training Certificates</h3>
                                    <DocumentRow
                                        name={trainingDoc?.fileName || 'Training Certificates.pdf'}
                                        status={trainingStatus.status}
                                        tone={trainingStatus.tone}
                                        uploadedAt={formatDate(trainingDoc?.uploadedAt)}
                                        onReplaceFile={handleReplaceFile}
                                        docType="trainingCertificates"
                                    />
                                    {trainingStatus.status === 'Rejected' && trainingDoc?.rejectionReason && (
                                        <div className="mx-1 flex items-start gap-2 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                            <img src={InfoIcon} alt="Info" className="w-3.5 h-3.5 mt-0.5" />
                                            <span>{trainingDoc.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Photo ID */}
                        {(() => {
                            const photoIdDoc = documents.documents?.photoId;
                            const photoIdStatus = getDocumentStatus('photoId');
                            return (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider px-1">Photo ID</h3>
                                    <DocumentRow
                                        name={photoIdDoc?.fileName || 'Photo ID.pdf'}
                                        status={photoIdStatus.status}
                                        tone={photoIdStatus.tone}
                                        uploadedAt={formatDate(photoIdDoc?.uploadedAt)}
                                        onReplaceFile={handleReplaceFile}
                                        docType="photoId"
                                    />
                                    {photoIdStatus.status === 'Rejected' && photoIdDoc?.rejectionReason && (
                                        <div className="mx-1 flex items-start gap-2 text-xs text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                            <img src={InfoIcon} alt="Info" className="w-3.5 h-3.5 mt-0.5" />
                                            <span>{photoIdDoc.rejectionReason}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Verification Success / Next Steps */}
                {documents?.isVerified && (
                    <div className="mt-8 p-6 bg-green-50 border border-green-100 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <AlertCircle className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-green-900">Verification Successful!</h3>
                                <p className="text-sm text-green-700">You are now verified and can start working.</p>
                            </div>
                        </div>
                        {documents?.nextSteps?.length > 0 && (
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-green-100">
                                <p className="text-sm font-medium text-green-900">Next Steps:</p>
                                <ul className="space-y-2">
                                    {documents.nextSteps.map((step, index) => (
                                        <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                                            {step}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Expiry Warning */}
                {!documents?.isVerified && (
                    <div className="mt-8 p-5 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                                <img src={InfoIcon} className="w-6 h-6" alt="Info" />
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-blue-900 mb-1">Verification Status</h4>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    Please ensure all documents are up to date. Verified cleaners get more jobs and higher trust ratings from customers.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </PageLayout>
);
};

export default VerificationStatusPage;



