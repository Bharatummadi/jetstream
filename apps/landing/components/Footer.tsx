import React from 'react';
import Link from 'next/link';

interface FooterProps {
  currPage: 'home' | 'about' | 'tos' | 'privacy';
}

function getLink(path: string, label: string, isActive: boolean) {
  return (
    <div className="px-5 py-2">
      {!isActive && (
        <Link href={path}>
          {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
          <a className="text-base leading-6 text-gray-500 hover:text-gray-900">{label}</a>
        </Link>
      )}
      {isActive && <span className="text-base leading-6 text-gray-900">{label}</span>}
    </div>
  );
}

export const Footer = ({ currPage }: FooterProps) => (
  <div className="bg-white">
    <div className="max-w-screen-xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
      <nav className="-mx-5 -my-2 flex flex-wrap justify-center">
        {getLink('/', 'Home', currPage === 'home')}
        {getLink('/terms-of-service', 'Terms of Service', currPage === 'tos')}
        {getLink('/privacy', 'Privacy Policy', currPage === 'privacy')}
      </nav>
      <div className="mt-8">
        <p className="text-center text-base leading-6 text-gray-400">&copy; 2020 Jetstream, Inc. All rights reserved.</p>
      </div>
    </div>
  </div>
);

export default Footer;