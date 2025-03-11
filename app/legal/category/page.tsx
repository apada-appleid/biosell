import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "App Category | Biosell",
  description: "Category information for Biosell - Automated response service for businesses",
};

const CategoryPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-6 mb-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">App Category Information</h1>
        <p className="text-gray-700 mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Primary Category</h2>
          <p className="text-gray-700 mb-3">
            <span className="font-medium">Business</span>
          </p>
          <p className="text-gray-700 mb-3">
            Biosell is primarily categorized as a Business application as it provides automated response
            services for business users and helps them manage customer interactions efficiently.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Sub-Category</h2>
          <p className="text-gray-700 mb-3">
            <span className="font-medium">Customer Service & CRM</span>
          </p>
          <p className="text-gray-700 mb-3">
            Within the Business category, Biosell falls under the Customer Service & CRM sub-category
            as it specializes in automating responses to customer comments and direct messages on social media platforms.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Core Features</h2>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li className="mb-2">
              <span className="font-medium">Automated Responses:</span> Automatically respond to customer inquiries on social media platforms
            </li>
            <li className="mb-2">
              <span className="font-medium">Message Management:</span> Organize and manage customer messages efficiently
            </li>
            <li className="mb-2">
              <span className="font-medium">Response Templates:</span> Create and customize response templates for common questions
            </li>
            <li className="mb-2">
              <span className="font-medium">Analytics Dashboard:</span> Track customer engagement and response metrics
            </li>
            <li className="mb-2">
              <span className="font-medium">Multi-platform Support:</span> Integrate with various social media platforms
            </li>
            <li className="mb-2">
              <span className="font-medium">Business Account Management:</span> Manage multiple business accounts from a single dashboard
            </li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Target Audience</h2>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Small and medium-sized businesses</li>
            <li>Social media managers</li>
            <li>E-commerce store owners</li>
            <li>Customer service teams</li>
            <li>Digital marketers</li>
            <li>Content creators with business accounts</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Accessibility Features</h2>
          <ul className="list-disc pl-6 mb-3 text-gray-700">
            <li>Screen reader compatibility</li>
            <li>Keyboard navigation support</li>
            <li>High contrast mode</li>
            <li>Text scaling</li>
            <li>RTL language support</li>
          </ul>
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

export default CategoryPage; 