import React from 'react';
import TemplateMinimal from './TemplateMinimal';

const Template4 = (props) => {
  return <TemplateMinimal resumeData={props.resumeData || props.data} />;
};

export default Template4;
