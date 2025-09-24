import React, { useState } from 'react';
import { supabase, type Job } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { X, Upload, FileText } from 'lucide-react';

interface ApplicationFormProps {
  job: Job;
  onSubmit: () => void;
  onCancel: () => void;
}

export function ApplicationForm({ job, onSubmit, onCancel }: ApplicationFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    resume_url: '',
    cover_letter: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    setError('');

    try {
      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          student_id: profile.id,
          resume_url: formData.resume_url,
          cover_letter: formData.cover_letter,
        });

      if (applicationError) throw applicationError;

      // Create notification for successful application
      await supabase.from('notifications').insert({
        user_id: profile.id,
        title: 'Application Submitted Successfully!',
        message: `Your application for "${job.title}" has been submitted successfully. You will be notified of any updates.`,
        type: 'success',
      });

      onSubmit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Apply for Position</h3>
              <p className="text-sm text-gray-600 mt-1">{job.title}</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Job Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Job Details</h4>
            <p className="text-gray-600 text-sm mb-3">{job.description}</p>
            <div className="flex flex-wrap gap-2">
              {job.skills_required.map((skill, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="resume" className="block text-sm font-medium text-gray-700 mb-2">
                Resume URL *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="url"
                  id="resume"
                  required
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.resume_url}
                  onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                  placeholder="https://example.com/your-resume.pdf"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Please provide a direct link to your resume (Google Drive, Dropbox, etc.)
              </p>
            </div>

            <div>
              <label htmlFor="cover_letter" className="block text-sm font-medium text-gray-700 mb-2">
                Cover Letter *
              </label>
              <textarea
                id="cover_letter"
                required
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.cover_letter}
                onChange={(e) => setFormData({ ...formData, cover_letter: e.target.value })}
                placeholder="Tell us why you're interested in this position and what makes you a great fit..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.cover_letter.length}/500 characters
              </p>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}