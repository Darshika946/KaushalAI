import React from 'react';
import TemplateModern from './TemplateModern';
import TemplateClassic from './TemplateClassic';
import TemplateTwoColumn from './TemplateTwoColumn';
import TemplateMinimal from './TemplateMinimal';
import normalizeResumeData from './normalizeResumeData';
import './resumeStyles.css';

// Dynamic Template Registry
export const TEMPLATE_REGISTRY = {
  modern: TemplateModern,
  template1: TemplateModern,
  classic: TemplateClassic,
  template2: TemplateClassic,
  twocolumn: TemplateTwoColumn,
  'two-column': TemplateTwoColumn,
  template3: TemplateTwoColumn,
  minimal: TemplateMinimal,
  template4: TemplateMinimal,
};

/**
 * Dynamic Template Switcher
 * Receives templateId and resume data (via resumeData or data prop)
 * Renders the matching layout component with zero broken layouts or missing fields.
 */
export const TemplateRenderer = ({ templateId = 'modern', data, resumeData }) => {
  const normalizedData = normalizeResumeData(resumeData || data);

  // Normalize templateId key (case-insensitive, trimmed)
  const lookupKey = (templateId || 'modern').toLowerCase().trim();
  const ComponentToRender = TEMPLATE_REGISTRY[lookupKey] || TemplateModern;

  return <ComponentToRender resumeData={normalizedData} data={normalizedData} />;
};

export default TemplateRenderer;
