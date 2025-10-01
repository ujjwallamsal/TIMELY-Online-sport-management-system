import React, { useMemo, useState } from 'react';
import { useApplyAthlete, useApplyCoach, useApplyOrganizer, useApplications } from '../../api/queries';
import { useAuth } from '../../auth/AuthProvider';
import { useToast } from '../../contexts/ToastContext';

const SectionCard: React.FC<{ title: string; accent: string; children: React.ReactNode }> = ({ title, accent, children }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className={`px-4 py-3 border-b ${accent}`}>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

const Badge: React.FC<{ text: string }>=({ text }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">{text}</span>
);

const UpgradeCenter: React.FC = () => {
  const { user } = useAuth();
  const { data: apps } = useApplications();
  const { showSuccess, showError } = useToast();
  const applyAthlete = useApplyAthlete();
  const applyCoach = useApplyCoach();
  const applyOrganizer = useApplyOrganizer();

  const existing = useMemo(() => ({
    athlete: apps?.athlete?.status as string | undefined,
    coach: apps?.coach?.status as string | undefined,
    organizer: apps?.organizer?.status as string | undefined,
  }), [apps]);

  const [athleteForm, setAthleteForm] = useState<{ id_document?: File | null; medical_clearance?: File | null }>({});
  const [coachForm, setCoachForm] = useState<{ certificate?: File | null; resume?: File | null }>({});
  const [orgForm, setOrgForm] = useState<{ organization_name?: string; business_doc?: File | null }>({});

  const onApplyAthlete = () => {
    if (!athleteForm.id_document || !athleteForm.medical_clearance) {
      showError('Missing Documents', 'Please upload both ID document and medical clearance');
      return;
    }
    const fd = new FormData();
    fd.append('id_document', athleteForm.id_document);
    fd.append('medical_clearance', athleteForm.medical_clearance);
    applyAthlete.mutate(fd, {
      onSuccess: () => {
        showSuccess('Application Submitted', 'Your athlete application has been submitted. An admin will review it shortly.');
        setAthleteForm({});
      },
      onError: (error: any) => {
        showError('Application Failed', error.response?.data?.detail || 'Failed to submit application. Please try again.');
      }
    });
  };

  const onApplyCoach = () => {
    if (!coachForm.certificate) {
      showError('Missing Document', 'Please upload your coaching certificate');
      return;
    }
    const fd = new FormData();
    fd.append('certificate', coachForm.certificate);
    if (coachForm.resume) fd.append('resume', coachForm.resume);
    applyCoach.mutate(fd, {
      onSuccess: () => {
        showSuccess('Application Submitted', 'Your coach application has been submitted. An admin will review it shortly.');
        setCoachForm({});
      },
      onError: (error: any) => {
        showError('Application Failed', error.response?.data?.detail || 'Failed to submit application. Please try again.');
      }
    });
  };

  const onApplyOrganizer = () => {
    if (!orgForm.organization_name || !orgForm.business_doc) {
      showError('Missing Information', 'Please provide organization name and business document');
      return;
    }
    const fd = new FormData();
    fd.append('organization_name', orgForm.organization_name);
    fd.append('business_doc', orgForm.business_doc);
    applyOrganizer.mutate(fd, {
      onSuccess: () => {
        showSuccess('Application Submitted', 'Your organizer application has been submitted. An admin will review it shortly.');
        setOrgForm({});
      },
      onError: (error: any) => {
        showError('Application Failed', error.response?.data?.detail || 'Failed to submit application. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Upgrade Role</h1>
          <p className="text-gray-600 mt-1">Current role: <Badge text={user?.role || 'GUEST'} /></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SectionCard title="Athlete" accent="border-t-4 border-green-500">
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1 mb-3">
              <li>Upload government ID</li>
              <li>Upload medical clearance</li>
            </ul>
            <div className="space-y-2">
              <input type="file" aria-label="ID Document" onChange={(e)=>setAthleteForm(s=>({...s,id_document:e.target.files?.[0]}))} className="block w-full text-sm" />
              <input type="file" aria-label="Medical Clearance" onChange={(e)=>setAthleteForm(s=>({...s,medical_clearance:e.target.files?.[0]}))} className="block w-full text-sm" />
              <button onClick={onApplyAthlete} disabled={applyAthlete.isPending} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-60">{existing.athlete ? existing.athlete : 'Apply'}</button>
            </div>
          </SectionCard>

          <SectionCard title="Coach" accent="border-t-4 border-orange-500">
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1 mb-3">
              <li>Upload coaching certificate</li>
              <li>Upload resume (optional)</li>
            </ul>
            <div className="space-y-2">
              <input type="file" aria-label="Certificate" onChange={(e)=>setCoachForm(s=>({...s,certificate:e.target.files?.[0]}))} className="block w-full text-sm" />
              <input type="file" aria-label="Resume" onChange={(e)=>setCoachForm(s=>({...s,resume:e.target.files?.[0]}))} className="block w-full text-sm" />
              <button onClick={onApplyCoach} disabled={applyCoach.isPending} className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-60">{existing.coach ? existing.coach : 'Apply'}</button>
            </div>
          </SectionCard>

          <SectionCard title="Organizer" accent="border-t-4 border-purple-600">
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1 mb-3">
              <li>Organization name</li>
              <li>Business/ID document</li>
            </ul>
            <div className="space-y-2">
              <input type="text" placeholder="Organization name" onChange={(e)=>setOrgForm(s=>({...s,organization_name:e.target.value}))} className="w-full border rounded px-3 py-2 text-sm" />
              <input type="file" aria-label="Business Document" onChange={(e)=>setOrgForm(s=>({...s,business_doc:e.target.files?.[0]}))} className="block w-full text-sm" />
              <button onClick={onApplyOrganizer} disabled={applyOrganizer.isPending} className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-60">{existing.organizer ? existing.organizer : 'Apply'}</button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default UpgradeCenter;


