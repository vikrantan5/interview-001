import React, { useState } from 'react';
import { type Job, type Application } from '../../lib/supabase';
import { format } from 'date-fns';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Search,
  Filter,
  Briefcase,
  Clock
} from 'lucide-react';

interface JobListingProps {
  jobs: Job[];
  applications: Application[];
  onApply: (job: Job) => void;
}

export function JobListing({ jobs, applications, onApply }: JobListingProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');

  const appliedJobIds = new Set(applications.map(app => app.job_id));
  
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkill = !skillFilter || 
                        job.skills_required.some(skill => 
                          skill.toLowerCase().includes(skillFilter.toLowerCase())
                        );
    
    return matchesSearch && matchesSkill;
  });

  const allSkills = Array.from(new Set(jobs.flatMap(job => job.skills_required)));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Available Jobs</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredJobs.length} jobs found
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">All Skills</option>
          {allSkills.map(skill => (
            <option key={skill} value={skill}>{skill}</option>
          ))}
        </select>
      </div>

      {/* Job Cards */}
      <div className="space-y-6">
        {filteredJobs.map((job) => {
          const hasApplied = appliedJobIds.has(job.id);
          const isDeadlinePassed = new Date(job.application_deadline) < new Date();

          return (
            <div key={job.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
                        <span className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {job.openings_count} opening{job.openings_count !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Deadline: {format(new Date(job.application_deadline), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Required Skills:</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills_required.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex flex-col items-end space-y-2">
                  {isDeadlinePassed ? (
                    <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                      Deadline Passed
                    </span>
                  ) : hasApplied ? (
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => onApply(job)}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                    >
                      Apply Now
                    </button>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Posted {format(new Date(job.created_at), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || skillFilter
                ? 'Try adjusting your search criteria.'
                : 'No job openings are currently available.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}