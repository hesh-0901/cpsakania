// js/login.js - Authentification simplifiée par Pseudo + Code court
import { auth } from "../config/app.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const formLogin = document.getElementById('form-login');
const errorDiv = document.getElementById('error-message');
const btnSubmit = document.getElementById('btn-submit');

if (formLogin) {
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Réinitialisation de l'état
        errorDiv.classList.add('hidden');
        btnSubmit.disabled = true;
        btnSubmit.innerText = "Vérification en cours...";

        // Récupération et nettoyage du pseudo
        const pseudo = document.getElementById('login-email').value.trim().toLowerCase();
        const codeSecret = document.getElementById('login-password').value;

        // Astuce : On crée un faux e-mail invisible pour Firebase
        const emailVirtuel = `${pseudo}@sakania.org`;

        try {
            // Connexion transparente avec l'identifiant camouflé
            await signInWithEmailAndPassword(auth, emailVirtuel, codeSecret);
            
            // Direction le tableau de bord ERP
            window.location.href = "index.html";
        } catch (error) {
            console.error("Échec de connexion :", error.code);
            errorDiv.classList.remove('hidden');
            
            // Messages adaptés au contexte
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                errorDiv.innerText = "Identifiant ou code secret incorrect.";
            } else if (error.code === 'auth/too-many-requests') {
                errorDiv.innerText = "Trop de tentatives. Patientez un instant.";
            } else {
                errorDiv.innerText = "Erreur de connexion. Vérifiez votre réseau.";
            }
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i data-lucide="log-in" class="w-4 h-4"></i> Se connecter`;
            if (window.lucide) window.lucide.createIcons();
        }
    });
}
