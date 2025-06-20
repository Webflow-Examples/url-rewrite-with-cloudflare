# Cloudflare Workers and Proxy Mode for URL Rewriting

## What is URL Rewriting using Cloudflare?

URL rewriting using Cloudflare rules refers to the use of Cloudflare features to modify URLs or request/response data as traffic passes through its network. This is commonly done to:

- Rewrite URLs dynamically (what this repo explains)
- Redirect URLs (e.g., from HTTP to HTTPS)
- Modify headers or paths for caching or routing
- Enable features like URL normalization or hiding sensitive query strings

These rules help control how content is accessed and served — all without requiring changes to the origin server's configuration. See [Cloudflare URL Rewrite Rules](https://developers.cloudflare.com/rules/transform/url-rewrite/).

---

## Overview

This project demonstrates how to use [Cloudflare Workers](https://developers.cloudflare.com/workers/) to **rewrite URLs dynamically** while preserving the user-facing browser path.

The example covered here rewrites:

**/blog/category/post-item**

to...

**/blog/post-item**

...but the original URL (**/blog/category/post-item**) remains visible in the browser for users and search engines.

This is useful for SEO and a consistent user experience — users see clean, organized URLs while content is served from a simplified path.

---

## Live Example

Visit the live URL [www.hifzly.app](https://www.hifzly.app/), use buttons to navigate, and observe URL pattern.

Access the Designer through [the read-only link](https://preview.webflow.com/preview/cloudflare-workers-url-rewriting?utm_medium=preview_link&utm_source=designer&utm_content=cloudflare-workers-url-rewriting&preview=80fb2a878fc7f749ab7e5d567c4f4c06&workflow=preview).

---

## Prerequisites

- A domain managed by [Cloudflare](https://dash.cloudflare.com/)
- DNS records pointing to your hosting origin (e.g. Webflow)
- DNS records set to **Proxied** (orange cloud icon)
- Basic familiarity with Cloudflare dashboard

> Ensure a [custom domain is connected](https://help.webflow.com/hc/en-us/articles/33961239562387-Manually-connect-a-custom-domain) to your Webflow project before proceeding with the Cloudflare instructions.

---

# Cloudflare Setup Guide

## 1. Enable Proxying for Your Domain

1. Navigate to the **DNS** tab for your domain in the Cloudflare dashboard.
2. Locate your `A` or `CNAME` record for `@` and/or `www`.
3. Ensure the **Proxy status** is set to **Proxied** (orange cloud).

> _Why?_ Workers only run when requests are proxied through Cloudflare.

<img src="https://github.com/Wadoodh/images/blob/main/cf-rewrite-repo/cf-proxy-dns.png?raw=true" alt="screenshot showing cloudflare dns records in proxy mode" width="100%"/>

---

## 2. Create the Worker Script

1. Go to **Compute (Workers) > Workers & Pages** in your Cloudflare dashboard.
2. Click **“Create”** → **“Create Worker”** and follow prompts.
3. Name your Worker (e.g., `rewrite-blog-url`).
4. Replace the default script with intended logic (rewrite in this case):

```js
// The same code is in worker.js
// Cloudflare Worker script for URL rewriting
// This worker intercepts requests and rewrites URLs from /blog/category/post-item to /blog/post-item
export default {
  // Main fetch handler that processes all incoming requests
  async fetch(request) {
    // Parse the incoming request URL to extract pathname and other components
    const url = new URL(request.url);

    // Regular expression to match URLs in the pattern: /blog/category/post-item
    // ^\/blog\/ - starts with /blog/
    // [^\/]+ - matches one or more characters that are not forward slashes (the category)
    // \/ - matches a forward slash
    // ([^\/]+) - captures one or more characters that are not forward slashes (the post item)
    // $ - end of string
    const match = url.pathname.match(/^\/blog\/[^\/]+\/([^\/]+)$/);

    // If the URL matches our target pattern
    if (match) {
      // Extract the post item name from the captured group (the final segment)
      const postItem = match[1]; // Capture the final segment

      // Create a new URL object based on the original request
      const rewrittenUrl = new URL(request.url);

      // Rewrite the pathname to remove the category: /blog/post-item
      rewrittenUrl.pathname = `/blog/${postItem}`;

      // Create a new request with the rewritten URL, preserving all original request properties
      const newRequest = new Request(rewrittenUrl.toString(), request);

      // Fetch and return the response from the rewritten URL
      return fetch(newRequest);
    }

    // For all other URLs that don't match our pattern, pass through unchanged
    // This ensures the worker doesn't interfere with other site functionality
    return fetch(request);
  },
};
```

---

## 3. Create Worker Routes

1. Select domain in Cloudflare dashboard.
2. Click **Worker Routes** from sidebar.
3. Add route, define route, and select Worker (the one made in step 2).

<img src="https://github.com/Wadoodh/images/blob/main/cf-rewrite-repo/worker-routes.png?raw=true" alt="screenshot showing cloudflare dns records in proxy mode" width="100%"/>

---

## Cloudflare Caching

To improve performance and reduce load on the origin server, enable edge caching in your Cloudflare Worker. This allows Cloudflare to cache and serve full HTML responses (such as blog pages) directly from its global edge network, resulting in faster load times while keeping the original browser URL visible to users and search engines.

**Note:** _Remember to bust cache as needed i.e., when the Webflow site is published, done with the [site publish webhook event](https://developers.webflow.com/data/v2.0.0-beta/reference/all-events#site_publish)._

# Webflow Setup

Instead of linking to CMS pages through the Webflow UI, create links through a dynamic embed inside of a collection list/on the CMS template page. Dynamic embeds give you access to CMS fields which allow you to construct the URL as needed. For example, the URL below matches the custom structure that is commonly required.

**Note:** _Ensure your Webflow CMS architecture is consistent with how the URL should be formatted i.e., usage of reference fields._

We can style UI elements as usual in Webflow i.e., on a style guide page, and use those classes in our HTML embed.

**Note:** _If [per page CSS](https://help.webflow.com/hc/en-us/articles/33961287288339-Advanced-publishing-options#h_01JVSQ6BEADRDHR1NJABQ11E18) is enabled, ensure the class used in the code embed i.e., **button**, is mentioned in page settings as custom CSS because per page CSS does not include classes used in embeds and will result in missing styles if not added as custom CSS._

<img src="https://github.com/Wadoodh/images/blob/main/cf-rewrite-repo/dynamic-url.png?raw=true" alt="screenshot showing cloudflare dns records in proxy mode" width="100%"/>

## Canonical Tags on CMS Template Pages

Using custom code, update canonical tags on CMS template pages to reflect the custom URL structure. See [Dynamic canonical URLs on CMS template pages](https://enterprise-content-hub.webflow.io/resources/dynamic-canonical-urls-on-cms-template-pages).

## Custom Sitemap

Since the URLs we are constructing are not part of Webflow, you will need to manage a custom sitemap/proxy one into place with the updated versions of these URLs while also ensuring the original Webflow ones are not mentioned i.e., include **/blog/category/post-item** and exclude **/blog/post-item**.

This ensures search engines index the rewritten URLs (e.g., /blog/category/post-item) instead of internal ones (/blog/post-item), preserving your intended content structure.

## Additional Considerations for Reverse Proxies

Also see the [Webflow Reverse Proxy Checklist](https://ent-site-checklist.webflow.io/stages/reverse-proxy-setups) to ensure related areas are also covered.
