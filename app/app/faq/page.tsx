'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'What is Geev?',
    answer:
      'Geev is a community-driven platform that connects people through giveaways and help requests. Users can create and participate in giveaways, request help from the community, and build their profile through meaningful interactions.',
  },
  {
    question: 'How do I get started?',
    answer:
      'You can sign up for a free account using your email, Google account, or by connecting a crypto wallet. Once registered, you can immediately create giveaways, browse help requests, and interact with the community.',
  },
  {
    question: 'Do I need to connect a wallet?',
    answer:
      'No, connecting a wallet is optional. You can use Geev with just an email account. However, wallet integration enables additional features like crypto giveaways and receiving rewards directly to your wallet.',
  },
  {
    question: 'How do giveaways work?',
    answer:
      'You can create a giveaway by selecting items, setting entry requirements, and choosing winners. Community members can enter giveaways to have a chance to win. Giveaways can include physical items, services, or crypto rewards.',
  },
  {
    question: 'What are help requests?',
    answer:
      'Help requests allow users to ask for assistance from the community. This could be advice, resources, opportunities, or support. Other users can respond and help by commenting, sharing resources, or taking action.',
  },
  {
    question: 'How do I earn badges and XP?',
    answer:
      'You earn XP and badges by being active on the platform: creating quality posts, helping others, receiving votes, and achieving milestones. Badges display your achievements and community contributions.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes, we take security seriously. Your personal data is encrypted and stored securely. We never store wallet private keys and use industry-standard security practices. See our Privacy Policy for more details.',
  },
  {
    question: 'Can I delete my account?',
    answer:
      'Yes, you can delete your account from your settings. Please note that this action is permanent and cannot be undone. Your posts and interactions will be preserved for community history.',
  },
  {
    question: 'How do I report inappropriate content?',
    answer:
      'You can report inappropriate content using the report button on any post or comment. Our moderation team reviews reports and takes action according to our community guidelines.',
  },
  {
    question: 'How can I contact support?',
    answer:
      'For technical issues or questions, please visit our Support page or email us. We aim to respond to inquiries within 24-48 hours.',
  },
];

function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-all"
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white text-left">{faq.question}</h3>
            <ChevronDown
              className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform flex-shrink-0 ml-4 ${
                openIndex === index ? 'transform rotate-180' : ''
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-8 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-sm">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Frequently Asked Questions</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Find answers to common questions about Geev, how it works, and how to get started.
          </p>

          <FAQAccordion />

          <div className="mt-12 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-gray-900 dark:text-white mb-4">
              Didn't find what you're looking for?{' '}
            </p>
            <Link href="/support">
              <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
