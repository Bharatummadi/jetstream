import * as React from 'react';

function SvgThanks(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <path
        fill="unset"
        d="M74 35h-8.7c2.5-3.9 2.3-9.1-.8-12.3-1.7-1.7-4-2.7-6.4-2.7-2.6 0-5.2 1.2-7.1 3.2-.4.4-.7.8-1 1.3-.3-.5-.6-.9-1-1.3-1.9-2.1-4.5-3.2-7.1-3.2-2.4 0-4.6 1-6.3 2.7-3.1 3.2-3.3 8.4-.8 12.3H26c-3.3 0-6 2.7-6 6v4c0 1.1.9 2 2 2h56c1.1 0 2-.9 2-2v-4c0-3.3-2.7-6-6-6zm-27 0c-2.1 0-5.1-.8-6.8-2.6-1.5-1.6-1.7-4.2-.3-5.5.7-.7 1.4-.8 2-.8 1 0 2 .5 2.7 1.3 1.7 1.9 2.4 5.1 2.4 7.1v.5zm12.8-2.6C58.1 34.2 55.1 35 53 35v-.6c0-2 .7-5.2 2.4-7.1.8-.8 1.8-1.3 2.7-1.3.5 0 1.3.1 2 .8 1.3 1.4 1.2 3.9-.3 5.6zM74 53H53v27h17.2c3.2 0 5.8-2.6 5.8-5.8V55c0-1.1-.9-2-2-2zM24 55v19c0 3.3 2.7 6 6 6h17V53H26c-1.1 0-2 .9-2 2z"
      />
    </svg>
  );
}

export default SvgThanks;
