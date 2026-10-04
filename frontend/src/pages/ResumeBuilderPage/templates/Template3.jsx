import React from 'react';
import TemplateTwoColumn from './TemplateTwoColumn';

const Template3 = (props) => {
  return <TemplateTwoColumn resumeData={props.resumeData || props.data} />;
};

export default Template3;
