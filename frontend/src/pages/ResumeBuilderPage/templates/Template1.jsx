import React from 'react';
import TemplateModern from './TemplateModern';

const Template1 = (props) => {
  return <TemplateModern resumeData={props.resumeData || props.data} />;
};

export default Template1;
