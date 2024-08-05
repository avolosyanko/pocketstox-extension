// Fade in animation
document.addEventListener('DOMContentLoaded', () => {
  const animationOrder = [
    ['square', 'circle'],
    ['donut', 'love'],
    ['cone']
  ];
  
  animationOrder.forEach((group, groupIndex) => {
    setTimeout(() => {
      group.forEach(id => {
        const img = document.getElementById(id);
        if (img) {
          img.style.opacity = '1';
          img.style.transform = 'translateY(0)';
        }
      });
    }, groupIndex * 200); // 200ms delay between groups
  });
});

// FAQ accordion
document.querySelectorAll('.question-button').forEach(button => {
  button.addEventListener('click', () => {
    const faq = button.nextElementSibling;
    const icon = button.querySelector('.dropdown');
    
    faq.classList.toggle('show');
  });
});

// Brevo configuration
window.REQUIRED_CODE_ERROR_MESSAGE = 'Please choose a country code';
window.LOCALE = 'en';
window.EMAIL_INVALID_MESSAGE = window.SMS_INVALID_MESSAGE = "Email provided is invalid. Please try again.";
window.REQUIRED_ERROR_MESSAGE = "No email was provided.";
window.GENERIC_INVALID_MESSAGE = "Email provided is invalid. Please try again.";

window.translation = {
  common: {
    selectedList: '{quantity} list selected',
    selectedLists: '{quantity} lists selected'
  }
};

const AUTOHIDE = false;