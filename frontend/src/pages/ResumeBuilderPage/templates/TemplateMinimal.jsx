import React from 'react';
import normalizeResumeData, { hasContent } from './normalizeResumeData';

const TemplateMinimal = ({ resumeData, data: fallbackData }) => {
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
        {/* Split Header: Name/Title on Left, Contact on Right */}
        <header className="flex flex-row justify-between items-end pb-3">
          <div>
            {hasContent(personal_info.full_name) && (
              <h1 className="text-3xl font-light tracking-[0.15em] text-slate-900 uppercase leading-tight">
                {personal_info.full_name}
              </h1>
            )}
            {hasContent(personal_info.job_title) && (
              <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mt-1">
                {personal_info.job_title}
              </p>
            )}
          </div>

          {hasContact && (
            <div className="text-right text-[11px] text-slate-600 space-y-0.5">
              {hasContent(personal_info.phone) && <div>{personal_info.phone}</div>}
              {hasContent(personal_info.email) && <div className="break-all">{personal_info.email}</div>}
              {hasContent(personal_info.location) && <div>{personal_info.location}</div>}
              {hasContent(personal_info.website) && <div className="break-all">{personal_info.website}</div>}
              {hasContent(personal_info.linkedin) && <div className="break-all">{personal_info.linkedin}</div>}
            </div>
          )}
        </header>

        <div className="border-b border-slate-300 my-3" />

        {/* Two-Column Split Layout */}
        <div className="flex flex-row gap-6">
          {/* Left Column: Profile & Work Experience (58% Width) */}
          <main className="w-[58%] pr-6 border-r border-slate-200 flex flex-col gap-3">
            {/* Profile */}
            {hasContent(summary) && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-1.5">
                  Profile
                </h2>
                <p className="text-[11px] text-slate-700 leading-relaxed text-justify">
                  {summary}
                </p>
                <div className="border-b border-slate-200 my-3" />
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
                    const companyAndLoc = [item.company, item.location].filter(Boolean).join(' | ');

                    return (
                      <div key={idx} className="resume-item">
                        {hasContent(item.duration) && (
                          <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-0.5">
                            ■ {item.duration}
                          </div>
                        )}
                        {companyAndLoc && (
                          <div className="text-[11px] text-slate-600 font-medium">
                            {companyAndLoc}
                          </div>
                        )}
                        {hasContent(item.role) && (
                          <h3 className="text-xs font-bold text-slate-900 mt-0.5 mb-1">
                            {item.role}
                          </h3>
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
                <div className="border-b border-slate-200 my-3" />
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-2">
                  Projects
                </h2>
                <div className="space-y-2">
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

          {/* Right Column: Education, Skills, Languages (42% Width) */}
          <aside className="w-[42%] pl-2 flex flex-col gap-3">
            {/* Education */}
            {education.length > 0 && (
              <section className="resume-section">
                <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase mb-2">
                  Education
                </h2>
                <div className="space-y-2.5 text-[11px] text-slate-700">
                  {education.map((edu, idx) => (
                    <div key={idx} className="resume-item">
                      {hasContent(edu.year) && (
                        <div className="font-semibold text-slate-800 text-[10px] mb-0.5">
                          {edu.year}
                        </div>
                      )}
                      {hasContent(edu.institution) && (
                        <div className="font-bold text-slate-900 leading-tight uppercase text-[11px]">
                          {edu.institution}
                        </div>
                      )}
                      {hasContent(edu.degree) && (
                        <div className="text-[11px] text-slate-700 mt-0.5">
                          • {edu.degree}
                        </div>
                      )}
                      {hasContent(edu.grade) && (
                        <div className="text-[10px] text-slate-500 mt-0.5 ml-2">
                          GPA / Grade: {edu.grade}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="border-b border-slate-200 my-3" />
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
                {skills.languages && skills.languages.length > 0 && (
                  <div className="border-b border-slate-200 my-3" />
                )}
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

export default TemplateMinimal;
