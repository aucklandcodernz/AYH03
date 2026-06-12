import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Building2, Users, Mail, Phone } from 'lucide-react';

export default function Organisations() {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: orgs = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => base44.entities.Organization.list('-created_date'),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('-created_date', 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Organization.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['organizations'] }); setShowAdd(false); setFormData({}); },
  });

  const updateForm = (f, v) => setFormData(p => ({ ...p, [f]: v }));

  const getEmployeeCount = (orgId) => employees.filter(e => e.organization_id === orgId).length;
  const agencies = orgs.filter(o => o.type === 'agency');

  return (
    <div>
      <PageHeader
        title="Organisations"
        subtitle="Manage client organisations and agencies"
        actions={<Button onClick={() => { setFormData({ type: 'client', status: 'active' }); setShowAdd(true); }}><Plus className="w-4 h-4 mr-2" />Add Organisation</Button>}
      />

      {orgs.length === 0 ? (
        <EmptyState icon={Building2} title="No organisations" description="Add your first organisation to get started." action="Add Organisation" onAction={() => setShowAdd(true)} />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map(org => (
            <Card key={org.id} className="hover:shadow-md transition-all">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{org.name}</h3>
                      <StatusBadge status={org.status} />
                    </div>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{org.type} {org.industry && `• ${org.industry}`}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />{getEmployeeCount(org.id)} employees
                  </div>
                  {org.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" />{org.email}
                    </div>
                  )}
                  {org.admin_user_email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />Admin: {org.admin_user_email}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Add Organisation</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={formData.name || ''} onChange={e => updateForm('name', e.target.value)} /></div>
            <div>
              <Label>Type</Label>
              <Select value={formData.type || 'client'} onValueChange={v => updateForm('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client Organisation</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Industry</Label><Input value={formData.industry || ''} onChange={e => updateForm('industry', e.target.value)} /></div>
            <div><Label>Admin Email</Label><Input type="email" value={formData.admin_user_email || ''} onChange={e => updateForm('admin_user_email', e.target.value)} /></div>
            <div><Label>Contact Email</Label><Input type="email" value={formData.email || ''} onChange={e => updateForm('email', e.target.value)} /></div>
            <div><Label>Phone</Label><Input value={formData.phone || ''} onChange={e => updateForm('phone', e.target.value)} /></div>
            <div><Label>Address</Label><Input value={formData.address || ''} onChange={e => updateForm('address', e.target.value)} /></div>
            {formData.type === 'client' && agencies.length > 0 && (
              <div>
                <Label>Managing Agency</Label>
                <Select value={formData.agency_id || ''} onValueChange={v => updateForm('agency_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select agency (optional)" /></SelectTrigger>
                  <SelectContent>{agencies.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Organisation'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}