import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Shield, UserX, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Legal Information | Biosell",
  description: "Legal information, policies, and terms for Biosell",
};

const LegalIndexPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Legal Information</h1>
        <p className="text-gray-700 mb-8">
          Welcome to Biosell&apos;s legal center. Here you can find information about our policies, terms, and other legal documents.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <Link 
            href="/legal/privacy-policy" 
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center mb-4">
              <Shield size={24} className="text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Privacy Policy</h2>
            </div>
            <p className="text-gray-600 flex-grow">
              Learn how we collect, use, and protect your personal information when you use our services.
            </p>
            <div className="mt-4 text-indigo-600 font-medium">
              Read Privacy Policy →
            </div>
          </Link>

          <Link 
            href="/legal/terms-of-service" 
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center mb-4">
              <FileText size={24} className="text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Terms of Service</h2>
            </div>
            <p className="text-gray-600 flex-grow">
              Understand the rules, guidelines, and agreements that govern the use of Biosell&apos;s services.
            </p>
            <div className="mt-4 text-indigo-600 font-medium">
              Read Terms of Service →
            </div>
          </Link>

          <Link 
            href="/legal/data-deletion" 
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center mb-4">
              <UserX size={24} className="text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">Data Deletion</h2>
            </div>
            <p className="text-gray-600 flex-grow">
              Learn how to request deletion of your personal data from our systems and how we process such requests.
            </p>
            <div className="mt-4 text-indigo-600 font-medium">
              View Data Deletion Instructions →
            </div>
          </Link>

          <Link 
            href="/legal/category" 
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center mb-4">
              <Tag size={24} className="text-indigo-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-800">App Category</h2>
            </div>
            <p className="text-gray-600 flex-grow">
              Information about Biosell&apos;s app category, features, and target audience.
            </p>
            <div className="mt-4 text-indigo-600 font-medium">
              View Category Information →
            </div>
          </Link>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-4">
            If you have any questions about our legal information, please contact us at:
          </p>
          <p className="text-gray-700">
            <a href="mailto:the.only.apada@gmail.com" className="text-indigo-600 hover:text-indigo-800">
              the.only.apada@gmail.com
            </a>
          </p>
          <div className="mt-6">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalIndexPage; 