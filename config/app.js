import { db } from "./app.js"; // Importe l'instance Firestore déjà configurée
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const formActivite = document.getElementById('form-nouvelle-activite');

if (formActivite) {
    formActivite.addEventListener('submit', async (e) => {
        e.preventDefault(); // Empêche le rechargement de la page

        // Récupération des boutons pour gérer l'état visuel du chargement
        const btnSubmit = formActivite.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit.innerHTML;
        
        try {
            // Désactiver le bouton pendant l'envoi
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `Enregistrement en cours...`;

            // Récupération de toutes les valeurs du formulaire
            const nouvelleActivite = {
                date: document.getElementById('input-date').value,
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
                dateEnregistrement: serverTimestamp() // Stocke l'heure précise du serveur pour le tri
            };

            // Envoi de l'objet dans la collection "activites" sur Firestore
            await addDoc(collection(db, "activites"), nouvelleActivite);

            // Message de succès et redirection vers la page d'accueil
            alert("Activité enregistrée avec succès !");
            window.location.href = "../index.html";

        } catch (error) {
            console.error("Erreur lors de l'enregistrement : ", error);
            alert("Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
            
            // Réactiver le bouton en cas d'échec
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnText;
        }
    });
}
