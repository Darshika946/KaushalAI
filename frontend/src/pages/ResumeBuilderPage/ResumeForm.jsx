import React, { useState } from 'react';
import { useTemplate } from './context/TemplateContext';
import TemplateRenderer, { TEMPLATE_REGISTRY } from './templates/TemplateRenderer';
import { generatePDF } from './utils/generatePDF';
import { API_BASE_URL } from '../../config/api';
import { getDummyDataForTemplate } from './templates/dummyResumeData';


const DEFAULT_SAMPLE_DATA = {
  personal_info: {
    full_name: 'Alex Mercer',
    job_title: 'Senior Full Stack Engineer',
    email: 'alex.mercer@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexmercer',
    website: 'alexmercer.dev',
  },
  summary: 'Results-driven Full Stack Engineer with 6+ years of experience designing and deploying scalable web architectures, resilient distributed microservices, and high-performance cloud APIs. Proven track record leading technical teams and optimizing enterprise systems.',
  skills: {
    technical: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'GraphQL', 'AWS', 'TailwindCSS'],
    soft: ['Technical Leadership', 'Cross-Functional Collaboration', 'Agile Architecture', 'Problem Solving'],
    languages: ['English', 'German'],
  },
  experience: [
    {
      company: 'Nexus Software Systems',
      role: 'Senior Full Stack Engineer',
      duration: '2022 - Present',
      location: 'San Francisco, CA',
      bullet_points: [
        'Architected distributed microservices processing over 5M daily transactions with 99.99% uptime',
        'Reduced API latency by 42% through distributed Redis caching and query indexing',
        'Mentored eight junior and mid-level engineers in clean code and test-driven development',
      ],
    },
    {
      company: 'HyperScale Cloud Labs',
      role: 'Software Engineer',
      duration: '2020 - 2022',
      location: 'Austin, TX',
      bullet_points: [
        'Built responsive client web applications in React and TypeScript for 120,000 active enterprise users',
        'Implemented automated CI/CD deployment pipelines cutting release cycle times by 65%',
      ],
    },
  ],
  education: [
    {
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science in Computer Science',
      year: '2016 - 2020',
      grade: '3.85 GPA',
    },
  ],
  projects: [
    {
      title: 'Distributed Event Streaming Engine',
      technologies: ['Node.js', 'Kafka', 'Docker', 'Go'],
      description: 'High-throughput event bus handling asynchronous telemetry data with persistent message delivery guarantees.',
    },
    {
      title: 'Cloud Cost Optimization Dashboard',
      technologies: ['React', 'TypeScript', 'TailwindCSS', 'AWS SDK'],
      description: 'Interactive analytics dashboard surfacing real-time cloud resource utilization and savings opportunities.',
    },
  ],
};

const TEMPLATE_OPTIONS = [
  { id: 'modern', label: 'Modern Gray' },
  { id: 'classic', label: 'Classic Blue' },
  { id: 'twocolumn', label: 'Clean White (Two Column)' },
  { id: 'minimal', label: 'Bold Header (Minimal)' },
];

const ResumeForm = () => {
  const { selectedTemplate, setSelectedTemplate } = useTemplate();
  const currentTemplate = selectedTemplate || 'modern';

  const [formData, setFormData] = useState({
    personal_info: {
      full_name: '',
      job_title: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
    },
    summary: '',
    skills: {
      technical: [],
      soft: [],
      languages: [],
    },
    experience: [
      {
        company: '',
        role: '',
        duration: '',
        location: '',
        bullet_points: [''],
      },
    ],
    education: [
      {
        institution: '',
        degree: '',
        year: '',
        grade: '',
      },
    ],
    projects: [
      {
        title: '',
        technologies: [],
        description: '',
      },
    ],
  });

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Update Personal Info
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [name]: value,
      },
    }));
  };

  // Update Skills
  const handleSkillChange = (category, value) => {
    const arr = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setFormData((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: arr,
      },
    }));
  };

  // Education Helpers
  const handleEducationChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [...prev.education, { institution: '', degree: '', year: '', grade: '' }],
    }));
  };

  const removeEducation = (index) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  // Experience Helpers
  const handleExperienceChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.experience];
      if (field === 'bullet_points') {
        updated[index] = {
          ...updated[index],
          bullet_points: value.split('\n').filter((line) => line.trim().length > 0),
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, experience: updated };
    });
  };

  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        { company: '', role: '', duration: '', location: '', bullet_points: [''] },
      ],
    }));
  };

  const removeExperience = (index) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  // Project Helpers
  const handleProjectChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.projects];
      if (field === 'technologies') {
        updated[index] = {
          ...updated[index],
          technologies: value.split(',').map((s) => s.trim()).filter(Boolean),
        };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      return { ...prev, projects: updated };
    });
  };

  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        { title: '', technologies: [], description: '' },
      ],
    }));
  };

  const removeProject = (index) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  // Load Sample Data matching current template
  const handleLoadSample = () => {
    setFormData(getDummyDataForTemplate(currentTemplate));
  };

  // AI Auto-Generation
  const handleAIGenerate = async () => {
    setIsGenerating(true);
    setAiError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ai/generate-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt || 'Full Stack Engineer with React, Node.js, and Cloud experience',
          currentData: formData.personal_info.full_name ? formData : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate resume');
      }

      if (data.resumeData) {
        setFormData(data.resumeData);
      }
    } catch (err) {
      setAiError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePDFDownload = () => {
    const filename = `${formData.personal_info.full_name || 'Resume'}.pdf`;
    generatePDF('resume-preview', filename);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-gray-50 min-h-screen py-10 px-4">
      <div className="w-full max-w-6xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Resume Builder & Live Preview
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Unified multi-template engine with guaranteed layout consistency
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadSample}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Load Sample Profile
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={handlePDFDownload}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              Download PDF
            </button>
          </div>
        </div>

        {/* AI Generator Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
          <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wider mb-2">
            AI Resume Assistant (Gemini)
          </label>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g., Lead DevOps Engineer with Kubernetes, AWS, and Terraform experience..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-semibold transition"
            >
              {isGenerating ? 'Generating...' : 'Auto-Generate with AI'}
            </button>
          </div>
          {aiError && (
            <p className="text-xs text-rose-600 font-medium mt-2">{aiError}</p>
          )}
        </div>

        {/* Form Sections Grid */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
          {/* Personal Info */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  name="full_name"
                  value={formData.personal_info.full_name}
                  onChange={handlePersonalInfoChange}
                  placeholder="e.g. Alex Mercer"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                <input
                  name="job_title"
                  value={formData.personal_info.job_title}
                  onChange={handlePersonalInfoChange}
                  placeholder="e.g. Full Stack Engineer"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.personal_info.email}
                  onChange={handlePersonalInfoChange}
                  placeholder="e.g. alex@example.com"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  name="phone"
                  value={formData.personal_info.phone}
                  onChange={handlePersonalInfoChange}
                  placeholder="e.g. +1 (555) 234-5678"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  name="location"
                  value={formData.personal_info.location}
                  onChange={handlePersonalInfoChange}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">LinkedIn</label>
                <input
                  name="linkedin"
                  value={formData.personal_info.linkedin}
                  onChange={handlePersonalInfoChange}
                  placeholder="e.g. linkedin.com/in/username"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Portfolio / Website</label>
                <input
                  name="website"
                  value={formData.personal_info.website}
                  onChange={handlePersonalInfoChange}
                  placeholder="e.g. portfolio.dev"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">
              Professional Summary
            </h2>
            <textarea
              rows="3"
              value={formData.summary}
              onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
              placeholder="Concise overview of your career background, core competencies, and notable accomplishments..."
              className="w-full border border-slate-300 p-3 rounded-lg text-sm"
            />
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 border-b border-slate-200 pb-2">
              Skills
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technical (comma separated)
                </label>
                <input
                  value={formData.skills.technical.join(', ')}
                  onChange={(e) => handleSkillChange('technical', e.target.value)}
                  placeholder="React, TypeScript, Node.js, AWS"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Soft / Professional (comma separated)
                </label>
                <input
                  value={formData.skills.soft.join(', ')}
                  onChange={(e) => handleSkillChange('soft', e.target.value)}
                  placeholder="Team Leadership, Agile, Communication"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Languages (comma separated)
                </label>
                <input
                  value={formData.skills.languages.join(', ')}
                  onChange={(e) => handleSkillChange('languages', e.target.value)}
                  placeholder="English, Spanish, German"
                  className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Work Experience */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900">Work Experience</h2>
              <button
                type="button"
                onClick={addExperience}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                Add Experience
              </button>
            </div>

            <div className="space-y-6">
              {formData.experience.map((exp, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase">
                      Position #{idx + 1}
                    </span>
                    {formData.experience.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="text-xs text-rose-600 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(e) => handleExperienceChange(idx, 'company', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Role"
                      value={exp.role}
                      onChange={(e) => handleExperienceChange(idx, 'role', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Duration (e.g. 2022 - Present)"
                      value={exp.duration}
                      onChange={(e) => handleExperienceChange(idx, 'duration', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Location (e.g. San Francisco, CA)"
                      value={exp.location}
                      onChange={(e) => handleExperienceChange(idx, 'location', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Bullet Points (one accomplishment per line)
                    </label>
                    <textarea
                      rows="3"
                      value={exp.bullet_points.join('\n')}
                      onChange={(e) => handleExperienceChange(idx, 'bullet_points', e.target.value)}
                      placeholder="Architected distributed microservices processing 5M transactions...&#10;Reduced latency by 42% via Redis..."
                      className="w-full border border-slate-300 p-2.5 rounded-lg text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900">Education</h2>
              <button
                type="button"
                onClick={addEducation}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                Add Education
              </button>
            </div>

            <div className="space-y-4">
              {formData.education.map((edu, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase">
                      Degree #{idx + 1}
                    </span>
                    {formData.education.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="text-xs text-rose-600 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                      placeholder="Institution"
                      value={edu.institution}
                      onChange={(e) => handleEducationChange(idx, 'institution', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Degree / Field"
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(idx, 'degree', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Year (e.g. 2016 - 2020)"
                      value={edu.year}
                      onChange={(e) => handleEducationChange(idx, 'year', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Grade / GPA"
                      value={edu.grade}
                      onChange={(e) => handleEducationChange(idx, 'grade', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
              <h2 className="text-xl font-bold text-slate-900">Projects</h2>
              <button
                type="button"
                onClick={addProject}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                Add Project
              </button>
            </div>

            <div className="space-y-4">
              {formData.projects.map((proj, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600 uppercase">
                      Project #{idx + 1}
                    </span>
                    {formData.projects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProject(idx)}
                        className="text-xs text-rose-600 hover:underline font-semibold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Project Title"
                      value={proj.title}
                      onChange={(e) => handleProjectChange(idx, 'title', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                    <input
                      placeholder="Technologies (comma separated)"
                      value={proj.technologies.join(', ')}
                      onChange={(e) => handleProjectChange(idx, 'technologies', e.target.value)}
                      className="border border-slate-300 p-2 rounded-lg text-sm"
                    />
                  </div>
                  <textarea
                    rows="2"
                    placeholder="Project description and key outcomes..."
                    value={proj.description}
                    onChange={(e) => handleProjectChange(idx, 'description', e.target.value)}
                    className="w-full border border-slate-300 p-2 rounded-lg text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Section with Dynamic Template Switcher */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Live Resume Preview</h2>
              <p className="text-xs text-slate-500">
                Switch templates dynamically to see your data rendered without missing fields or broken layouts.
              </p>
            </div>

            {/* Template Switcher Pills */}
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_OPTIONS.map((opt) => {
                const isActive = currentTemplate === opt.id || (opt.id === 'modern' && currentTemplate === 'template1') || (opt.id === 'classic' && currentTemplate === 'template2') || (opt.id === 'twocolumn' && currentTemplate === 'template3') || (opt.id === 'minimal' && currentTemplate === 'template4');
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedTemplate(opt.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scrollable A4 Document Viewport */}
          <div className="overflow-x-auto bg-slate-100 p-8 rounded-2xl flex justify-center shadow-inner border border-slate-200">
            <div id="resume-preview">
              <TemplateRenderer
                templateId={currentTemplate}
                resumeData={formData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeForm;