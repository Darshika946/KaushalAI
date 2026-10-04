import React from 'react';
import TemplateClassic from './TemplateClassic';

const Template2 = (props) => {
  return <TemplateClassic resumeData={props.resumeData || props.data} />;
};

export default Template2;
