// config/app.js - Centralisation Firebase et Gestion des Pages
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    onSnapshot, 
    query, 
    orderBy,
    addDoc,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Configuration unique et centralisée
const firebaseConfig = {
  apiKey: "AIzaSyAqacvHCgwKJi3aqxZUszUy_Ieyfoa9_Bg",
  authDomain: "cellulesakania.firebaseapp.com",
  projectId: "cellulesakania",
  storageBucket: "cellulesakania.firebasestorage.app",
  messagingSenderId: "241179092278",
  appId: "1:241179092278:web:415b0af94473730635bf97",
  measurementId: "G-43T1367967"
};

// Initialisation
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// --- LECTURE EN TEMPS RÉEL (Pour index.html) ---
const listeActivites = document.getElementById('liste-activites');

if (listeActivites) {
    const q = query(collection(db, "activites"), orderBy("dateEnregistrement", "desc"));

    onSnapshot(q, (snapshot) => {
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

            let icone = "book-open";
            let couleurIcone = "text-mountain-meadow";
            if (donnees.type.includes("Prière") || donnees.type.includes("Intercession") || donnees.type.includes("Veillée")) {
                icone = "flame";
                couleurIcone = "text-caribbean-green";
            } else if (donnees.type.includes("Évangélisation") || donnees.type.includes("Descente")) {
                icone = "compass";
                couleurIcone = "text-caribbean-green";
            }

            const itemHTML = `
                <div class="p-4 bg-rich-black/50 border border-pine rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-mountain-meadow/30 transition">
                    <div class="flex items-start gap-3">
                        <div class="p-2 bg-bangladesh-green/20 border border-bangladesh-green/40 rounded-lg ${couleurIcone} mt-0.5">
                            <i data-lucide="${icone}" class="w-4 h-4"></i>
                        </div>
                        <div>
                            <h4 class="font-semibold text-sm">${donnees.type === 'Autres' ? donnees.typePrecise : donnees.type}</h4>
                            <p class="text-xs text-stone mt-0.5">
                                Thème : <span class="text-anti-flash-white font-medium">"${donnees.theme}"</span> | 
                                Présents : <span class="text-anti-flash-white font-medium">${donnees.participants}</span>
                            </p>
                            <p class="text-[11px] text-stone mt-1">
                                Modérateur : <span class="text-mint">${donnees.moderateur}</span> | 
                                Prédicateur : <span class="text-mountain-meadow">${donnees.predicateur}</span>
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between sm:justify-end gap-4">
                        <span class="px-2.5 py-1 bg-mint/10 text-mint rounded-full text-xs font-medium border border-mint/20">${donnees.offrandes}</span>
                        <span class="text-xs text-stone whitespace-nowrap">${dateAffichee}</span>
                    </div>
                </div>
            `;
            listeActivites.innerHTML += itemHTML;
        });

        if (window.lucide) window.lucide.createIcons();
    });
}

// --- ÉCRITURE DANS LA BASE DE DONNÉES (Pour activite.html) ---
const formActivite = document.getElementById('form-nouvelle-activite');

if (formActivite) {
    formActivite.addEventListener('submit', async (e) => {
        e.preventDefault(); // Stoppe le rechargement de la page

        const btnSubmit = formActivite.querySelector('button[type="submit"]');
        const texteInitial = btnSubmit.innerHTML;

        try {
            // Effet visuel d'attente
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `Enregistrement...`;

            // Collecte des informations du formulaire
            const nouvelleActivite = {
                dateRencontre: document.getElementById('input-date').value,
                heureDebut: document.getElementById('input-heure-debut').value,
                heureFin: document.getElementById('input-heure-fin').value,
                type: document.getElementById('select-type').value,
                typePrecise: document.getElementById('input-autre-type').value || "",
                moderateur: document.getElementById('input-moderateur').value,
                predicateur: document.getElementById('input-predicateur').value,
                theme: document.getElementById('input-theme').value,
                participants: parseInt(document.getElementById('input-participants').value) || 0,
                nouveauxVenus: parseInt(document.getElementById('input-nouveaux').value) || 0,
                lesEngages: parseInt(document.getElementById('input-engages').value) || 0,
                offrandes: document.getElementById('input-offrandes').value,
                remarques: document.getElementById('textarea-remarques').value || "",
                dateEnregistrement: serverTimestamp() // Heure de Firebase pour le tri de l'index
            };

            // Écriture Firestore dans la collection "activites"
            await addDoc(collection(db, "activites"), nouvelleActivite);

            alert("Activité de la cellule enregistrée avec succès !");
            window.location.href = "../index.html"; // Redirection automatique

        } catch (erreur) {
            console.error("Détails de l'erreur Firebase : ", erreur);
            alert("Erreur réseau. Impossible d'enregistrer l'activité.");
            
            // Remise à l'état initial du bouton si ça rate
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = texteInitial;
        }
    });
}

// --- ENREGISTREMENT DU SERVICE WORKER (PWA) ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((reg) => console.log('PWA active. scope:', reg.scope))
            .catch((err) => console.error('Erreur SW:', err));
    });
}
