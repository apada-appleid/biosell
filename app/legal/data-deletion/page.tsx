import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Data Deletion | Biosell",
  description: "Data Deletion Instructions for Biosell - Automated response service for businesses",
};

const DataDeletionPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Data Deletion Instructions</h1>
        <p className="text-gray-700 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Your Rights to Your Data</h2>
          <p className="text-gray-700 mb-3">
            At Biosell, we respect your rights regarding your personal data. You have the right to request deletion of your personal information from our systems.
          </p>
          <p className="text-gray-700 mb-3">
            In accordance with various data protection regulations, including but not limited to the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA), we provide this straightforward process for requesting data deletion.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">What Data Can Be Deleted</h2>
          <p className="text-gray-700 mb-3">
            Upon your request, we can delete:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Your account and profile information</li>
            <li>Content you've created or uploaded</li>
            <li>Communication history</li>
            <li>Usage data associated with your account</li>
            <li>Payment information</li>
            <li>Automated responses and templates</li>
          </ul>
          <p className="text-gray-700 mb-3">
            Please note that we may retain certain information as required by law or for legitimate business purposes, such as:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Information necessary for tax, legal, or accounting purposes</li>
            <li>Aggregated or anonymized data that does not identify you</li>
            <li>Information necessary to detect and prevent fraudulent activity</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">How to Request Data Deletion</h2>
          <p className="text-gray-700 mb-3">
            You can request deletion of your data through the following methods:
          </p>
          <ol className="list-decimal pl-6 mb-3 text-gray-700">
            <li className="mb-2">
              <strong>From your account settings:</strong>
              <p>Log in to your Biosell account, navigate to "Settings" &gt; "Privacy" &gt; "Delete My Data".</p>
            </li>
            <li className="mb-2">
              <strong>By email:</strong>
              <p>Send a request to <a href="mailto:the.only.apada@gmail.com" className="text-indigo-600 hover:text-indigo-800">the.only.apada@gmail.com</a> with the subject line "Data Deletion Request" and include your account information.</p>
            </li>
            <li className="mb-2">
              <strong>Using our automated callback URL:</strong>
              <p>If you're coming from a platform that supports data deletion callback (e.g., Facebook), we will process your request automatically through our secure API endpoint.</p>
            </li>
          </ol>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Data Deletion Timeline</h2>
          <p className="text-gray-700 mb-3">
            Upon receiving your data deletion request:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>We will acknowledge your request within 7 business days</li>
            <li>Your data will be marked for deletion immediately</li>
            <li>The deletion process will be completed within 30 days</li>
            <li>You will receive confirmation when your data has been deleted</li>
          </ul>
          <p className="text-gray-700 mb-3">
            Some data may be retained in backup systems for a limited period but will be overwritten according to our regular backup cycle.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Verification Process</h2>
          <p className="text-gray-700 mb-3">
            To protect your privacy and security, we may need to verify your identity before processing your deletion request. This may include:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Confirming the email address associated with your account</li>
            <li>Requesting additional information to confirm your identity</li>
            <li>For business accounts, verifying that the requester has authorization to request deletion</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Third-Party Data</h2>
          <p className="text-gray-700 mb-3">
            While we can delete the data stored in our systems, please note that:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>We cannot delete your data from third-party services you've connected to your Biosell account</li>
            <li>You may need to contact these third parties separately to request deletion of your data</li>
            <li>We will provide information about which third parties may have your data upon request</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Data Deletion API Callback</h2>
          <p className="text-gray-700 mb-3">
            For platform integrations requiring a callback URL (such as Facebook's Data Deletion Request), our endpoint is:
          </p>
          <div className="bg-gray-100 p-3 rounded-md mb-3">
            <code className="text-sm break-all">https://biosell.me/api/data-deletion/callback</code>
          </div>
          <p className="text-gray-700 mb-3">
            This endpoint accepts requests with the following parameters:
          </p>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li><code>user_id</code>: The platform-specific user identifier</li>
            <li><code>confirmation_code</code>: A unique code generated for the deletion request</li>
            <li><code>platform</code>: The originating platform (e.g., "facebook", "instagram")</li>
          </ul>
          <p className="text-gray-700 mb-3">
            Our system will respond with a status code and confirmation message upon successful processing of the request.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Contact Us</h2>
          <p className="text-gray-700 mb-3">
            If you have any questions about data deletion or need assistance with your request, please contact us at:
          </p>
          <p className="text-gray-700 mb-3">
            Email: <a href="mailto:the.only.apada@gmail.com" className="text-indigo-600 hover:text-indigo-800">the.only.apada@gmail.com</a><br />
            Website: <a href="https://biosell.me" className="text-indigo-600 hover:text-indigo-800">https://biosell.me</a>
          </p>
        </section>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/" className="text-indigo-600 hover:text-indigo-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DataDeletionPage; 