// js/activite.js - Logique exclusive du formulaire (Création et Modification)
import { db } from "../config/app.js";
import { 
    doc, 
    getDoc, 
    collection, 
    addDoc, 
    updateDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// 1. Récupération de l'ID de l'activité dans l'URL (?id=XXXXXXXXXXXX)
const parametres = new URLSearchParams(window.location.search);
const idActivite = parametres.get('id');

const formActivite = document.getElementById('form-nouvelle-activite');
const btnSubmit = formActivite ? formActivite.querySelector('button[type="submit"]') : null;

// Éléments du formulaire à cibler
const champs = {
    date: document.getElementById('input-date'),
    heureDebut: document.getElementById('input-heure-debut'),
    heureFin: document.getElementById('input-heure-fin'),
    type: document.getElementById('select-type'),
    typePrecise: document.getElementById('input-autre-type'),
    wrapperAutreType: document.getElementById('wrapper-autre-type'),
    moderateur: document.getElementById('input-moderateur'),
    predicateur: document.getElementById('input-predicateur'),
    theme: document.getElementById('input-theme'),
    participants: document.getElementById('input-participants'),
    nouveaux: document.getElementById('input-nouveaux'),
    engages: document.getElementById('input-engages'),
    offrandes: document.getElementById('input-offrandes'),
    remarques: document.getElementById('textarea-remarques')
};

// 2. Si un ID existe, on bascule en mode "Consultation / Modification"
if (idActivite && formActivite) {
    chargerActivitePourModification(idActivite);
}

async function chargerActivitePourModification(id) {
    try {
        if (btnSubmit) {
            btnSubmit.innerHTML = `<div class="w-4 h-4 border-2 border-rich-black border-t-transparent rounded-full animate-spin"></div> Chargement...`;
            btnSubmit.disabled = true;
        }

        const docRef = doc(db, "activites", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const donnees = docSnap.data();

            // Pré-remplissage des champs du formulaire
            if (champs.date) champs.date.value = donnees.dateRencontre || "";
            if (champs.heureDebut) champs.heureDebut.value = donnees.heureDebut || "";
            if (champs.heureFin) champs.heureFin.value = donnees.heureFin || "";
            if (champs.type) champs.type.value = donnees.type || "Culte ordinaire";
            
            // Gestion spécifique du champ "Autres (Préciser...)"
            if (donnees.type === "Autres" && champs.wrapperAutreType && champs.typePrecise) {
                champs.wrapperAutreType.classList.remove('hidden');
                champs.typePrecise.setAttribute('required', 'required');
                champs.typePrecise.value = donnees.typePrecise || "";
            }

            if (champs.moderateur) champs.moderateur.value = donnees.moderateur || "";
            if (champs.predicateur) champs.predicateur.value = donnees.predicateur || "";
            if (champs.theme) champs.theme.value = donnees.theme || "";
            if (champs.participants) champs.participants.value = donnees.participants || 0;
            if (champs.nouveaux) champs.nouveaux.value = donnees.nouveauxVenus || 0;
            if (champs.engages) champs.engages.value = donnees.lesEngages || 0;
            if (champs.offrandes) champs.offrandes.value = donnees.offrandes || "";
            if (champs.remarques) champs.remarques.value = donnees.remarques || "";

            // Modification visuelle du bouton de soumission
            if (btnSubmit) {
                btnSubmit.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i> Mettre à jour l'activité`;
                btnSubmit.disabled = false;
                if (window.lucide) window.lucide.createIcons();
            }
        } else {
            alert("Cette activité n'existe pas ou a été supprimée.");
            window.location.href = "../index.html";
        }
    } catch (erreur) {
        console.error("Erreur lors du chargement de l'activité :", erreur);
        alert("Impossible de charger les détails de l'activité.");
    }
}

// 3. Gestion de la soumission du formulaire (Création OU Mise à jour)
if (formActivite) {
    formActivite.addEventListener('submit', async (e) => {
        e.preventDefault();

        const texteInitialBouton = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = idActivite ? "Mise à jour..." : "Enregistrement...";

        // Collecte et structuration des données
        const payloadActivite = {
            dateRencontre: champs.date.value,
            heureDebut: champs.heureDebut.value,
            heureFin: champs.heureFin.value,
            type: champs.type.value,
            typePrecise: champs.type.value === 'Autres' ? champs.typePrecise.value : "",
            moderateur: champs.moderateur.value,
            predicateur: champs.predicateur.value,
            theme: champs.theme.value,
            participants: parseInt(champs.participants.value) || 0,
            nouveauxVenus: parseInt(champs.nouveaux.value) || 0,
            lesEngages: parseInt(champs.engages.value) || 0,
            offrandes: champs.offrandes.value,
            remarques: champs.remarques.value,
            derniereModification: serverTimestamp() // Idéal pour suivre les modifications
        };

        try {
            if (idActivite) {
                // MODE ENREGISTRÉ : Mise à jour de l'existant via son ID
                const docRef = doc(db, "activites", idActivite);
                await updateDoc(docRef, payloadActivite);
                alert("Activité mise à jour avec succès !");
            } else {
                // MODE NOUVEAU : Ajout d'un nouveau document
                payloadActivite.dateEnregistrement = serverTimestamp(); // Date de création initiale
                await addDoc(collection(db, "activites"), payloadActivite);
                alert("Nouvelle activité enregistrée avec succès !");
            }

            // Retour automatique au tableau de bord
            window.location.href = "../index.html";

        } catch (erreur) {
            console.error("Erreur d'écriture Firestore :", erreur);
            alert("Une erreur réseau est survenue. Veuillez réessayer.");
            
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = texteInitialBouton;
        }
    });
}
