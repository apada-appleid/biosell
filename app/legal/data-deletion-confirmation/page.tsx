import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Data Deletion Confirmation | Biosell",
  description: "Confirmation of your data deletion request for Biosell",
};

const DataDeletionConfirmationPage = () => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white shadow-sm rounded-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-3 rounded-full">
            <Check size={36} className="text-green-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Data Deletion Request Received</h1>
        
        <div className="mb-6 text-gray-600">
          <p className="mb-4">
            We have successfully received your request to delete your personal data from Biosell.
          </p>
          <p className="mb-4">
            Your request is now being processed, and all applicable personal information will be deleted or anonymized in accordance with our Privacy Policy and applicable laws.
          </p>
          <p>
            You will receive a confirmation email once the deletion process has been completed.
          </p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-md mb-6">
          <h2 className="font-medium text-blue-800 mb-2">Request Details</h2>
          <p className="text-sm text-blue-700">
            Request ID: <span className="font-mono">{getRequestCode()}</span><br />
            Submission Date: {new Date().toLocaleDateString()}<br />
            Estimated Completion: Within 30 days
          </p>
        </div>
        
        <div className="border-t border-gray-200 pt-6">
          <Link 
            href="/" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft size={16} className="mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper function to get the request code from URL parameter or generate a fallback
const getRequestCode = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    return code || `REQ-${Date.now().toString().slice(-6)}`;
  }
  return `REQ-${Date.now().toString().slice(-6)}`;
};

export default DataDeletionConfirmationPage; 