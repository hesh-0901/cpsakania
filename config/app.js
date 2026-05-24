// app.js - Logique de l'application Cellule Sakania
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Ta configuration Firebase officielle
const firebaseConfig = {
  apiKey: "AIzaSyAqacvHCgwKJi3aqxZUszUy_Ieyfoa9_Bg",
  authDomain: "cellulesakania.firebaseapp.com",
  projectId: "cellulesakania",
  storageBucket: "cellulesakania.firebasestorage.app",
  messagingSenderId: "241179092278",
  appId: "1:241179092278:web:415b0af94473730635bf97",
  measurementId: "G-43T1367967"
};

// Initialisation de Firebase et Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Références aux éléments du DOM
const formActivite = document.getElementById('form-activite');
const listeActivites = document.getElementById('liste-activites');

// --- 1. SOUVENIR ET ENREGISTRER UNE ACTIVITÉ ---
if (formActivite) {
    formActivite.addEventListener('submit', async (e) => {
        e.preventDefault(); // Empêche la page de se recharger

        // Récupération des valeurs saisies dans le formulaire
        const typeActivite = formActivite.querySelector('select').value;
        const nbPresents = parseInt(formActivite.querySelectorAll('input')[0].value) || 0;
        const nouvellesDecisions = parseInt(formActivite.querySelectorAll('input')[1].value) || 0;
        const remarques = formActivite.querySelector('textarea').value;

        // Bouton de soumission pour feedback visuel
        const btnSubmit = formActivite.querySelector('button[type="submit"]');
        const textOrigine = btnSubmit.innerText;
        btnSubmit.innerText = "Enregistrement en cours...";
        btnSubmit.disabled = true;

        try {
            // Ajout du document dans la collection "activites" de Firestore
            await addDoc(collection(db, "activites"), {
                type: typeActivite,
                presents: nbPresents,
                decisions: nouvellesDecisions,
                notes: remarques,
                cellule: "Sakania",
                ville: "Lubumbashi",
                dateEnregistrement: serverTimestamp()
            });

            // Réinitialisation du formulaire après succès
            formActivite.reset();
            alert("Rapport de la cellule Sakania enregistré avec succès !");
        } catch (error) {
            console.error("Erreur Firebase : ", error);
            alert("Erreur lors de l'enregistrement. Vérifie les règles de sécurité Firestore.");
        } finally {
            // Remise de l'état d'origine du bouton
            btnSubmit.innerText = textOrigine;
            btnSubmit.disabled = false;
        }
    });
}

// --- 2. LECTURE EN TEMPS RÉEL DES DERNIÈRES ACTIVITÉS ---
if (listeActivites) {
    // Requête : Trier les activités par date décroissante (les plus récentes en premier)
    const q = query(collection(db, "activites"), orderBy("dateEnregistrement", "desc"));

    // Écouteur en temps réel (onSnapshot)
    onSnapshot(q, (snapshot) => {
        // Vider la liste statique avant d'injecter les données réelles
        listeActivites.innerHTML = "";

        if (snapshot.empty) {
            listeActivites.innerHTML = `
                <div class="p-6 text-center text-stone text-sm bg-rich-black/30 border border-pine rounded-xl">
                    Aucune activité enregistrée pour le moment.
                </div>`;
            return;
        }

        snapshot.forEach((doc) => {
            const donnees = doc.data();
            
            // Formatage de la date Firebase
            let dateAffichee = "Récemment";
            if (donnees.dateEnregistrement) {
                const dateJS = donnees.dateEnregistrement.toDate();
                dateAffichee = dateJS.toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }

            // Choix de l'icône selon le type d'activité pour garder le côté pro
            let icone = "book-open";
            let couleurIcone = "text-mountain-meadow";
            if (donnees.type.includes("Prière") || donnees.type.includes("Intercession")) {
                icone = "flame";
                couleurIcone = "text-caribbean-green";
            } else if (donnees.type.includes("Évangélisation")) {
                icone = "compass";
                couleurIcone = "text-caribbean-green";
            }

            // Génération du template HTML avec tes classes Tailwind personnalisées
            const itemHTML = `
                <div class="p-4 bg-rich-black/50 border border-pine rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-mountain-meadow/30 transition">
                    <div class="flex items-start gap-3">
                        <div class="p-2 bg-bangladesh-green/20 border border-bangladesh-green/40 rounded-lg ${couleurIcone} mt-0.5">
                            <i data-lucide="${icone}" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-sm">${donnees.type}</h4>
                            <p class="text-xs text-stone mt-0.5">
                                Présents : <span class="text-anti-flash-white font-medium">${donnees.presents}</span> 
                                ${donnees.decisions > 0 ? `| Nouvelles âmes : <span class="text-caribbean-green font-medium">${donnees.decisions}</span>` : ''}
                            </p>
                            ${donnees.notes ? `<p class="text-xs text-stone italic mt-1 bg-dark-green/40 p-2 rounded border border-pine/50">${donnees.notes}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center justify-between sm:justify-end gap-4">
                        <span class="px-2.5 py-1 bg-mint/10 text-mint rounded-full text-xs font-medium border border-mint/20">Validé</span>
                        <span class="text-xs text-stone whitespace-nowrap">${dateAffichee}</span>
                    </div>
                </div>
            `;

            listeActivites.innerHTML += itemHTML;
        });

        // Re-déclencher Lucide pour appliquer les icônes sur les nouveaux éléments injectés
        if (window.lucide) {
            window.lucide.createIcons();
        }
    });
}
// --- 3. ENREGISTREMENT DU SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('Service Worker enregistré avec succès ! Portée :', reg.scope))
            .catch((err) => console.error('Échec de l\'enregistrement du Service Worker :', err));
    });
}
