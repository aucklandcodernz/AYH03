import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EmployeeForm({ organizations, onSubmit, isLoading, initialData }) {
  const [data, setData] = useState(initialData || {
    first_name: '', last_name: '', email: '', phone: '',
    position: '', department: '', employment_type: 'full_time',
    start_date: '', organization_id: '', status: 'onboarding',
    visa_type: '', visa_expiry: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
    bank_account_name: '', bank_account_number: '', ird_number: '', tax_code: 'M',
    kiwisaver_rate: 3, pay_frequency: 'fortnightly', hourly_rate: '', salary: '', address: ''
  });

  const update = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="w-full grid grid-cols-4 mb-4">
          <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger>
          <TabsTrigger value="employment" className="text-xs">Employment</TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs">Payroll</TabsTrigger>
          <TabsTrigger value="emergency" className="text-xs">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>First Name *</Label><Input value={data.first_name} onChange={e => update('first_name', e.target.value)} required /></div>
            <div><Label>Last Name *</Label><Input value={data.last_name} onChange={e => update('last_name', e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" value={data.email} onChange={e => update('email', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={data.phone} onChange={e => update('phone', e.target.value)} /></div>
          </div>
          <div><Label>Address</Label><Input value={data.address} onChange={e => update('address', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Date of Birth</Label><Input type="date" value={data.date_of_birth || ''} onChange={e => update('date_of_birth', e.target.value)} /></div>
            <div><Label>Visa Type</Label><Input value={data.visa_type} onChange={e => update('visa_type', e.target.value)} placeholder="e.g., Work Visa, PR" /></div>
          </div>
          {data.visa_type && (
            <div><Label>Visa Expiry Date</Label><Input type="date" value={data.visa_expiry || ''} onChange={e => update('visa_expiry', e.target.value)} /></div>
          )}
        </TabsContent>

        <TabsContent value="employment" className="space-y-4">
          <div>
            <Label>Organisation *</Label>
            <Select value={data.organization_id} onValueChange={v => update('organization_id', v)}>
              <SelectTrigger><SelectValue placeholder="Select organisation" /></SelectTrigger>
              <SelectContent>
                {organizations.map(org => <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Position</Label><Input value={data.position} onChange={e => update('position', e.target.value)} /></div>
            <div><Label>Department</Label><Input value={data.department} onChange={e => update('department', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employment Type</Label>
              <Select value={data.employment_type} onValueChange={v => update('employment_type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="fixed_term">Fixed Term</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Start Date</Label><Input type="date" value={data.start_date} onChange={e => update('start_date', e.target.value)} /></div>
          </div>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Bank Account Name</Label><Input value={data.bank_account_name} onChange={e => update('bank_account_name', e.target.value)} /></div>
            <div><Label>Bank Account Number</Label><Input value={data.bank_account_number} onChange={e => update('bank_account_number', e.target.value)} placeholder="XX-XXXX-XXXXXXX-XXX" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>IRD Number</Label><Input value={data.ird_number} onChange={e => update('ird_number', e.target.value)} /></div>
            <div>
              <Label>Tax Code</Label>
              <Select value={data.tax_code} onValueChange={v => update('tax_code', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['M', 'ME', 'S', 'SH', 'ST', 'SA', 'CAE', 'EDW', 'NSW', 'SB', 'STC'].map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>KiwiSaver Rate (%)</Label><Input type="number" value={data.kiwisaver_rate} onChange={e => update('kiwisaver_rate', parseFloat(e.target.value))} /></div>
            <div><Label>Hourly Rate ($)</Label><Input type="number" step="0.01" value={data.hourly_rate} onChange={e => update('hourly_rate', parseFloat(e.target.value))} /></div>
            <div>
              <Label>Pay Frequency</Label>
              <Select value={data.pay_frequency} onValueChange={v => update('pay_frequency', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Annual Salary ($)</Label><Input type="number" value={data.salary} onChange={e => update('salary', parseFloat(e.target.value))} /></div>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-4">
          <div><Label>Contact Name</Label><Input value={data.emergency_contact_name} onChange={e => update('emergency_contact_name', e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Contact Phone</Label><Input value={data.emergency_contact_phone} onChange={e => update('emergency_contact_phone', e.target.value)} /></div>
            <div><Label>Relationship</Label><Input value={data.emergency_contact_relationship} onChange={e => update('emergency_contact_relationship', e.target.value)} /></div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving...' : (initialData ? 'Update Employee' : 'Add Employee')}</Button>
      </div>
    </form>
  );
}