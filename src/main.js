// Andy's Persona and FAQs
const ANDY_PERSONA = {
  name: "Andy",
  experience: "Decades in property buying",
  traits: ["friendly", "professional", "honest", "discrete"],
  core_message: "We buy houses quickly for cash, any condition, guaranteed offer."
};

const FAQS = [
  {
    keywords: ["how fast", "speed", "timescale", "week"],
    answer: "We can complete the sale in as little as 7 days. Once we agree on a price, we move fast to get you the cash."
  },
  {
    keywords: ["condition", "broken", "repair", "worse", "derelict"],
    answer: "I buy property in ANY condition. Honestly, the worse the condition, the more interested I am! Don't worry about repairs."
  },
  {
    keywords: ["where", "london", "essex", "locations", "hertfordshire"],
    answer: "We cover all of London, Hertfordshire, and Essex. Specifically areas like Southend, Basildon, Wickford, Billericay, and Walthamstow."
  },
  {
    keywords: ["guaranteed", "offer", "promise"],
    answer: "I offer a guaranteed offer. If I don't buy it personally, I have a network of close contacts who will secure the best possible offer for you."
  },
  {
    keywords: ["financial", "stop", "repossession", "pressure"],
    answer: "I specialize in helping people under financial pressure. Our service is discrete and fast to help you move forward quickly."
  },
  {
    keywords: ["cost", "fees", "pay"],
    answer: "There are no hidden fees or high-pressure tactics. My service is discrete and professional with no obligation."
  }
];

// UI Element Selections
const chatToggle = document.getElementById('chat-toggle');
const chatWindow = document.getElementById('chat-window');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const leadForm = document.getElementById('lead-form');

// Chat Logic
chatToggle.addEventListener('click', () => {
  chatWindow.classList.toggle('active');
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const msg = chatInput.value.trim();
  if (!msg) return;

  addMessage(msg, 'user');
  chatInput.value = '';

  // Simulate Andy's thinking
  setTimeout(() => {
    const response = getAndyResponse(msg);
    addMessage(response, 'bot');
  }, 1000);
});

function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `message message-${sender}`;
  msgDiv.textContent = text;
  chatMessages.appendChild(msgDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getAndyResponse(input) {
  const lowercaseInput = input.toLowerCase();
  
  for (const faq of FAQS) {
    if (faq.keywords.some(k => lowercaseInput.includes(k))) {
      return faq.answer;
    }
  }
  
  return "That's a great question. Every property is unique. If you fill out the form, I'll do a quick analysis of the Land Registry and local listings for you and give you a call back. My number is 01702 416 323 if you want to chat now.";
}

// Form Logic and "Agentic AI Investigation"
leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(leadForm);
  const data = Object.fromEntries(formData.entries());
  
  // Show AI Investigation progress
  const submitBtn = leadForm.querySelector('button');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  
  const steps = [
    "Initializing Agentic Investigation...",
    "Querying HM Land Registry for Title Number...",
    "Scanning Rightmove and Zoopla for price comparisons...",
    "Reviewing EIGroup for auction data (0.25m radius)...",
    "Calculating guaranteed cash offer..."
  ];

  for (const step of steps) {
    submitBtn.textContent = step;
    await new Promise(r => setTimeout(r, 1200));
  }

  submitBtn.textContent = "Analysis Complete - Sending Data...";
  await new Promise(r => setTimeout(r, 800));

  alert("Thank you! Andy has completed the initial investigation. He will review the property data and contact you shortly with your guaranteed offer.");
  submitBtn.textContent = originalText;
  submitBtn.disabled = false;
  leadForm.reset();
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});
