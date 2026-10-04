import React from 'react';
import normalizeResumeData, { hasContent } from './normalizeResumeData';

const TemplateModern = ({ resumeData, data: fallbackData }) => {
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
        {/* Header Section */}
        <header className="border-b-2 border-slate-700 pb-4 mb-6">
          {hasContent(personal_info.full_name) && (
            <h1 className="text-3xl font-extrabold tracking-wider text-slate-900 uppercase">
              {personal_info.full_name}
            </h1>
          )}
          {hasContent(personal_info.job_title) && (
            <p className="text-xs font-semibold tracking-[0.25em] text-slate-600 uppercase mt-1">
              {personal_info.job_title}
            </p>
          )}
        </header>

        {/* 2-Column Grid Layout */}
        <div className="flex flex-row gap-8">
          {/* Left Column (35% Width) */}
          <aside className="w-[34%] flex flex-col gap-5 border-r border-slate-300 pr-6">
            {/* Contact */}
            {hasContact && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase border-b-2 border-slate-800 pb-1 mb-2.5">
                  Contact
                </h2>
                <div className="space-y-1.5 text-[11px] text-slate-700 leading-normal">
                  {hasContent(personal_info.phone) && (
                    <div className="break-words">
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
                    <div className="break-words">
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

            {/* Skills */}
            {allSkills.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase border-b-2 border-slate-800 pb-1 mb-2.5">
                  Skills
                </h2>
                <ul className="list-disc ml-4 space-y-1 text-[11px] text-slate-700 leading-normal">
                  {allSkills.map((skill, idx) => (
                    <li key={idx} className="pl-0.5">
                      {skill}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Languages */}
            {skills.languages && skills.languages.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase border-b-2 border-slate-800 pb-1 mb-2.5">
                  Languages
                </h2>
                <ul className="list-disc ml-4 space-y-1 text-[11px] text-slate-700 leading-normal">
                  {skills.languages.map((lang, idx) => (
                    <li key={idx} className="pl-0.5">
                      {lang}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Projects in Sidebar (if any) */}
            {projects.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase border-b-2 border-slate-800 pb-1 mb-2.5">
                  Key Projects
                </h2>
                <div className="space-y-2 text-[11px] text-slate-700">
                  {projects.map((proj, idx) => (
                    <div key={idx} className="resume-item">
                      <div className="font-bold text-slate-900 leading-tight">
                        {proj.title}
                      </div>
                      {proj.technologies && proj.technologies.length > 0 && (
                        <div className="text-[10px] text-slate-500 font-medium">
                          {proj.technologies.join(', ')}
                        </div>
                      )}
                      {hasContent(proj.description) && (
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">
                          {proj.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </aside>

          {/* Right Main Column (66% Width) */}
          <main className="w-[66%] flex flex-col gap-5">
            {/* Profile / Summary */}
            {hasContent(summary) && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-2">
                  Profile
                </h2>
                <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                  {summary}
                </p>
              </section>
            )}

            {/* Work Experience */}
            {experience.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-3">
                  Work Experience
                </h2>
                <div className="space-y-4">
                  {experience.map((item, idx) => {
                    const companyAndLocation = [item.company, item.location]
                      .filter(Boolean)
                      .join(' - ');

                    return (
                      <div key={idx} className="resume-item">
                        <div className="flex justify-between items-baseline">
                          <h3 className="text-xs font-bold text-slate-900">
                            {item.company || item.role}
                          </h3>
                          {hasContent(item.duration) && (
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                              {item.duration}
                            </span>
                          )}
                        </div>

                        {hasContent(item.role) && (
                          <div className="text-[11px] font-medium italic text-slate-700">
                            {item.role}
                            {companyAndLocation && !item.company ? ` (${companyAndLocation})` : ''}
                          </div>
                        )}

                        {item.bullet_points && item.bullet_points.length > 0 && (
                          <ul className="list-disc ml-4 space-y-1 mt-1.5 text-[11px] text-slate-700 leading-relaxed">
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

            {/* Education */}
            {education.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-2.5">
                  Education
                </h2>
                <div className="space-y-2.5">
                  {education.map((edu, idx) => (
                    <div key={idx} className="resume-item">
                      <div className="flex justify-between items-baseline">
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">
                          {edu.degree || edu.institution}
                        </h3>
                        {hasContent(edu.year) && (
                          <span className="text-[10px] font-medium text-slate-500">
                            {edu.year}
                          </span>
                        )}
                      </div>
                      {hasContent(edu.institution) && edu.degree && (
                        <div className="text-[11px] text-slate-700 mt-0.5">
                          {edu.institution}
                          {hasContent(edu.grade) && (
                            <span className="text-slate-500"> | {edu.grade}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default TemplateModern;
