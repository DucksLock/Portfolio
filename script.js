document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // Scroll smoothly to the experience section when button is clicked
    const btn = document.getElementById('btn-experience');
    const target = document.getElementById('experience');
    if (btn && target) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // Optional: make Contact button scroll to the contact section if present
    const btnContact = document.getElementById('btn-contact');
    const contactSection = document.getElementById('contact');
    if (btnContact && contactSection) {
        btnContact.addEventListener('click', function (e) {
            e.preventDefault();
            contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
});
