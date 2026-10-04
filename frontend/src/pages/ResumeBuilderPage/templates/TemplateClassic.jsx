import React from 'react';
import normalizeResumeData, { hasContent } from './normalizeResumeData';

const TemplateClassic = ({ resumeData, data: fallbackData }) => {
  const data = normalizeResumeData(resumeData || fallbackData);
  const { personal_info, summary, skills, experience, education, projects } = data;

  const hasContact =
    hasContent(personal_info.phone) ||
    hasContent(personal_info.email) ||
    hasContent(personal_info.location) ||
    hasContent(personal_info.website) ||
    hasContent(personal_info.linkedin);

  const allSkills = [
    ...(skills.technical || []),
    ...(skills.soft || []),
  ];

  return (
    <div className="resume-a4-page p-10 bg-white text-slate-800 flex flex-col justify-between font-sans">
      <div>
        {/* Centered Classic Header */}
        <header className="text-center">
          {hasContent(personal_info.full_name) && (
            <h1 className="text-3xl font-extrabold tracking-[0.2em] text-slate-900 uppercase">
              {personal_info.full_name}
            </h1>
          )}
          {hasContent(personal_info.job_title) && (
            <p className="text-xs font-semibold tracking-[0.35em] text-slate-600 uppercase mt-1.5">
              {personal_info.job_title}
            </p>
          )}
        </header>

        <div className="border-b border-slate-300 my-4" />

        {/* Full-Width Profile / Summary Section */}
        {hasContent(summary) && (
          <section className="resume-section">
            <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-1.5">
              Profile
            </h2>
            <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
              {summary}
            </p>
            <div className="border-b border-slate-300 my-4" />
          </section>
        )}

        {/* Two-Column Split Layout */}
        <div className="flex flex-row gap-6">
          {/* Left Column: Professional Experience & Projects (58% Width) */}
          <main className="w-[58%] border-r border-slate-200 pr-6 flex flex-col gap-4">
            {experience.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-3">
                  Professional Experience
                </h2>
                <div className="space-y-4">
                  {experience.map((item, idx) => {
                    const subtitleParts = [item.company, item.duration].filter(Boolean);
                    const subtitle = subtitleParts.join(' | ');

                    return (
                      <div key={idx} className="resume-item">
                        {hasContent(item.role) && (
                          <h3 className="text-xs font-bold text-slate-900">
                            {item.role}
                          </h3>
                        )}
                        {subtitle && (
                          <div className="text-[11px] text-slate-600 font-medium mb-1">
                            {subtitle}
                            {hasContent(item.location) && (
                              <span className="text-slate-500"> ({item.location})</span>
                            )}
                          </div>
                        )}
                        {item.bullet_points && item.bullet_points.length > 0 && (
                          <ul className="list-disc ml-4 space-y-1 text-[11px] text-slate-700 leading-relaxed">
                            {item.bullet_points.map((point, pIdx) => (
                              <li key={pIdx}>{point}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-2.5">
                  Projects
                </h2>
                <div className="space-y-2.5">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="resume-item">
                      <div className="flex flex-wrap items-baseline gap-1.5">
                        <h3 className="text-xs font-bold text-slate-900">
                          {proj.title}
                        </h3>
                        {proj.technologies && proj.technologies.length > 0 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({proj.technologies.join(', ')})
                          </span>
                        )}
                      </div>
                      {hasContent(proj.description) && (
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Right Column: Contact, Education, Skills, Languages (42% Width) */}
          <aside className="w-[42%] pl-2 flex flex-col gap-4">
            {/* Contact */}
            {hasContact && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-2">
                  Contact
                </h2>
                <div className="space-y-1 text-[11px] text-slate-700">
                  {hasContent(personal_info.phone) && (
                    <div>
                      <span className="font-semibold text-slate-900">Phone: </span>
                      {personal_info.phone}
                    </div>
                  )}
                  {hasContent(personal_info.email) && (
                    <div className="break-all">
                      <span className="font-semibold text-slate-900">Email: </span>
                      {personal_info.email}
                    </div>
                  )}
                  {hasContent(personal_info.location) && (
                    <div>
                      <span className="font-semibold text-slate-900">Location: </span>
                      {personal_info.location}
                    </div>
                  )}
                  {hasContent(personal_info.website) && (
                    <div className="break-all">
                      <span className="font-semibold text-slate-900">Web: </span>
                      {personal_info.website}
                    </div>
                  )}
                  {hasContent(personal_info.linkedin) && (
                    <div className="break-all">
                      <span className="font-semibold text-slate-900">LinkedIn: </span>
                      {personal_info.linkedin}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Education */}
            {education.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-2">
                  Education
                </h2>
                <div className="space-y-2 text-[11px] text-slate-700">
                  {education.map((edu, idx) => (
                    <div key={idx} className="resume-item">
                      {hasContent(edu.institution) && (
                        <div className="font-bold text-slate-900 leading-tight">
                          {edu.institution}
                        </div>
                      )}
                      {hasContent(edu.degree) && (
                        <div className="text-[11px] text-slate-700 mt-0.5">
                          {edu.degree}
                        </div>
                      )}
                      <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                        {hasContent(edu.year) && <span>{edu.year}</span>}
                        {hasContent(edu.grade) && <span>{edu.grade}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Skills */}
            {allSkills.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-2">
                  Skills
                </h2>
                <ul className="list-disc ml-4 space-y-1 text-[11px] text-slate-700">
                  {allSkills.map((skill, idx) => (
                    <li key={idx}>{skill}</li>
                  ))}
                </ul>
              </section>
            )}

            {/* Languages */}
            {skills.languages && skills.languages.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-2">
                  Languages
                </h2>
                <ul className="list-disc ml-4 space-y-1 text-[11px] text-slate-700">
                  {skills.languages.map((lang, idx) => (
                    <li key={idx}>{lang}</li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TemplateClassic;
