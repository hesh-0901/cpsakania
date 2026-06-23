// js/index.js - Logique exclusive de la page d'accueil avec pagination
import { db } from "../config/app.js";
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// --- GESTION DES REQUÊTES & PAGINATION ---
let toutesLesActivites = [];
let pageActuelle = 1;
const elementsParPage = 4;

const listeActivites = document.getElementById('liste-activites');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const txtCurrentPage = document.getElementById('current-page');
const txtTotalPages = document.getElementById('total-pages');

// Affichage du flux de la date du jour (Lubumbashi)
const dateFlux = document.getElementById('date-flux');
if (dateFlux) {
    const aujourdhui = new Date();
    dateFlux.innerHTML = `
        <i data-lucide="calendar" class="w-4 h-4 text-mountain-meadow"></i>
        <span>${aujourdhui.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    `;
}

// Écouteur en temps réel de Firebase
const q = query(collection(db, "activites"), orderBy("dateRencontre", "desc"));

onSnapshot(q, (snapshot) => {
    toutesLesActivites = [];
    
    snapshot.forEach((doc) => {
        toutesLesActivites.push({
            id: doc.id,
            ...doc.data()
        });
    });

    // Recalculer les compteurs globaux du tableau de bord
    calculerStatistiques(toutesLesActivites);

    // Mettre à jour l'affichage de la page actuelle
    afficherPage(pageActuelle);
});

// Calcul des blocs statistiques du haut
function calculerStatistiques(activites) {
    const statReunions = document.getElementById('stat-reunions');
    const statMembres = document.getElementById('stat-membres');
    const statPresence = document.getElementById('stat-presence');
    const statSocial = document.getElementById('stat-social');

    if (!activites.length) {
        if (statReunions) statReunions.innerText = "0";
        if (statMembres) statMembres.innerText = "0";
        if (statPresence) statPresence.innerText = "0%";
        if (statSocial) statSocial.innerText = "0";
        return;
    }

    // 1. Réunions ce mois
    if (statReunions) statReunions.innerText = activites.length;
    document.getElementById('evolution-reunions').innerText = "Total des rencontres";

    // 2. Cumul des participants (Simulé ou basé sur le dernier culte pour les membres actifs)
    const dernierCulte = activites[0];
    if (statMembres) statMembres.innerText = dernierCulte.participants || 0;
    document.getElementById('evolution-membres').innerText = "Au dernier culte";

    // 3. Évolution des nouveaux engagés
    const totalEngages = activites.reduce((acc, curr) => acc + (curr.lesEngages || 0), 0);
    if (statPresence) statPresence.innerText = `+${totalEngages}`;
    document.getElementById('evolution-presence').innerText = "Nouveaux engagés cumulés";

    // 4. Descentes évangéliques ou actions spéciales
    const actionsEvangeliques = activites.filter(act => act.type === "Descente évangélique").length;
    if (statSocial) statSocial.innerText = actionsEvangeliques;
    document.getElementById('evolution-social').innerText = "Descentes évangéliques";
}

// Rendu de la page spécifique
function afficherPage(page) {
    if (!listeActivites) return;
    listeActivites.innerHTML = "";

    if (toutesLesActivites.length === 0) {
        listeActivites.innerHTML = `
            <div class="p-6 text-center text-stone text-sm bg-rich-black/30 border border-pine rounded-xl">
                Aucune activité enregistrée pour le moment.
            </div>`;
        mettreAjourBoutonsPagination(0);
        return;
    }

    const totalPages = Math.ceil(toutesLesActivites.length / elementsParPage);
    if (page > totalPages) page = totalPages;
    pageActuelle = page;

    // Découpage du tableau pour l'affichage des 4 éléments de la page active
    const indexDebut = (pageActuelle - 1) * elementsParPage;
    const indexFin = indexDebut + elementsParPage;
    const activitesVisibles = toutesLesActivites.slice(indexDebut, indexFin);

    activitesVisibles.forEach((donnees) => {
        // Formatage de la date de la rencontre (champ du formulaire)
        let dateFormatee = "Date inconnue";
        if (donnees.dateRencontre) {
            const fragments = donnees.dateRencontre.split('-');
            if (fragments.length === 3) {
                dateFormatee = `${fragments[2]}/${fragments[1]}`;
            }
        }

        // Assignation dynamique de l'icône selon le type
        let icone = "book-open";
        let couleurIcone = "text-mountain-meadow";
        if (donnees.type.includes("Veillée") || donnees.type.includes("Prière")) {
            icone = "flame";
            couleurIcone = "text-caribbean-green";
        } else if (donnees.type.includes("Descente") || donnees.type.includes("évangélique")) {
            icone = "compass";
            couleurIcone = "text-caribbean-green";
        }

        // Injection du HTML de l'activité avec gestion optimisée PC / Téléphone
        // Ajout de cursor-pointer pour indiquer visuellement le clic
        const itemHTML = `
            <div data-id="${donnees.id}" class="item-activite p-4 bg-rich-black/50 border border-pine rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-caribbean-green/50 hover:bg-pine/10 transition cursor-pointer select-none">
                <div class="flex items-start gap-3">
                    <div class="p-2 bg-bangladesh-green/20 border border-bangladesh-green/40 rounded-lg ${couleurIcone} shrink-0 mt-0.5">
                        <i data-lucide="${icone}" class="w-4 h-4"></i>
                    </div>
                    <div class="min-w-0 flex-1">
                        <h4 class="font-bold text-sm text-anti-flash-white truncate">
                            ${donnees.type === 'Autres' ? donnees.typePrecise : donnees.type}
                        </h4>
                        <p class="text-xs text-stone mt-0.5 truncate">
                            Thème : <span class="text-anti-flash-white font-medium">"${donnees.theme}"</span>
                        </p>
                        <p class="text-[11px] text-stone mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                            <span>Mod. : <span class="text-mint font-medium">${donnees.moderateur}</span></span>
                            <span class="text-pine">|</span>
                            <span>Préd. : <span class="text-mountain-meadow font-medium">${donnees.predicateur}</span></span>
                        </p>
                    </div>
                </div>
                
                <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-pine/30 sm:border-0">
                    <div class="text-[11px] text-stone">
                        Présents : <span class="text-anti-flash-white font-semibold">${donnees.participants}</span>
                    </div>
                    <span class="px-2 py-0.5 bg-mint/10 text-mint rounded-full text-xs font-semibold border border-mint/20 whitespace-nowrap">
                        ${donnees.offrandes}
                    </span>
                    <span class="text-xs font-medium text-mountain-meadow bg-pine/40 px-2 py-0.5 rounded border border-pine whitespace-nowrap">
                        ${dateFormatee}
                    </span>
                </div>
            </div>
        `;
        listeActivites.innerHTML += itemHTML;
    });

    // Rendre les icônes injectées visibles
    if (window.lucide) window.lucide.createIcons();

    // Activer l'écouteur de clic sur chaque conteneur d'activité pour réouverture
    attacherEvenementsClic();

    // Ajuster l'état des boutons de navigation
    mettreAjourBoutonsPagination(totalPages);
}

// Gestion des états graphiques des boutons Précédent / Suivant
function mettreAjourBoutonsPagination(totalPages) {
    if (txtCurrentPage) txtCurrentPage.innerText = pageActuelle;
    if (txtTotalPages) txtTotalPages.innerText = totalPages === 0 ? "1" : totalPages;

    if (btnPrev) btnPrev.disabled = (pageActuelle <= 1);
    if (btnNext) btnNext.disabled = (pageActuelle >= totalPages || totalPages === 0);
}

// Redirection au clic vers le formulaire avec injection de l'ID dans l'URL
function attacherEvenementsClic() {
    const cartes = document.querySelectorAll('.item-activite');
    cartes.forEach(carte => {
        carte.addEventListener('click', () => {
            const idActivite = carte.getAttribute('data-id');
            if (idActivite) {
                // Renvoyer vers le dossier formulaire avec le paramètre d'identification
                window.location.href = `formulaires/activite.html?id=${idActivite}`;
            }
        });
    });
}

// Événements sur les boutons de navigation de la pagination
if (btnPrev) {
    btnPrev.addEventListener('click', () => {
        if (pageActuelle > 1) {
            pageActuelle--;
            afficherPage(pageActuelle);
        }
    });
}

if (btnNext) {
    btnNext.addEventListener('click', () => {
        const totalPages = Math.ceil(toutesLesActivites.length / elementsParPage);
        if (pageActuelle < totalPages) {
            pageActuelle++;
            afficherPage(pageActuelle);
        }
    });
}
