// formulaires/activite.js - Gestion du formulaire de capture
import { db } from "../config/app.js"; // IMPORTATION DE LA DB CENTRALISÉE
import { 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const form = document.getElementById('form-nouvelle-activite');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Récupération des données du formulaire par position/ID
        const dateRencontre = form.querySelectorAll('input')[0].value;
        const heureDebut = form.querySelectorAll('input')[1].value;
        const heureFin = form.querySelectorAll('input')[2].value;
        const typeActivite = document.getElementById('select-type').value;
        const typePrecise = document.getElementById('input-autre-type').value;
        
        const moderateur = form.querySelectorAll('input')[4].value;
        const predicateur = form.querySelectorAll('input')[5].value;
        const theme = form.querySelectorAll('input')[6].value;
        
        const participants = parseInt(form.querySelectorAll('input')[7].value) || 0;
        const nouveauxVenus = parseInt(form.querySelectorAll('input')[8].value) || 0;
        const engages = parseInt(form.querySelectorAll('input')[9].value) || 0;
        const offrandes = form.querySelectorAll('input')[10].value;

        // Feedback Visuel du bouton
        const btnSubmit = form.querySelector('button[type="submit"]');
        const textOrigine = btnSubmit.innerHTML;
        btnSubmit.innerHTML = "Enregistrement en cours...";
        btnSubmit.disabled = true;

        try {
            // Envoi à Firestore
            await addDoc(collection(db, "activites"), {
                dateRencontre,
                heureDebut,
                heureFin,
                type: typeActivite,
                typePrecise: typeActivite === "Autres" ? typePrecise : "",
                moderateur,
                predicateur,
                theme,
                participants,
                nouveauxVenus,
                engages,
                offrandes,
                cellule: "Sakania",
                dateEnregistrement: serverTimestamp()
            });

            alert("Activité de la cellule Sakania enregistrée avec succès !");
            form.reset();
            
            // Redirection vers le tableau de bord après succès
            window.location.href = "../index.html";

        } catch (error) {
            console.error("Erreur d'écriture Firestore: ", error);
            alert("Une erreur est survenue. Vérifiez votre connexion.");
        } finally {
            btnSubmit.innerHTML = textOrigine;
            btnSubmit.disabled = false;
        }
    });
}
