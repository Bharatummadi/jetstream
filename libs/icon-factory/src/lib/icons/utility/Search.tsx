import * as React from 'react';

function SvgSearch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 52 52" aria-hidden="true" {...props}>
      <path
        d="M49.598 45.298l-13.4-13.3c2.7-3.8 4.1-8.6 3.4-13.7-1.2-8.6-8.2-15.4-16.9-16.2-11.8-1.2-21.8 8.8-20.6 20.7.8 8.6 7.6 15.7 16.2 16.9 5.1.7 9.9-.7 13.7-3.4l13.3 13.3c.6.6 1.5.6 2.1 0l2.1-2.1c.6-.6.6-1.6.1-2.2zm-41.6-24.4c0-7.1 5.8-12.9 12.9-12.9 7.1 0 12.9 5.8 12.9 12.9 0 7.1-5.8 12.9-12.9 12.9-7.1 0-12.9-5.7-12.9-12.9z"
        fill="unset"
        fillRule="evenodd"
      />
    </svg>
  );
}

export default SvgSearch;
