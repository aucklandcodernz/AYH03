import React from 'react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import { FileText } from 'lucide-react';

export default function Documents() {
  return (
    <div>
      <PageHeader title="Documents" subtitle="Centralised document management" />
      <EmptyState icon={FileText} title="Document Management" description="Upload and manage employee documents, employment agreements, and company policies. This module integrates with employee records." />
    </div>
  );
}