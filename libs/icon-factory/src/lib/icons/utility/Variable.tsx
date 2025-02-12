import * as React from 'react';

function SvgVariable(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 52 52" aria-hidden="true" {...props}>
      <path
        fill="unset"
        d="M42.6 17.8c2.4 0 7.2-2 7.2-8.4s-4.6-6.8-6.1-6.8c-2.8 0-5.6 2-8.1 6.3-2.5 4.4-5.3 9.1-5.3 9.1h-.1c-.6-3.1-1.1-5.6-1.3-6.7-.5-2.7-3.6-8.4-9.9-8.4-6.4 0-12.2 3.7-12.2 3.7-1 .7-1.7 1.9-1.7 3.3 0 2.1 1.7 3.9 3.9 3.9.6 0 1.2-.2 1.7-.4 0 0 4.8-2.7 5.9 0 .3.8.6 1.7.9 2.7 1.2 4.2 2.4 9.1 3.3 13.5l-4.2 6s-4.7-1.7-7.1-1.7-7.2 2-7.2 8.4 4.6 6.8 6.1 6.8c2.8 0 5.6-2 8.1-6.3 2.5-4.4 5.3-9.1 5.3-9.1.8 4 1.5 7.1 1.9 8.5 1.6 4.5 5.3 7.2 10.1 7.2 0 0 5 0 10.9-3.3 1.4-.6 2.4-2 2.4-3.6 0-2.1-1.7-3.9-3.9-3.9-.6 0-1.2.2-1.7.4 0 0-4.2 2.4-5.6.5-1-2-1.9-4.6-2.6-7.8-.6-2.8-1.3-6.2-2-9.5l4.3-6.2c-.1.1 4.6 1.8 7 1.8z"
      />
    </svg>
  );
}

export default SvgVariable;
