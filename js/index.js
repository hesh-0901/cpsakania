// js/index.js - Logique exclusive de la page d'accueil avec pagination
import { db } from "../config/app.js";
import { 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// --- INITIALISATION & VARIABLES DE PAGINATION ---
let toutesLesActivites = [];
let pageActuelle = 1;
const elementsParPage = 4;

const listeActivites = document.getElementById('liste-activites');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const txtCurrentPage = document.getElementById('current-page');
const txtTotalPages = document.getElementById('total-pages');

// Affichage dynamique de la date du jour sur le tableau de bord
const dateFlux = document.getElementById('date-flux');
if (dateFlux) {
    const aujourdhui = new Date();
    dateFlux.innerHTML = `
        <i data-lucide="calendar" class="w-4 h-4 text-mountain-meadow"></i>
        <span>${aujourdhui.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
    `;
}

// Requête Firestore ordonnée par date de rencontre décroissante
const q = query(collection(db, "activites"), orderBy("dateRencontre", "desc"));

// Écouteur de flux en direct
onSnapshot(q, (snapshot) => {
    toutesLesActivites = [];
    
    snapshot.forEach((doc) => {
        toutesLesActivites.push({
            id: doc.id,
            ...doc.data()
        });
    });

    // Recalcul automatique des blocs de statistiques en haut
    calculerStatistiques(toutesLesActivites);

    // Mettre à jour et rafraîchir l'affichage de la page courante
    afficherPage(pageActuelle);
});

// Traitement des données pour alimenter les compteurs du tableau de bord
function calculerStatistiques(activites) {
    const statReunions = document.getElementById('stat-reunions');
    const statMembres = document.getElementById('stat-membres');
    const statPresence = document.getElementById('stat-presence');
    const statSocial = document.getElementById('stat-social');

    if (!activites.length) {
        if (statReunions) statReunions.innerText = "0";
        if (statMembres) statMembres.innerText = "0";
        if (statPresence) statPresence.innerText = "0";
        if (statSocial) statSocial.innerText = "0";
        return;
    }

    // 1. Nombre total de réunions enregistrées
    if (statReunions) statReunions.innerText = activites.length;
    const evoReunions = document.getElementById('evolution-reunions');
    if (evoReunions) evoReunions.innerText = "Total des rencontres";

    // 2. Présence enregistrée au tout dernier culte (index 0 car trié par date)
    const dernierCulte = activites[0];
    if (statMembres) statMembres.innerText = dernierCulte.participants || 0;
    const evoMembres = document.getElementById('evolution-membres');
    if (evoMembres) evoMembres.innerText = "Au dernier culte";

    // 3. Cumul total de tous les nouveaux engagés enregistrés
    const totalEngages = activites.reduce((acc, curr) => acc + (parseInt(curr.lesEngages) || 0), 0);
    if (statPresence) statPresence.innerText = `+${totalEngages}`;
    const evoPresence = document.getElementById('evolution-presence');
    if (evoPresence) evoPresence.innerText = "Nouveaux engagés cumulés";

    // 4. Nombre de descentes évangéliques comptabilisées
    const actionsEvangeliques = activites.filter(act => act.type === "Descente évangélique").length;
    if (statSocial) statSocial.innerText = actionsEvangeliques;
    const evoSocial = document.getElementById('evolution-social');
    if (evoSocial) evoSocial.innerText = "Descentes évangéliques";
}

// Découpage et injection HTML des activités (Optimisé PC & Smartphone)
function afficherPage(page) {
    if (!listeActivites) return;
    listeActivites.innerHTML = "";

    if (toutesLesActivites.length === 0) {
        listeActivites.innerHTML = `
            <div class="p-8 text-center text-stone text-sm bg-rich-black/30 border border-pine rounded-xl">
                Aucune activité enregistrée pour le moment.
            </div>`;
        mettreAjourBoutonsPagination(0);
        return;
    }

    const totalPages = Math.ceil(toutesLesActivites.length / elementsParPage);
    if (page > totalPages) page = totalPages;
    pageActuelle = page;

    // Extraction des 4 fiches de la page courante
    const indexDebut = (pageActuelle - 1) * elementsParPage;
    const indexFin = indexDebut + elementsParPage;
    const activitesVisibles = toutesLesActivites.slice(indexDebut, indexFin);

    activitesVisibles.forEach((donnees) => {
        // Redimensionnement de la date (AAAA-MM-JJ en JJ/MM)
        let dateFormatee = "—";
        if (donnees.dateRencontre) {
            const fragments = donnees.dateRencontre.split('-');
            if (fragments.length === 3) {
                dateFormatee = `${fragments[2]}/${fragments[1]}`;
            }
        }

        // Attribution d'une icône cohérente selon la catégorie
        let icone = "book-open";
        let couleurIcone = "text-mountain-meadow";
        if (donnees.type && (donnees.type.includes("Veillée") || donnees.type.includes("Prière"))) {
            icone = "flame";
            couleurIcone = "text-caribbean-green";
        } else if (donnees.type && (donnees.type.includes("Descente") || donnees.type.includes("évangélique"))) {
            icone = "compass";
            couleurIcone = "text-caribbean-green";
        }

        // Rendu structurel flexible et cliquable (`cursor-pointer`)
        const itemHTML = `
            <div data-id="${donnees.id}" class="item-activite p-4 bg-rich-black/50 border border-pine rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-caribbean-green/50 hover:bg-pine/10 transition cursor-pointer select-none">
                <div class="flex items-start gap-3 min-w-0">
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
                        <div class="text-[11px] text-stone mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span class="truncate">Mod. : <span class="text-mint font-medium">${donnees.moderateur}</span></span>
                            <span class="text-pine hidden sm:inline">|</span>
                            <span class="truncate">Préd. : <span class="text-mountain-meadow font-medium">${donnees.predicateur}</span></span>
                        </div>
                    </div>
                </div>
                
                <div class="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t border-pine/30 sm:border-0 shrink-0">
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

    // Forcer Lucide à dessiner les icônes injectées
    if (window.lucide) window.lucide.createIcons();

    // Associer les écouteurs de clics pour la réouverture des formulaires
    attacherEvenementsClic();

    // Adapter l'activation des boutons Précédent / Suivant
    mettreAjourBoutonsPagination(totalPages);
}

// Contrôle de l'état graphique et technique de la pagination
function mettreAjourBoutonsPagination(totalPages) {
    if (txtCurrentPage) txtCurrentPage.innerText = pageActuelle;
    if (txtTotalPages) txtTotalPages.innerText = totalPages === 0 ? "1" : totalPages;

    if (btnPrev) btnPrev.disabled = (pageActuelle <= 1);
    if (btnNext) btnNext.disabled = (pageActuelle >= totalPages || totalPages === 0);
}

// Redirection dynamique : Ajoute l'ID unique de Firestore dans l'URL de destination
function attacherEvenementsClic() {
    const cartes = document.querySelectorAll('.item-activite');
    cartes.forEach(carte => {
        carte.addEventListener('click', () => {
            const idActivite = carte.getAttribute('data-id');
            if (idActivite) {
                window.location.href = `formulaires/activite.html?id=${idActivite}`;
            }
        });
    });
}

// Événement d'appui sur le bouton "Précédent"
if (btnPrev) {
    btnPrev.addEventListener('click', () => {
        if (pageActuelle > 1) {
            pageActuelle--;
            afficherPage(pageActuelle);
        }
    });
}

// Événement d'appui sur le bouton "Suivant"
if (btnNext) {
    btnNext.addEventListener('click', () => {
        const totalPages = Math.ceil(toutesLesActivites.length / elementsParPage);
        if (pageActuelle < totalPages) {
            pageActuelle++;
            afficherPage(pageActuelle);
        }
    });
}
