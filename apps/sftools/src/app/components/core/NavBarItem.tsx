/** @jsx jsx */
import { jsx } from '@emotion/core';
import classNames from 'classnames';
import { FunctionComponent } from 'react';
import { Link, useLocation } from 'react-router-dom';
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface NavBarItemProps {
  path: string;
  label: string | JSX.Element;
  title: string;
}

export const NavBarItem: FunctionComponent<NavBarItemProps> = ({ path, label, title }) => {
  const location = useLocation<{ soql: string }>();
  return (
    <li className={classNames('slds-context-bar__item', { 'slds-is-active': location.pathname === path })}>
      <Link tabIndex={-1} role="menuitem" className="slds-context-bar__label-action" title={title} to={{ pathname: path }}>
        <span className="slds-truncate" title={title}>
          {label}
        </span>
      </Link>
    </li>
  );
};

export default NavBarItem;