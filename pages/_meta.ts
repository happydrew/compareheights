export default {
  index: {
    type: 'page',
    title: 'Home',
    display: 'hidden',
    theme: {
      layout: 'raw'
    }
  },
  "privacy-policy": {
    type: 'page',
    title: 'Privacy Policy',
    display: 'hidden'
  },
  "terms-of-service": {
    type: 'page',
    title: 'Terms of Service',
    display: 'hidden'
  },
  docs: {
    type: 'page',
    title: 'Documentation'
  },
  tags: {
    display: "children",
    theme: {
      layout: "raw",
    },
  },
  blog: {
    type: "page",
    title: "Blog",
    // display: "hidden",
    theme: {
      layout: "raw",
      typesetting: "article",
      timestamp: false,
    }
  },
  contact: {
    type: 'page',
    title: 'Contact',
    theme: {
      layout: 'raw'
    }
  },
  404: {
    type: 'page',
    theme: {
      timestamp: false,
      typesetting: 'article'
    }
  }
}
