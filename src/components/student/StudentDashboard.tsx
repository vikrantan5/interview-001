import React, { useState, useEffect } from 'react';
import { supabase, type Job, type Application, type Notification, type Interview } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { JobListing } from './JobListing';
import { ApplicationForm } from './ApplicationForm';
import { NotificationCenter } from './NotificationCenter';
import { InterviewAccess } from './InterviewAccess';
import { 
  Briefcase, 
  FileText, 
  Bell, 
  Video,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function StudentDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'interviews' | 'notifications'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchJobs();
      fetchApplications();
      fetchNotifications();
      fetchInterviews();
    }
  }, [profile]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .gte('application_deadline', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            description,
            application_deadline
          )
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchInterviews = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          applications (
            job_id,
            jobs (
              title
            )
          )
        `)
        .eq('applications.student_id', profile.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToJob = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationForm(true);
  };

  const handleApplicationSubmitted = () => {
    setShowApplicationForm(false);
    setSelectedJob(null);
    fetchApplications();
  };

  const getApplicationStats = () => {
    const pending = applications.filter(app => app.status === 'pending').length;
    const shortlisted = applications.filter(app => app.status === 'shortlisted').length;
    const scheduled = applications.filter(app => app.status === 'interview_scheduled').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;

    return { pending, shortlisted, scheduled, rejected };
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const stats = getApplicationStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{jobs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shortlisted</p>
              <p className="text-2xl font-bold text-gray-900">{stats.shortlisted}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Video className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Interviews Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.scheduled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'jobs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Briefcase className="h-4 w-4 mr-2" />
                Job Listings
              </div>
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                My Applications
              </div>
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'interviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Video className="h-4 w-4 mr-2" />
                Interviews
              </div>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {unreadNotifications > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                    {unreadNotifications}
                  </span>
                )}
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'jobs' && (
            <div>
              <JobListing
                jobs={jobs}
                applications={applications}
                onApply={handleApplyToJob}
              />
              
              {showApplicationForm && selectedJob && (
                <ApplicationForm
                  job={selectedJob}
                  onSubmit={handleApplicationSubmitted}
                  onCancel={() => {
                    setShowApplicationForm(false);
                    setSelectedJob(null);
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">My Applications</h2>
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {application.jobs?.title}
                        </h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {application.jobs?.description}
                        </p>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                          <span>Deadline: {application.jobs?.application_deadline ? new Date(application.jobs.application_deadline).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          application.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                          application.status === 'interview_scheduled' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {application.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {application.status === 'shortlisted' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {application.status === 'interview_scheduled' && <Calendar className="h-3 w-3 mr-1" />}
                          {application.status === 'rejected' && <AlertCircle className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{application.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {applications.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Start by browsing available jobs and submitting your applications.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'interviews' && (
            <InterviewAccess 
              interviews={interviews}
              onRefresh={fetchInterviews}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationCenter 
              notifications={notifications}
              onRefresh={fetchNotifications}
            />
          )}
        </div>
      </div>
    </div>
  );
}