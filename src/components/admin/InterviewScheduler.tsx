import React, { useState, useEffect } from 'react';
import { supabase, type Application, type Interview } from '../../lib/supabase';
import { format } from 'date-fns';
import { Calendar, Clock, Video, Copy, CheckCircle } from 'lucide-react';

interface InterviewSchedulerProps {
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

interface ExtendedInterview extends Interview {
  applications?: {
    student_id: string;
    job_id: string;
    profiles?: {
      full_name: string;
      email: string;
    };
    jobs?: {
      title: string;
    };
  };
}

export function InterviewScheduler({ applications, onRefresh }: InterviewSchedulerProps) {
  const [interviews, setInterviews] = useState<ExtendedInterview[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ExtendedApplication | null>(null);
  const [scheduleData, setScheduleData] = useState({
    scheduled_date: '',
    passcode: '',
    meeting_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [copiedPasscode, setCopiedPasscode] = useState<string | null>(null);

  const schedulableApplications = applications.filter(
    app => app.status === 'shortlisted' || app.status === 'interview_scheduled'
  ) as ExtendedApplication[];

  useEffect(() => {
    fetchInterviews();
  }, [applications]);

  const fetchInterviews = async () => {
    try {
      const { data, error } = await supabase
        .from('interviews')
        .select(`
          *,
          applications (
            student_id,
            job_id,
            profiles (
              full_name,
              email
            ),
            jobs (
              title
            )
          )
        `)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    }
  };

  const generatePasscode = () => {
    const passcode = Math.random().toString(36).substring(2, 10).toUpperCase();
    setScheduleData({ ...scheduleData, passcode });
  };

  const generateMeetingUrl = () => {
    const roomId = Math.random().toString(36).substring(2, 15);
    const meetingUrl = `https://meet.jit.si/JobPortal-${roomId}`;
    setScheduleData({ ...scheduleData, meeting_url: meetingUrl });
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApplication) return;

    setLoading(true);

    try {
      // Create interview record
      const { error: interviewError } = await supabase
        .from('interviews')
        .insert({
          application_id: selectedApplication.id,
          scheduled_date: scheduleData.scheduled_date,
          passcode: scheduleData.passcode,
          meeting_url: scheduleData.meeting_url,
        });

      if (interviewError) throw interviewError;

      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: 'interview_scheduled' })
        .eq('id', selectedApplication.id);

      if (updateError) throw updateError;

      // Create notification for student
      await supabase.from('notifications').insert({
        user_id: selectedApplication.student_id,
        title: 'Interview Scheduled!',
        message: `Your interview has been scheduled for ${format(new Date(scheduleData.scheduled_date), 'MMM dd, yyyy at h:mm a')}. Check your dashboard for meeting details.`,
        type: 'success',
      });

      // Reset form
      setShowScheduleForm(false);
      setSelectedApplication(null);
      setScheduleData({ scheduled_date: '', passcode: '', meeting_url: '' });
      
      // Refresh data
      fetchInterviews();
      onRefresh();
    } catch (error) {
      console.error('Error scheduling interview:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyPasscode = async (passcode: string) => {
    try {
      await navigator.clipboard.writeText(passcode);
      setCopiedPasscode(passcode);
      setTimeout(() => setCopiedPasscode(null), 2000);
    } catch (error) {
      console.error('Failed to copy passcode:', error);
    }
  };

  const openMeetingRoom = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Interview Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Schedule and manage interviews with shortlisted candidates
          </p>
        </div>
        
        {schedulableApplications.length > 0 && (
          <button
            onClick={() => setShowScheduleForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Interview
          </button>
        )}
      </div>

      {showScheduleForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule New Interview</h3>
          
          <form onSubmit={handleScheduleInterview} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Candidate
              </label>
              <select
                required
                value={selectedApplication?.id || ''}
                onChange={(e) => {
                  const app = schedulableApplications.find(a => a.id === e.target.value);
                  setSelectedApplication(app || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a candidate...</option>
                {schedulableApplications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.profiles?.full_name} - {app.jobs?.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Date & Time
              </label>
              <input
                type="datetime-local"
                required
                value={scheduleData.scheduled_date}
                onChange={(e) => setScheduleData({ ...scheduleData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Passcode
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    value={scheduleData.passcode}
                    onChange={(e) => setScheduleData({ ...scheduleData, passcode: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter or generate passcode"
                  />
                  <button
                    type="button"
                    onClick={generatePasscode}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting URL
                </label>
                <div className="flex space-x-2">
                  <input
                    type="url"
                    required
                    value={scheduleData.meeting_url}
                    onChange={(e) => setScheduleData({ ...scheduleData, meeting_url: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter or generate meeting URL"
                  />
                  <button
                    type="button"
                    onClick={generateMeetingUrl}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? 'Scheduling...' : 'Schedule Interview'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Scheduled Interviews List */}
      <div className="space-y-4">
        {interviews.map((interview) => (
          <div key={interview.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {interview.applications?.profiles?.full_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {interview.applications?.jobs?.title}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    {format(new Date(interview.scheduled_date), 'MMM dd, yyyy at h:mm a')}
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">Passcode:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                      {interview.passcode}
                    </code>
                    <button
                      onClick={() => copyPasscode(interview.passcode)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {copiedPasscode === interview.passcode ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      interview.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      interview.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {interview.status === 'scheduled' && <Calendar className="h-3 w-3 mr-1" />}
                      {interview.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      <span className="capitalize">{interview.status}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-6">
                <button
                  onClick={() => openMeetingRoom(interview.meeting_url)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Video className="h-4 w-4 mr-1" />
                  Join Meeting
                </button>
              </div>
            </div>
          </div>
        ))}

        {interviews.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews scheduled</h3>
            <p className="mt-1 text-sm text-gray-500">
              Schedule interviews with shortlisted candidates to begin the interview process.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}