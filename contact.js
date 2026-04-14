import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const contactForm = document.getElementById('contact-form');
const successMsg = document.getElementById('success-msg');
const submitBtn = document.getElementById('submit-btn');

if (contactForm) {
    contactForm.onsubmit = async (e) => {
        e.preventDefault();
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        const payload = {
            name: document.getElementById('name').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            comments: document.getElementById('comments').value,
            responseMethod: document.querySelector('input[name="responseMethod"]:checked').value,
            timestamp: serverTimestamp(),
            source: 'Website Contact Page',
            status: 'New'
        };

        try {
            // 1. Save to Firestore for redundancy
            await addDoc(collection(db, "contactInquiries"), payload);

            // 2. Trigger Backend Notification (Cloud Function)
            const token = "CLIENT_SUBMISSION"; // Public submission token
            const resp = await fetch('https://us-central1-c4h-wesbite.cloudfunctions.net/processContactEnquiry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (resp.ok) {
                contactForm.style.display = 'none';
                successMsg.style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                throw new Error("Backend rejection");
            }
        } catch (err) {
            console.error("Submission Error:", err);
            alert("I'm sorry, we couldn't send your enquiry at this time. Please email us directly at andy@cash4houses.co.uk");
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Enquiry';
        }
    };
}
