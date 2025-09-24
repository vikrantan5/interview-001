import React, { useState, useEffect } from 'react';
import { supabase, type Job, type Application } from '../../lib/supabase';
import { format } from 'date-fns';
import { 
  User, 
  Mail, 
  FileText, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock,
  Eye,
  Download
} from 'lucide-react';

interface JobApplicationsProps {
  selectedJob: Job | null;
  applications: Application[];
  onRefresh: () => void;
}

interface ExtendedApplication extends Application {
  profiles?: {
    full_name: string;
    email: string;
  };
  jobs?: {
    title: string;
    created_by: string;
  };
}

export function JobApplications({ selectedJob, applications, onRefresh }: JobApplicationsProps) {
  const [filteredApplications, setFilteredApplications] = useState<ExtendedApplication[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    let filtered = applications as ExtendedApplication[];
    
    if (selectedJob) {
      filtered = filtered.filter(app => app.job_id === selectedJob.id);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }, [applications, selectedJob, statusFilter]);

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;

      // Create notification for student
      const application = applications.find(app => app.id === applicationId);
      if (application) {
        const notificationTitle = status === 'shortlisted' 
          ? 'Application Shortlisted!' 
          : status === 'rejected'
          ? 'Application Update'
          : 'Interview Scheduled!';
          
        const notificationMessage = status === 'shortlisted'
          ? 'Congratulations! You have been shortlisted for the position.'
          : status === 'rejected'
          ? 'Thank you for your application. We have decided to move forward with other candidates.'
          : 'Your interview has been scheduled. Please check your dashboard for details.';

        await supabase.from('notifications').insert({
          user_id: application.student_id,
          title: notificationTitle,
          message: notificationMessage,
          type: status === 'rejected' ? 'info' : 'success',
        });
      }

      onRefresh();
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'interview_scheduled':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'shortlisted':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'interview_scheduled':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedJob ? `Applications for ${selectedJob.title}` : 'All Applications'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredApplications.length} applications found
          </p>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview_scheduled">Interview Scheduled</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredApplications.map((application) => (
          <div key={application.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {application.profiles?.full_name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {application.profiles?.email}
                      </span>
                      <span>Applied {format(new Date(application.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter:</h4>
                  <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                    {application.cover_letter}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="ml-1 capitalize">{application.status.replace('_', ' ')}</span>
                  </span>
                  
                  {application.resume_url && (
                    <a
                      href={application.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      View Resume
                    </a>
                  )}
                </div>
              </div>

              <div className="ml-6 flex flex-col space-y-2">
                {application.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'shortlisted')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Shortlist
                    </button>
                    <button
                      onClick={() => updateApplicationStatus(application.id, 'rejected')}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                  </>
                )}

                {application.status === 'shortlisted' && (
                  <button
                    onClick={() => updateApplicationStatus(application.id, 'interview_scheduled')}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Schedule Interview
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No applications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {selectedJob 
                ? 'No applications have been submitted for this job yet.'
                : 'No applications match the selected filters.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}