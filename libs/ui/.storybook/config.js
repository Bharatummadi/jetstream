import { configure, addDecorator } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { withActions } from '@storybook/addon-actions';
import StoryRouter from 'storybook-react-router';
import '@salesforce-ux/design-system/assets/styles/salesforce-lightning-design-system.min.css';

addDecorator(withKnobs);
addDecorator(withActions());
addDecorator(StoryRouter());
configure(require.context('../src/lib', true, /\.stories\.(j|t)sx?$/), module);