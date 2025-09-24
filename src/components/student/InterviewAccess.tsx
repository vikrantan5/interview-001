import React, { useState } from 'react';
import { supabase, type Interview } from '../../lib/supabase';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';
import { 
  Video, 
  Calendar, 
  Clock, 
  Key, 
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface InterviewAccessProps {
  interviews: Interview[];
  onRefresh: () => void;
}

interface ExtendedInterview extends Interview {
  applications?: {
    job_id: string;
    jobs?: {
      title: string;
    };
  };
}

export function InterviewAccess({ interviews, onRefresh }: InterviewAccessProps) {
  const [passcodeInputs, setPasscodeInputs] = useState<Record<string, string>>({});
  const [copiedPasscode, setCopiedPasscode] = useState<string | null>(null);
  const [verifiedInterviews, setVerifiedInterviews] = useState<Set<string>>(new Set());

  const extendedInterviews = interviews as ExtendedInterview[];

  const handlePasscodeInput = (interviewId: string, value: string) => {
    setPasscodeInputs(prev => ({
      ...prev,
      [interviewId]: value
    }));
  };

  const verifyPasscode = (interview: ExtendedInterview) => {
    const inputPasscode = passcodeInputs[interview.id]?.trim().toUpperCase();
    const correctPasscode = interview.passcode.trim().toUpperCase();
    
    if (inputPasscode === correctPasscode) {
      setVerifiedInterviews(prev => new Set([...prev, interview.id]));
      return true;
    }
    return false;
  };

  const joinMeeting = (interview: ExtendedInterview) => {
    if (verifyPasscode(interview) || verifiedInterviews.has(interview.id)) {
      window.open(interview.meeting_url, '_blank');
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

  const getInterviewStatus = (interview: ExtendedInterview) => {
    const now = new Date();
    const interviewTime = new Date(interview.scheduled_date);
    const interviewEnd = addMinutes(interviewTime, 60); // Assume 1 hour interviews

    if (interview.status === 'completed') {
      return { status: 'completed', color: 'green', message: 'Interview completed' };
    }

    if (interview.status === 'cancelled') {
      return { status: 'cancelled', color: 'red', message: 'Interview cancelled' };
    }

    if (isAfter(now, interviewEnd)) {
      return { status: 'past', color: 'gray', message: 'Interview has ended' };
    }

    if (isAfter(now, addMinutes(interviewTime, -15)) && isBefore(now, interviewEnd)) {
      return { status: 'live', color: 'green', message: 'Interview is live - Join now!' };
    }

    if (isAfter(now, addMinutes(interviewTime, -30))) {
      return { status: 'upcoming', color: 'yellow', message: 'Interview starting soon' };
    }

    return { status: 'scheduled', color: 'blue', message: 'Interview scheduled' };
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">My Interviews</h2>
          <p className="text-sm text-gray-600 mt-1">
            Access your scheduled interviews and join meeting rooms
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {extendedInterviews.map((interview) => {
          const status = getInterviewStatus(interview);
          const isVerified = verifiedInterviews.has(interview.id);
          const inputPasscode = passcodeInputs[interview.id] || '';
          
          return (
            <div key={interview.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${
                    status.color === 'green' ? 'bg-green-100' :
                    status.color === 'yellow' ? 'bg-yellow-100' :
                    status.color === 'red' ? 'bg-red-100' :
                    status.color === 'gray' ? 'bg-gray-100' :
                    'bg-blue-100'
                  }`}>
                    <Video className={`h-6 w-6 ${
                      status.color === 'green' ? 'text-green-600' :
                      status.color === 'yellow' ? 'text-yellow-600' :
                      status.color === 'red' ? 'text-red-600' :
                      status.color === 'gray' ? 'text-gray-600' :
                      'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {interview.applications?.jobs?.title || 'Interview'}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 space-x-4 mt-1">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {format(new Date(interview.scheduled_date), 'MMM dd, yyyy')}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {format(new Date(interview.scheduled_date), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>

                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  status.color === 'green' ? 'bg-green-100 text-green-800' :
                  status.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                  status.color === 'red' ? 'bg-red-100 text-red-800' :
                  status.color === 'gray' ? 'bg-gray-100 text-gray-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {status.status === 'live' && <span className="animate-pulse mr-2">🔴</span>}
                  {status.message}
                </span>
              </div>

              {status.status !== 'past' && status.status !== 'completed' && status.status !== 'cancelled' && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center">
                      <Key className="h-4 w-4 mr-2" />
                      Meeting Access
                    </h4>
                    <button
                      onClick={() => copyPasscode(interview.passcode)}
                      className="flex items-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {copiedPasscode === interview.passcode ? (
                        <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copiedPasscode === interview.passcode ? 'Copied!' : 'Copy Passcode'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Enter Meeting Passcode:
                      </label>
                      <input
                        type="text"
                        value={inputPasscode}
                        onChange={(e) => handlePasscodeInput(interview.id, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isVerified ? 'border-green-300 bg-green-50' : 'border-gray-300'
                        }`}
                        placeholder="Enter passcode to join"
                      />
                      {isVerified && (
                        <div className="flex items-center mt-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Passcode verified
                        </div>
                      )}
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => joinMeeting(interview)}
                        disabled={!isVerified && inputPasscode.trim().toUpperCase() !== interview.passcode.trim().toUpperCase()}
                        className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                          status.status === 'live'
                            ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500 animate-pulse'
                            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {status.status === 'live' ? 'Join Live Interview' : 'Join Meeting Room'}
                      </button>
                    </div>
                  </div>

                  {status.status === 'upcoming' && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                        <span className="text-sm text-yellow-800">
                          Your interview will be available to join 15 minutes before the scheduled time.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500">
                Interview ID: {interview.id}
              </div>
            </div>
          );
        })}

        {extendedInterviews.length === 0 && (
          <div className="text-center py-12">
            <Video className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No interviews scheduled</h3>
            <p className="mt-1 text-sm text-gray-500">
              Once you're shortlisted for a position, interview details will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}