
    <!-- 
      JavaScript for Mobile Menu, Smooth Scrolling, Modals, and Firebase Auth
      All logic is now consolidated into one module script for proper handling of Firebase.
    -->
    <script type="module">
        // --- Firebase Imports ---
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { 
            getAuth, 
            onAuthStateChanged, 
            createUserWithEmailAndPassword, 
            signInWithEmailAndPassword, 
            signOut,
            signInAnonymously,
            signInWithCustomToken 
        } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { getFirestore, setLogLevel } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

        // --- Firebase Config & Init ---
        // These global variables are provided by the environment
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

        let app, auth, db;
        let currentUserId = null;

        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            setLogLevel('Debug'); // Enable Firestore logging
            console.log("Firebase initialized successfully.");
        } catch (error) {
            console.error("Firebase Initialization Error:", error);
            const body = document.querySelector('body');
            body.innerHTML = `<div class="bg-red-800 text-white p-8 text-center min-h-screen flex items-center justify-center">Firebase initialization failed. Please check your configuration.</div>`;
        }


        // --- Wait for DOM to be ready before attaching listeners ---
        document.addEventListener('DOMContentLoaded', () => {
            
            // --- DOM Elements ---
            const menuButton = document.getElementById('mobile-menu-button');
            const mobileMenu = document.getElementById('mobile-menu');
            const contactForm = document.getElementById('contact-form');
            const formMessage = document.getElementById('form-message');
            
            // Auth UI Elements
            const authLinks = document.getElementById('auth-links');
            const userMenu = document.getElementById('user-menu');
            const userEmailDisplay = document.getElementById('user-email-display');
            const signOutBtn = document.getElementById('signout-btn');
            
            const mobileAuthLinks = document.getElementById('mobile-auth-links');
            const mobileUserMenu = document.getElementById('mobile-user-menu');
            const mobileUserEmailDisplay = document.getElementById('mobile-user-email-display');
            const signOutBtnMobile = document.getElementById('signout-btn-mobile');
            
            // Modals & Forms
            const signInModal = document.getElementById('signin-modal');
            const signUpModal = document.getElementById('signup-modal');
            const signInForm = document.getElementById('signin-form');
            const signUpForm = document.getElementById('signup-form');
            const signInError = document.getElementById('signin-error');
            const signUpError = document.getElementById('signup-error');

            const showSignInBtns = [
                document.getElementById('show-signin-btn'), 
                document.getElementById('show-signin-btn-mobile')
            ];
            const showSignUpBtns = [
                document.getElementById('show-signup-btn'), 
                document.getElementById('show-signup-btn-mobile')
            ];
            const closeModalBtns = document.querySelectorAll('.close-modal-btn');


            // --- Mobile Menu Toggle ---
            if (menuButton) {
                menuButton.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                    // Toggle hamburger icon to 'X' icon
                    if (mobileMenu.classList.contains('hidden')) {
                        menuButton.innerHTML = `<svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>`;
                    } else {
                        menuButton.innerHTML = `<svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>`;
                    }
                });
            }
            
            // --- Smooth Scrolling ---
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    const targetId = this.getAttribute('href');
                    
                    if (targetId && targetId.length > 1) { 
                        e.preventDefault();
                        const targetElement = document.querySelector(targetId);
                        
                        if(targetElement) {
                            targetElement.scrollIntoView({
                                behavior: 'smooth'
                            });
                            
                            // Close mobile menu on link click
                            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                                mobileMenu.classList.add('hidden');
                                menuButton.innerHTML = `<svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>`;
                            }
                        }
                    } else if (targetId === '#') {
                        e.preventDefault();
                    }
                });
            });

            // --- Contact Form Handling ---
            if (contactForm) {
                contactForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    const formData = new FormData(contactForm);
                    const name = formData.get('name');
                    
                    formMessage.textContent = `Thank you, ${name}! Your message has been sent.`;
                    formMessage.classList.remove('hidden', 'bg-red-200', 'text-red-800');
                    formMessage.classList.add('bg-green-200', 'text-green-800');
                    contactForm.reset();
                    
                    setTimeout(() => {
                        formMessage.classList.add('hidden');
                    }, 5000);
                });
            }

            // --- Modal Logic ---
            const showModal = (modal) => {
                if(modal) modal.classList.remove('hidden');
            };
            const closeModal = (modal) => {
                if(modal) modal.classList.add('hidden');
                // Clear any previous error messages
                if(signInError) signInError.classList.add('hidden');
                if(signUpError) signUpError.classList.add('hidden');
            };

            showSignInBtns.forEach(btn => {
                if (btn) btn.addEventListener('click', () => showModal(signInModal));
            });
            showSignUpBtns.forEach(btn => {
                if (btn) btn.addEventListener('click', () => showModal(signUpModal));
            });
            closeModalBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    closeModal(signInModal);
                    closeModal(signUpModal);
                });
            });

            // --- Firebase Auth Functions ---
            const handleSignUp = async (e) => {
                e.preventDefault();
                const email = signUpForm.email.value;
                const password = signUpForm.password.value;
                const confirmPassword = signUpForm['confirm-password'].value;

                if (password !== confirmPassword) {
                    signUpError.textContent = "Passwords do not match.";
                    signUpError.classList.remove('hidden');
                    return;
                }

                try {
                    await createUserWithEmailAndPassword(auth, email, password);
                    closeModal(signUpModal);
                    signUpForm.reset();
                } catch (error) {
                    console.error("Sign Up Error:", error);
                    signUpError.textContent = error.message;
                    signUpError.classList.remove('hidden');

                }
            };

            const handleSignIn = async (e) => {
                e.preventDefault();
                const email = signInForm.email.value;
                const password = signInForm.password.value;

                try {
                    await signInWithEmailAndPassword(auth, email, password);
                    closeModal(signInModal);
                    signInForm.reset();
                } catch (error) {
                    console.error("Sign In Error:", error);
                    signInError.textContent = error.message;
                    signInError.classList.remove('hidden');
                }
            };

            const handleSignOut = async () => {
                try {
                    await signOut(auth);
                    // Sign back in anonymously as per environment rules
                    await signInAnonymously(auth);
                } catch (error) {
                    console.error("Sign Out Error:", error);
                }
            };

            // Attach form listeners
            if (signUpForm) signUpForm.addEventListener('submit', handleSignUp);
            if (signInForm) signInForm.addEventListener('submit', handleSignIn);
            if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
            if (signOutBtnMobile) signOutBtnMobile.addEventListener('click', handleSignOut);


            // --- Auth State Listener ---
            if (auth) {
                onAuthStateChanged(auth, (user) => {
                    if (user && !user.isAnonymous) {
                        // User is signed in
                        currentUserId = user.uid;
                        
                        let userDisplayName = 'Welcome, User';
                        let mobileUserDisplayName = 'Welcome, User';
                        
                        if (user.email) {
                             const emailTruncated = user.email.length > 20 ? user.email.substring(0, 20) + '...' : user.email;
                             userDisplayName = `Welcome, ${emailTruncated}`;
                             mobileUserDisplayName = `Welcome, ${user.email}`;
                        }
                        
                        // Update Desktop Nav
                        if (userEmailDisplay) userEmailDisplay.textContent = userDisplayName;
                        if (authLinks) authLinks.classList.add('hidden');
                        if (userMenu) {
                            userMenu.classList.remove('hidden');
                            userMenu.classList.add('flex');
                        }

                        // Update Mobile Nav
                        if (mobileUserEmailDisplay) mobileUserEmailDisplay.textContent = mobileUserDisplayName;
                        if (mobileAuthLinks) mobileAuthLinks.classList.add('hidden');
                        if (mobileUserMenu) mobileUserMenu.classList.remove('hidden');
                        
                        // Close any open auth modals
                        closeModal(signInModal);
                        closeModal(signUpModal);

                    } else {
                        // User is logged out or anonymous
                        currentUserId = user ? user.uid : null; // Store anonymous UID if exists
                        
                        // Update Desktop Nav
                        if (authLinks) {
                            authLinks.classList.remove('hidden');
                            authLinks.classList.add('flex');
                        }
                        if (userMenu) {
                            userMenu.classList.add('hidden');
                            userMenu.classList.remove('flex');
                        }

                        // Update Mobile Nav
                        if (mobileAuthLinks) mobileAuthLinks.classList.remove('hidden');
                        if (mobileUserMenu) mobileUserMenu.classList.add('hidden');
                    }
                });
            }

            // --- Initial Anonymous Sign In (as required by platform) ---
            (async () => {
                if (!auth || auth.currentUser) return; // Auth not init'd or already logged in

                try {
                    if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                        console.log("Signing in with custom token...");
                        await signInWithCustomToken(auth, __initial_auth_token);
                    } else {
                        console.log("Signing in anonymously...");
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Initial auth error:", error);
                }
            })();

        });
    </script>