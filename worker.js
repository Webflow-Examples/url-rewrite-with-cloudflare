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
