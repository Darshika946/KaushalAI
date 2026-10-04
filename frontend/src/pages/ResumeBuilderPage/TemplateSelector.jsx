import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTemplate } from './context/TemplateContext';
import TemplateRenderer from './templates/TemplateRenderer';
import { getDummyDataForTemplate } from './templates/dummyResumeData';

const templates = [
  { id: 'template1', name: 'Modern Gray', description: 'Ahmed Saah style with 2-column sidebar and underlined headers' },
  { id: 'template2', name: 'Classic Blue', description: 'Isabel Mercado style with centered header and full-width profile' },
  { id: 'template3', name: 'Clean White', description: 'Pedro Fernandes style with sharp vertical dividing rule' },
  { id: 'template4', name: 'Bold Header', description: 'Lorna Alvarado style with split header and timeline points' },
];

const TemplateSelector = () => {
  const navigate = useNavigate();
  const { setSelectedTemplate } = useTemplate();

  const handleSelect = (templateId) => {
    setSelectedTemplate(templateId);
    navigate('/resume-form');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12 relative">
      <div className="max-w-6xl w-full z-10 space-y-10">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#1A2A44] tracking-tight drop-shadow-sm">
            Select Your Resume Template
          </h1>
          <p className="text-slate-600 text-sm md:text-base mt-2 max-w-xl mx-auto">
            Live preview rendered from the exact template engine with guaranteed A4 layout fidelity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 hover:border-slate-300 hover:shadow-2xl overflow-hidden transform hover:scale-[1.01] transition-all duration-300 flex flex-col"
            >
              {/* Single Source of Truth: Render identical React component with dummy data */}
              <div className="w-full h-80 overflow-hidden bg-slate-100 border-b border-slate-200 flex justify-center items-start pointer-events-none select-none relative p-3">
                <div
                  style={{
                    transform: 'scale(0.33)',
                    transformOrigin: 'top center',
                    width: '210mm',
                    height: '297mm',
                  }}
                  className="shadow-md"
                >
                  <TemplateRenderer
                    templateId={template.id}
                    resumeData={getDummyDataForTemplate(template.id)}
                  />
                </div>
              </div>

              <div className="p-6 text-center bg-white flex flex-col justify-between flex-1">
                <div>
                  <h2 className="text-xl font-bold text-[#1A2A44] mb-1">{template.name}</h2>
                  <p className="text-xs text-slate-500 mb-4">{template.description}</p>
                </div>
                <div>
                  <button
                    onClick={() => handleSelect(template.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-bold shadow-md transition"
                  >
                    Use This Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;