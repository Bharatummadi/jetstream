import * as React from 'react';

function SvgPartners(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <path
        fill="unset"
        d="M77 31.7h-6c-1.3 0-2.6-.6-3.6-1.5l-4.8-4.1c-1-.8-2.3-1.4-3.6-1.4H47.3c-1.5 0-2.9.6-4 1.7l-6.2 5.1c-.5.4-.5 1.2-.1 1.7l1.9 1.8c1.3 1 3 1.2 4.3.3l5.5-3.3c.7-.5 1.7-.3 2.3.3l17.3 16.8c.4.4.7 1 .7 1.6v4.5c0 1.2.9 2.5 2 2.5h6c1.1 0 2-.9 2-2.1V33.7c0-1.2-.9-2-2-2zm-17 18L49.2 39.2l-3 1.8c-1.5.9-3.2 1.4-4.9 1.4-2.1 0-4.3-.8-6-2.2L31.4 37c-.9-.7-1.4-1.5-1.5-2.6-.2-1.1-1-1.7-2-1.7H21c-1.1 0-2 .6-2 1.8v18.2c0 1.2.9 2 2 2h4c.3 0 .7-1.1 1.1-1.6 1.5-2 3.7-3.1 6.1-3.4 2.4-.2 4.7.6 6.6 2.3l12.5 11.4c1.1 1 1.9 2.1 2.4 3.5.3.7 1.1.9 1.6.4l4.7-4.7c2.4-2.4 4.2-8 2-10.6l-2-2.3zm-25.1 7.4c-1.3-1.2-3.2-1-4.2.4-1.1 1.4-.9 3.4.4 4.6l12.5 11.3c.6.6 1.4.8 2.2.7.8-.1 1.5-.5 2-1.2 1.1-1.4.9-3.4-.4-4.6L34.9 57.1z"
      />
    </svg>
  );
}

export default SvgPartners;
