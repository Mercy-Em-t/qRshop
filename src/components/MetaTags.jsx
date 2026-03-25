import { useEffect } from "react";

/**
 * MetaTags Component
 * Dynamically updates document title and meta description for SEO in SPAs.
 * @param {Object} props
 * @param {string} props.title - The page title
 * @param {string} props.description - The meta description
 * @param {string} props.ogImage - Optional OpenGraph image URL
 */
export default function MetaTags({ title, description, ogImage }) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }

    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
      
      // Also update OpenGraph description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", description);
    }

    if (ogImage) {
      let metaOgImage = document.querySelector('meta[property="og:image"]');
      if (metaOgImage) {
        metaOgImage.setAttribute("content", ogImage);
      }
    }
  }, [title, description, ogImage]);

  return null; // This component doesn't render anything
}
