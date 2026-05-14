import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Copy, FileText, Mail, Shield, Briefcase } from 'lucide-react';

const termsTemplates = [
  {
    id: 'standard',
    name: 'Standard Terms',
    content: `TERMS AND CONDITIONS

1. Payment Terms
Payment is due within the specified payment terms from the invoice date. Late payments may incur interest charges at a rate of 1.5% per month.

2. Scope of Work
The services/products described in this invoice are provided as per our prior agreement. Any additional work will be quoted separately.

3. Intellectual Property
All intellectual property rights in deliverables remain with the provider until full payment is received.

4. Confidentiality
Both parties agree to maintain confidentiality of any proprietary information shared during the engagement.

5. Limitation of Liability
Our liability is limited to the amount paid for the services/products. We are not liable for indirect, consequential, or incidental damages.

6. Governing Law
This agreement shall be governed by the laws of the applicable jurisdiction.`,
  },
  {
    id: 'creative',
    name: 'Creative Services',
    content: `TERMS FOR CREATIVE SERVICES

1. Payment Schedule
50% deposit required before work begins. Balance due upon delivery of final files.

2. Revisions
Up to 2 rounds of revisions included. Additional revisions billed at hourly rate.

3. Usage Rights
Full usage rights transfer upon final payment. Exclusive rights available at additional cost.

4. File Delivery
Final files delivered in standard formats (PDF, PNG, JPG, AI/PSD upon request).

5. Cancellation
Deposits are non-refundable. Work completed before cancellation will be billed.

6. Portfolio Use
We reserve the right to use completed work in our portfolio unless otherwise agreed.`,
  },
  {
    id: 'consulting',
    name: 'Consulting Terms',
    content: `CONSULTING AGREEMENT TERMS

1. Engagement
Services are provided on an advisory basis only. Implementation responsibility lies with the client.

2. Billing
Time is billed in 15-minute increments. Travel time billed at 50% of standard rate.

3. Expenses
Pre-approved expenses will be billed at cost plus 10% handling fee.

4. Confidentiality
Consultant agrees to maintain strict confidentiality of client business information.

5. Non-Solicitation
Neither party shall solicit the other's employees during engagement and for 12 months after.

6. Deliverables
All deliverables remain confidential and are for client's internal use only.`,
  },
];

const emailTemplates = [
  {
    id: 'reminder',
    name: 'Payment Reminder',
    subject: 'Friendly Reminder: Invoice [INVOICE_NUMBER] Due',
    content: `Dear [CLIENT_NAME],

I hope this message finds you well. This is a friendly reminder that invoice [INVOICE_NUMBER] for [AMOUNT] was due on [DUE_DATE].

If you've already sent the payment, please disregard this message. Otherwise, I would appreciate it if you could arrange payment at your earliest convenience.

If you have any questions about the invoice or need to discuss payment arrangements, please don't hesitate to reach out.

Thank you for your continued business.

Best regards,
[YOUR_NAME]`,
  },
  {
    id: 'overdue',
    name: 'Overdue Notice',
    subject: 'Urgent: Invoice [INVOICE_NUMBER] is Overdue',
    content: `Dear [CLIENT_NAME],

I'm writing to bring to your attention that invoice [INVOICE_NUMBER] for [AMOUNT], originally due on [DUE_DATE], remains unpaid.

The invoice is now [DAYS_OVERDUE] days overdue. Please arrange payment immediately to avoid any late fees or service interruptions.

Payment can be made via:
- Bank Transfer: [BANK_DETAILS]
- Credit Card: [PAYMENT_LINK]

If there are any issues preventing payment, please contact me immediately so we can find a solution.

Thank you for your prompt attention to this matter.

Regards,
[YOUR_NAME]`,
  },
  {
    id: 'thank-you',
    name: 'Payment Received',
    subject: 'Thank You - Payment Received for Invoice [INVOICE_NUMBER]',
    content: `Dear [CLIENT_NAME],

Thank you for your payment of [AMOUNT] for invoice [INVOICE_NUMBER]. We have received and processed your payment successfully.

Your account is now up to date. A receipt has been attached for your records.

We truly appreciate your business and look forward to continuing our partnership. If there's anything else we can help you with, please don't hesitate to reach out.

Thank you once again!

Best regards,
[YOUR_NAME]`,
  },
];

const proposalTemplates = [
  {
    id: 'service',
    name: 'Service Proposal',
    content: `PROPOSAL FOR [SERVICE_NAME]

Prepared for: [CLIENT_NAME]
Date: [DATE]
Valid Until: [EXPIRY_DATE]

EXECUTIVE SUMMARY
[Brief overview of the proposed solution and its benefits]

SCOPE OF WORK
• [Deliverable 1]
• [Deliverable 2]
• [Deliverable 3]

TIMELINE
Phase 1: [Description] - [Duration]
Phase 2: [Description] - [Duration]
Phase 3: [Description] - [Duration]

INVESTMENT
Total Investment: [AMOUNT]
Payment Terms: [TERMS]

WHAT'S INCLUDED
✓ [Feature 1]
✓ [Feature 2]
✓ [Feature 3]

NEXT STEPS
1. Review this proposal
2. Schedule a follow-up call
3. Sign agreement and pay deposit
4. Kick-off meeting

We look forward to working with you!`,
  },
];

export default function BusinessTools() {
  const [selectedContent, setSelectedContent] = useState('');

  const handleCopy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <>
      <Helmet>
        <title>Business Tools | InvoicePro</title>
        <meta name="description" content="Access terms templates, proposals, contracts, and other business tools in InvoicePro." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Business Tools"
        description="Ready-to-use templates for terms, emails, and proposals"
      />

      <Tabs defaultValue="terms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="terms" className="gap-2">
            <Shield className="w-4 h-4" />
            Terms
          </TabsTrigger>
          <TabsTrigger value="emails" className="gap-2">
            <Mail className="w-4 h-4" />
            Emails
          </TabsTrigger>
          <TabsTrigger value="proposals" className="gap-2">
            <Briefcase className="w-4 h-4" />
            Proposals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="terms" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Terms & Conditions Templates</h3>
              {termsTemplates.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors shadow-card"
                  onClick={() => setSelectedContent(template.content)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      {template.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(template.content, template.name);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.content.substring(0, 150)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <h3 className="font-semibold mb-4">Preview & Edit</h3>
              <Textarea
                value={selectedContent}
                onChange={(e) => setSelectedContent(e.target.value)}
                placeholder="Select a template to preview..."
                className="min-h-[400px] font-mono text-sm"
              />
              {selectedContent && (
                <Button
                  className="mt-4"
                  onClick={() => handleCopy(selectedContent, 'Content')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="emails" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Email Templates</h3>
              {emailTemplates.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors shadow-card"
                  onClick={() => setSelectedContent(`Subject: ${template.subject}\n\n${template.content}`)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      {template.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(template.content, template.name);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-xs">{template.subject}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.content.substring(0, 120)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <h3 className="font-semibold mb-4">Preview & Edit</h3>
              <Textarea
                value={selectedContent}
                onChange={(e) => setSelectedContent(e.target.value)}
                placeholder="Select a template to preview..."
                className="min-h-[400px] font-mono text-sm"
              />
              {selectedContent && (
                <Button
                  className="mt-4"
                  onClick={() => handleCopy(selectedContent, 'Email')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="proposals" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Proposal Templates</h3>
              {proposalTemplates.map(template => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors shadow-card"
                  onClick={() => setSelectedContent(template.content)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      {template.name}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(template.content, template.name);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.content.substring(0, 150)}...
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div>
              <h3 className="font-semibold mb-4">Preview & Edit</h3>
              <Textarea
                value={selectedContent}
                onChange={(e) => setSelectedContent(e.target.value)}
                placeholder="Select a template to preview..."
                className="min-h-[400px] font-mono text-sm"
              />
              {selectedContent && (
                <Button
                  className="mt-4"
                  onClick={() => handleCopy(selectedContent, 'Proposal')}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
