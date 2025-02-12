import * as React from 'react';

function SvgForm(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <rect fill="none" height="6" rx="2" width="34" x="33" y="50" />
      <rect fill="none" height="6" rx="2" width="30" x="33" y="62" />
      <g fill="unset">
        <path d="m63 36h10.6a1.37 1.37 0 0 0 1.4-1.4 1.28 1.28 0 0 0 -.4-1l-13.2-13.2a1.28 1.28 0 0 0 -1-.4 1.37 1.37 0 0 0 -1.4 1.4v10.6a4 4 0 0 0 4 4z" />
        <path d="m73 42h-14a6 6 0 0 1 -6-6v-14a2 2 0 0 0 -2-2h-20a6 6 0 0 0 -6 6v48a6 6 0 0 0 6 6h38a6 6 0 0 0 6-6v-30a2 2 0 0 0 -2-2zm-40-2a2 2 0 0 1 2-2h8.18a2 2 0 0 1 2 2v2a2 2 0 0 1 -2 2h-8.18a1.94 1.94 0 0 1 -2-2zm30 26a2 2 0 0 1 -2 2h-26a2 2 0 0 1 -2-2v-2a2 2 0 0 1 2-2h26a2 2 0 0 1 2 2zm4-12a2 2 0 0 1 -2 2h-30a2 2 0 0 1 -2-2v-2a2 2 0 0 1 2-2h30a2 2 0 0 1 2 2z" />
      </g>
    </svg>
  );
}

export default SvgForm;
