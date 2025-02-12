---
id: overview
title: Overview
description: Jetstream is the most advanced toolkit for working with and administering Salesforce. We know that once you start using Jetstream, you'll wonder how you ever got on without it!
keywords: [salesforce, salesforce admin, salesforce developer, salesforce automation, salesforce workbench]
sidebar_label: Overview
slug: /
---

import OrgTroubleshootingTable from './\_org-troubleshooting-table.mdx';

Jetstream is the most advanced toolkit for working with and administering Salesforce. We know that once you start using Jetstream, you'll wonder how you ever got on without it!

If you have questions or want to talk with a human, you can reach support by emailing [support@getjetstream.app](mailto:support@getjetstream.app).

:::tip

If you haven't created a Jetstream account, you can [sign-up here](https://getjetstream.app/oauth/signup).

:::

## Adding your first org

After logging in to Jetstream for the first time, you need to connect Jetstream to one or more of your Salesforce orgs.

Jetstream uses OAuth2 for org connections, which means that Jetstream never gains access directly to your password.

To add an org, click the <button className="button button--link">+ Add Org</button> button at the top of the page.

You will be asked to choose an org type which is used to determine the which Salesforce login page to redirect you to for authorization.

- **Production / Developer**
  - `https://login.salesforce.com`
- **Sandbox**
  - `https://test.salesforce.com`
- **Pre-release**
  - `https://prerellogin.pre.salesforce.com`
- **Custom Login URL**
  - `https://my--domain.my.salesforce.com`

### Troubleshooting Tips

<OrgTroubleshootingTable />
