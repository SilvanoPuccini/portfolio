// ============================================
// SILVANO PUCCINI PORTFOLIO
// Main JavaScript Entry Point
// ============================================

import '../scss/main.scss';
import { translations } from './i18n.js';

// ============================================
// STATE
// ============================================
let currentLang = localStorage.getItem('lang') || 'en';
let currentTheme = localStorage.getItem('theme') || 'dark';

// ============================================
// THEME TOGGLE
// ============================================
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  
  // Set initial theme
  if (currentTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  
  themeToggle?.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    if (currentTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem('theme', currentTheme);
  });
}

// ============================================
// LANGUAGE TOGGLE
// ============================================
function initLanguage() {
  const langToggle = document.getElementById('lang-toggle');
  
  // Set initial language
  updateContent(currentLang);
  
  langToggle?.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'es' : 'en';
    updateContent(currentLang);
    localStorage.setItem('lang', currentLang);
  });
}

function updateContent(lang) {
  const t = translations[lang];
  
  // Update all translatable elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) {
      el.textContent = t[key];
    }
  });
  
  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (t[key]) {
      el.placeholder = t[key];
    }
  });
  
  // Update lang toggle button text
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.textContent = t.langToggle;
  }
  
  // Update html lang attribute
  document.documentElement.lang = lang;
}

// ============================================
// FORM HANDLING (Formspree)
// ============================================
function initForm() {
  const form = document.getElementById('contact-form');
  const successMessage = document.getElementById('form-success');
  
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm(form)) {
      return;
    }
    
    // Get form data
    const formData = new FormData(form);
    
    try {
      const response = await fetch('https://formspree.io/f/xvgvlzgk', {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        form.reset();
        form.style.display = 'none';
        successMessage?.classList.add('show');
        
        // Reset after 5 seconds
        setTimeout(() => {
          form.style.display = 'flex';
          successMessage?.classList.remove('show');
        }, 5000);
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(translations[currentLang].formErrorRequired);
    }
  });
  
  // Real-time validation
  form?.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.parentElement.classList.contains('error')) {
        validateField(input);
      }
    });
  });
}

function validateForm(form) {
  let isValid = true;
  
  form.querySelectorAll('input[required], textarea[required]').forEach(field => {
    if (!validateField(field)) {
      isValid = false;
    }
  });
  
  return isValid;
}

function validateField(field) {
  const parent = field.parentElement;
  const errorEl = parent.querySelector('.form__error');
  let isValid = true;
  let errorMessage = '';
  
  // Required check
  if (field.required && !field.value.trim()) {
    isValid = false;
    errorMessage = translations[currentLang].formErrorRequired;
  }
  
  // Email validation
  if (field.type === 'email' && field.value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(field.value)) {
      isValid = false;
      errorMessage = translations[currentLang].formErrorEmail;
    }
  }
  
  // Update UI
  if (isValid) {
    parent.classList.remove('error');
    if (errorEl) errorEl.textContent = '';
  } else {
    parent.classList.add('error');
    if (errorEl) errorEl.textContent = errorMessage;
  }
  
  return isValid;
}

// ============================================
// SKILLS ANIMATION
// ============================================
function initSkillsAnimation() {
  const progressBars = document.querySelectorAll('.skill__progress-fill');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bar = entry.target;
        const width = bar.getAttribute('data-progress');
        bar.style.width = width + '%';
        observer.unobserve(bar);
      }
    });
  }, { threshold: 0.5 });
  
  progressBars.forEach(bar => observer.observe(bar));
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLanguage();
  initForm();
  initSkillsAnimation();
  initSmoothScroll();
});
