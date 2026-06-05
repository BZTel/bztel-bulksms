// BZTel Scroll-Triggered Reveal Animations
document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // Apply staggered delays if defined via data-delay attribute
          const delay = element.getAttribute('data-delay');
          if (delay) {
            element.style.transitionDelay = `${delay}ms`;
          }
          
          element.classList.add('reveal-active');
          
          // Once animated, stop observing this element
          observer.unobserve(element);
        }
      });
    }, {
      root: null, // Viewport
      rootMargin: '0px 0px -80px 0px', // Trigger slightly before element enters view
      threshold: 0.1 // 10% of element is visible
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback for older browsers: show all elements immediately
    revealElements.forEach(el => el.classList.add('reveal-active'));
  }
});
