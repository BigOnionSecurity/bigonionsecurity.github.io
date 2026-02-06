document.addEventListener('DOMContentLoaded', function() {

    // --- BLOG LOGIC (runs on blog pages) ---
    const blogPostList = document.getElementById('blog-post-list');
    const postContentContainer = document.getElementById('post-content');
    const sidebarPostList = document.getElementById('sidebar-post-list');

    if (sidebarPostList) {
        fetch('posts.json')
            .then(response => response.json())
            .then(posts => {
                posts.forEach(post => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `<a href="post.html?file=${post.file}">${post.title}</a>`;
                    sidebarPostList.appendChild(listItem);
                });
            });
    }

    if (blogPostList) {
        fetch('posts.json')
            .then(response => response.json())
            .then(posts => {
                posts.forEach(post => {
                    const postElement = document.createElement('article');
                    postElement.classList.add('blog-post-item');
                    postElement.innerHTML = `
                        <h3><a href="post.html?file=${post.file}">${post.title}</a></h3>
                        <p class="post-meta">Published on ${post.date} by ${post.author}</p>
                        <p>${post.summary}</p>
                        <a href="post.html?file=${post.file}" class="btn-read-more">Read More</a>
                    `;
                    blogPostList.appendChild(postElement);
                });
            });
    }

    if (postContentContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const postFile = urlParams.get('file');

        if (postFile) {
            fetch(`posts/${postFile}`)
                .then(response => response.text())
                .then(markdown => {
                    const postContent = postContentContainer.querySelector('.container');
                    postContent.innerHTML = marked.parse(markdown);
                });
        }
    }

    async function handleTypingAnimation() {
        const subtitleElement = document.getElementById('typing-subtitle');
        if (!subtitleElement) return;

        const text = "The Offensive Edge in Cybersecurity";
        const typingSpeed = 100;
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Type out the text
        for (let i = 0; i <= text.length; i++) {
            subtitleElement.textContent = text.substring(0, i);
            await sleep(typingSpeed);
        }

        // Add class to hide cursor
        subtitleElement.classList.add('typing-done');
    }

    // --- INDEX PAGE LOGIC (runs only on the main page) ---
    if (document.querySelector('.hero')) {
        handleTypingAnimation();
        const sections = document.querySelectorAll('.hero, section[id]');
        const navLinks = document.querySelectorAll('nav a');

        if (window.innerWidth > 768) {
            // Fade animation observer
            const fadeObserver = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (!entry.target.classList.contains('hero')) {
                            entry.target.style.opacity = 1;
                        }
                    } else {
                        if (!entry.target.classList.contains('hero')) {
                            entry.target.style.opacity = 0;
                        }
                    }
                });
            }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

            // Initial state setup for fade animation
            sections.forEach((section, index) => {
                if (index !== 0) {
                    section.style.opacity = 0;
                }
                fadeObserver.observe(section);
            });
        } else {
            // On mobile, ensure all sections are visible without a fade effect
            sections.forEach(section => {
                section.style.opacity = 1;
            });
        }

        // Active link highlighting
        window.addEventListener('scroll', () => {
            let currentSectionId = '';
            const headerHeight = 115;
            sections.forEach(section => {
                const sectionTop = section.offsetTop - headerHeight - 1;
                if (window.scrollY >= sectionTop) {
                    currentSectionId = section.getAttribute('id');
                }
            });
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 2) {
                currentSectionId = 'contact';
            }
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${currentSectionId}`) {
                    link.classList.add('active');
                }
            });
        });


        // Set initial active link
        const firstNavLink = document.querySelector('nav a[href="#home"]');
        if (firstNavLink) {
            firstNavLink.classList.add('active');
        }

        // Contact form submission
        const contactForm = document.querySelector('.contact-form');
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formContainer = document.querySelector('#contact .container');
            formContainer.innerHTML = '<h2>Thank You!</h2><p>Your message has been sent. We will get back to you shortly.</p>';
        });
    }

    // --- GLOBAL LOGIC (runs on all pages) ---
    const currentPage = window.location.pathname.split('/').pop();
    if (currentPage === 'blog.html' || currentPage === 'post.html') {
        const blogNavLink = document.querySelector('nav a[href="blog.html"]');
        if (blogNavLink) {
            // Remove active class from any other link
            document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));
            // Add active class to the blog link
            blogNavLink.classList.add('active');
        }
    }

    const hamburger = document.querySelector('.hamburger-menu');
    const navMenu = document.querySelector('nav ul');
    const allNavLinks = document.querySelectorAll('nav a');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        allNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                }
            });
        });
    }
});
