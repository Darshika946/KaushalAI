/**
 * Normalize and sanitize resume data into the strict unified schema.
 * Applies defensive guardrails to eliminate empty items, stray punctuation, and emojis.
 */

// Helper to check if a value is non-empty
export const hasContent = (val) => {
  return typeof val === 'string' && val.trim().length > 0;
};

// Strip emojis from text
export const stripEmojis = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
};

// Safely convert comma-separated string or array into an array of non-empty trimmed strings
export const toCleanArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => stripEmojis(typeof item === 'string' ? item.trim() : String(item || '').trim()))
      .filter((item) => item.length > 0);
  }
  if (typeof val === 'string') {
    return val
      .split(/[,\n]/)
      .map((item) => stripEmojis(item.trim()))
      .filter((item) => item.length > 0);
  }
  return [];
};

// Safely format bullet points from array or multiline string
export const toBulletPoints = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .flatMap((item) => {
        if (typeof item === 'string') {
          return item.split('\n');
        }
        return [String(item || '')];
      })
      .map((item) => stripEmojis(item.replace(/^[\s•\-\*]+/, '').trim()))
      .filter((item) => item.length > 0);
  }
  if (typeof val === 'string') {
    return val
      .split('\n')
      .map((item) => stripEmojis(item.replace(/^[\s•\-\*]+/, '').trim()))
      .filter((item) => item.length > 0);
  }
  return [];
};

/**
 * Universal Normalizer
 * Guarantees every template receives identical, defensively guarded data.
 */
export const normalizeResumeData = (rawData) => {
  const data = rawData || {};

  // Personal Info (support nested or flat legacy fields)
  const legacyInfo = data.personal_info || {};
  const personal_info = {
    full_name: stripEmojis(legacyInfo.full_name || data.name || data.fullName || ''),
    job_title: stripEmojis(legacyInfo.job_title || data.job_title || data.jobTitle || data.title || ''),
    email: stripEmojis(legacyInfo.email || data.email || ''),
    phone: stripEmojis(legacyInfo.phone || data.phone || ''),
    location: stripEmojis(legacyInfo.location || data.location || ''),
    linkedin: stripEmojis(legacyInfo.linkedin || data.linkedin || ''),
    website: stripEmojis(legacyInfo.website || data.website || data.portfolio || ''),
  };

  // Summary (support summary or legacy objective)
  const summary = stripEmojis(data.summary || data.objective || '');

  // Skills
  const rawSkills = data.skills || {};
  const skills = {
    technical: toCleanArray(rawSkills.technical || rawSkills.hard),
    soft: toCleanArray(rawSkills.soft || rawSkills.extracurricular),
    languages: toCleanArray(rawSkills.languages),
  };

  // Experience
  const rawExp = Array.isArray(data.experience) ? data.experience : [];
  const experience = rawExp
    .map((item) => {
      const bullet_points = toBulletPoints(item.bullet_points || item.details);
      return {
        company: stripEmojis(item.company || ''),
        role: stripEmojis(item.role || item.position || item.title || ''),
        duration: stripEmojis(item.duration || item.period || ''),
        location: stripEmojis(item.location || ''),
        bullet_points,
      };
    })
    .filter((item) => item.company || item.role || item.bullet_points.length > 0);

  // Education
  const rawEdu = Array.isArray(data.education) ? data.education : [];
  const education = rawEdu
    .map((item) => {
      return {
        institution: stripEmojis(item.institution || item.school || item.university || ''),
        degree: stripEmojis(item.degree || item.major || item.details || ''),
        year: stripEmojis(item.year || item.duration || ''),
        grade: stripEmojis(item.grade || item.gpa || ''),
      };
    })
    .filter((item) => item.institution || item.degree);

  // Projects
  const rawProjects = Array.isArray(data.projects) ? data.projects : [];
  const projects = rawProjects
    .map((item) => {
      return {
        title: stripEmojis(item.title || item.name || ''),
        technologies: toCleanArray(item.technologies || item.tech_stack || item.tools),
        description: stripEmojis(item.description || item.summary || ''),
      };
    })
    .filter((item) => item.title || item.description);

  return {
    personal_info,
    summary,
    skills,
    experience,
    education,
    projects,
  };
};

export default normalizeResumeData;
