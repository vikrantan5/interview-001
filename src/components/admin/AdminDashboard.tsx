import React, { useState, useEffect } from 'react';
import { supabase, type Job, type Application } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { JobPostForm } from './JobPostForm';
import { JobApplications } from './JobApplications';
import { InterviewScheduler } from './InterviewScheduler';
import { 
  Plus, 
  Briefcase, 
  Users, 
  Calendar, 
  Eye,
  Clock,
  CheckCircle
} from 'lucide-react';

export function AdminDashboard() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications' | 'interviews'>('jobs');
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchJobs();
      fetchApplications();
    }
  }, [profile]);

  const fetchJobs = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('created_by', profile.id)
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
            created_by
          ),
          profiles (
            full_name,
            email
          )
        `)
        .eq('jobs.created_by', profile.id);

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobCreated = () => {
    setShowJobForm(false);
    fetchJobs();
  };

  const handleViewApplications = (job: Job) => {
    setSelectedJob(job);
    setActiveTab('applications');
  };

  const getApplicationStats = () => {
    const pending = applications.filter(app => app.status === 'pending').length;
    const shortlisted = applications.filter(app => app.status === 'shortlisted').length;
    const scheduled = applications.filter(app => app.status === 'interview_scheduled').length;

    return { pending, shortlisted, scheduled };
  };

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
              <p className="text-sm font-medium text-gray-600">Total Jobs</p>
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
              <Calendar className="h-6 w-6 text-purple-600" />
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
              Job Postings
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications
            </button>
            <button
              onClick={() => setActiveTab('interviews')}
              className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'interviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Interviews
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'jobs' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Job Postings</h2>
                <button
                  onClick={() => setShowJobForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Job
                </button>
              </div>

              {showJobForm && (
                <div className="mb-6">
                  <JobPostForm 
                    onJobCreated={handleJobCreated}
                    onCancel={() => setShowJobForm(false)}
                  />
                </div>
              )}

              <div className="space-y-4">
                {jobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{job.title}</h3>
                        <p className="text-gray-600 mb-3 line-clamp-2">{job.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {job.skills_required.map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                          <span>Openings: {job.openings_count}</span>
                          <span>Deadline: {new Date(job.application_deadline).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handleViewApplications(job)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Applications
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <JobApplications 
              selectedJob={selectedJob}
              applications={applications}
              onRefresh={fetchApplications}
            />
          )}

          {activeTab === 'interviews' && (
            <InterviewScheduler 
              applications={applications}
              onRefresh={fetchApplications}
            />
          )}
        </div>
      </div>
    </div>
  );
}